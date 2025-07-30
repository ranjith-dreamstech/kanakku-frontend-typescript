import { useEffect, useState, useRef } from "react";
import type { FC, ChangeEvent, FormEvent } from "react";
import Constants from "../../../constants/api";
import axios, { AxiosError } from "axios";
import Table from "../../../components/admin/Tabls";
import { EditIcon, TrashIcon, MoreVertical, Upload } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Define the interface for a Category object to ensure type safety
interface Category {
    _id: string;
    category_name: string;
    slug: string;
    status: boolean;
    categoryImageUrl: string;
    category_image?: File; // Optional: Used only for form state when uploading a new image
}

// Define a type for the form errors state
type FormErrors = {
    [key: string]: string;
};

// Define the component as a Functional Component (FC)
const CategoryList: FC = () => {
    // State variables with explicit TypeScript types
    const [showModal, setShowModal] = useState<boolean>(false);
    const [category, setCategory] = useState<Partial<Category>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const { token } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<Category | null>(null);
    const [search, setSearch] = useState<string>("");
    const [perPage, setPerPage] = useState<number>(10);
    const [filteredData, setFiltered] = useState<Category[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
        const handleClickOutside = (event: MouseEvent) => {
            const clickedInside = dropdownRef.current.some(
                (ref) => ref && ref.contains(event.target as Node)
            );
            if (!clickedInside) {
                setActiveDropdownIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter categories based on search input
    useEffect(() => {
        const filtered = categories.filter(
            (categoryItem) =>
                categoryItem.category_name.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(filtered);
    }, [search, categories]);

    // Pagination logic
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentCategories = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / perPage);

    // Fetch categories from the API
    const fetchCategories = async () => {
        try {
            const response = await axios.get<Category[]>(Constants.FETCH_CATEGORY_LIST_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategories(response.data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to fetch categories.");
        }
    };

    // Update the status of a category
    const updateStatus = async (categoryItem: Category) => {
        try {
            const updatedCategory = { ...categoryItem, status: !categoryItem.status };
            await axios.put(`${Constants.UPDATE_CATEGORY_URL}/${categoryItem._id}`, updatedCategory, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Status updated successfully');
            fetchCategories();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status.');
        }
    };

    // Handle image selection from the file input
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; // Use optional chaining for safety
        if (file && file.size <= 5 * 1024 * 1024) {
            setCategory({
                ...category,
                category_image: file,
                categoryImageUrl: URL.createObjectURL(file),
            });
        } else {
            toast.error("Please upload a JPG or PNG image under 5MB.");
        }
    };

    // Handle the click event for editing a category
    const handleEditClick = async (categoryItem: Category) => {
        try {
            const response = await axios.get<Category>(`${Constants.GET_CATEGORY_URL}/${categoryItem._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategory(response.data);
            setIsEditMode(true);
            setFormErrors({});
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load category:', error);
            toast.error('Failed to load category data for editing.');
        }
    }

    // Handle form submission for creating or updating a category
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormErrors({});

        const formData = new FormData();
        formData.append("category_name", category.category_name ?? "");
        formData.append("slug", category.slug ?? "");
        formData.append("status", String(category.status ?? true));
        if (category.category_image) {
            formData.append("category_image", category.category_image);
        }

        try {
            const url = isEditMode
                ? `${Constants.UPDATE_CATEGORY_URL}/${category._id}`
                : Constants.CREATE_CATEGORY_URL;
            const method = isEditMode ? 'put' : 'post';

            await axios[method](url, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success(`Category ${isEditMode ? 'updated' : 'added'} successfully`);
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.data && (axiosError.response.data as { errors: FormErrors }).errors) {
                setFormErrors((axiosError.response.data as { errors: FormErrors }).errors);
            } else {
                console.error("Error submitting form:", error);
                toast.error("An unexpected error occurred.");
            }
        }
    }

    // Handle the click event for deleting a category
    const handleDeleteClick = (categoryItem: Category) => {
        setItemToDelete(categoryItem);
        setDeleteModalOpen(true);
    }

    // Confirm and execute the deletion of a category
    const confirmDelete = async () => {
        if (!itemToDelete) return; // Type guard
        try {
            await axios.delete(`${Constants.DELETE_CATEGORY_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Category deleted successfully');
            fetchCategories();
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Failed to delete category.');
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="text-gray-800 min-h-full">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Categories</h1>
                    <button
                        onClick={() => {
                            setShowModal(true);
                            setFormErrors({});
                            setCategory({});
                            setIsEditMode(false);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow cursor-pointer"
                    >
                        + New Category
                    </button>
                </div>
            </div>
            {/* Search and Per Page controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-auto text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>
            {/* Table */}
            <Table headers={["#", "Category Name", "Slug", "Status", "Actions"]}>
                {currentCategories.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-4">No categories found</td></tr>
                ) : (
                    currentCategories.map((categoryItem, index) => (
                        <tr key={categoryItem._id} ref={ref => (dropdownRef.current[index] = ref)} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-1">{indexOfFirst + index + 1}</td>
                            <td className="font-semibold text-gray-600 px-4 py-1">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={categoryItem.categoryImageUrl}
                                        alt={categoryItem.category_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span>{categoryItem.category_name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-1">{categoryItem.slug}</td>
                            <td className="px-4 py-1">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={categoryItem.status}
                                        onChange={() => updateStatus(categoryItem)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500 transition-all duration-300">
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${categoryItem.status ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                    </div>
                                </label>
                            </td>
                            <td>
                                <div className="relative inline-block text-left">
                                    <button
                                        onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                                    >
                                        <MoreVertical size={18} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    {activeDropdownIndex === index && (
                                        <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                            <button
                                                onClick={() => handleEditClick(categoryItem)}
                                                className="w-full flex items-center px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                            >
                                                <EditIcon className="mr-2" size={16} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(categoryItem)}
                                                className="w-full flex items-center px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                            >
                                                <TrashIcon className="mr-2" size={16} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </Table>
            {/* Pagination */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                    Showing {filteredData.length > 0 ? indexOfFirst + 1 : 0} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} entries
                </p>
                <div className="space-x-2 text-sm">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 text-gray-600"
                    >
                        Previous
                    </button>
                    <span className="font-semibold text-gray-600">{currentPage}</span>
                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 text-gray-600"
                    >
                        Next
                    </button>
                </div>
            </div>
            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Edit Category' : 'Add New Category'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image <span className="text-red-500">*</span></label>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                                {category.categoryImageUrl ? (
                                    <img src={category.categoryImageUrl} alt="Category Preview" className="w-full h-full object-cover rounded" />
                                ) : (
                                    <Upload className="text-purple-500 w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Image
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 5MB.</p>
                            </div>
                        </div>
                        {formErrors.category_image && <p className="text-red-500 text-xs mt-1">{formErrors.category_image}</p>}
                    </div>

                    <div>
                        <label htmlFor="category_name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                            id="category_name"
                            type="text"
                            value={category.category_name ?? ""}
                            onChange={(e) => setCategory({ ...category, category_name: e.target.value })}
                            placeholder="Enter Category Name"
                            className="w-full text-gray-600 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        {formErrors.category_name && <p className="text-red-500 text-xs mt-1">{formErrors.category_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug <span className="text-red-500">*</span></label>
                        <input
                            id="slug"
                            type="text"
                            value={category.slug ?? ""}
                            onChange={(e) => setCategory({ ...category, slug: e.target.value })}
                            placeholder="Enter Category Slug"
                            className="w-full text-gray-600 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">
                            {isEditMode ? 'Update' : 'Add New'}
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">
                    Are you sure you want to delete <strong>{itemToDelete?.category_name}</strong>?
                </p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default CategoryList;