import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { FC, ChangeEvent, FormEvent } from "react";
import Constants from "../../../constants/api";
import axios, { AxiosError } from "axios";
import Table from "../../../components/admin/Table";
import PaginationWrapper from "../../../components/admin/PaginationWrapper";
import { EditIcon, TrashIcon, MoreVertical, Upload } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Interface for the Category data object
interface Category {
    _id: string;
    category_name: string;
    slug: string;
    status: boolean;
    categoryImageUrl: string;
}

// Interface for the form state, including a potential file upload
interface CategoryFormState extends Omit<Partial<Category>, 'status'> {
    status?: boolean;
    category_image?: File | null;
}

// Interface for pagination data from the API
interface CategoryPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Define a type for the form errors state
type FormErrors = {
    [key: string]: string;
};

const CategoryList: FC = () => {
    // Hooks and State
    const { token } = useSelector((state: RootState) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();

    // Component State
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState<CategoryPagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [category, setCategory] = useState<CategoryFormState>({});
    const [showModal, setShowModal] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Dropdown and Delete Modal State
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<Category | null>(null);

    // Get params from URL
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    // Fetch categories based on search and pagination params
    const fetchCategories = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.FETCH_CATEGORY_LIST_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Assuming API response format is { data: { categories: [], pagination: {} } }
            setCategories(response.data.data.categories || []);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to fetch categories.");
        }
    };

    // Effect to fetch data when URL params change
    useEffect(() => {
        fetchCategories(search, limit, page);
    }, [search, limit, page]);

    // Effect to handle clicks outside dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current.every(ref => ref && !ref.contains(event.target as Node))) {
                setActiveDropdownIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handlers for search and pagination controls
    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    // CRUD Operations
    const updateStatus = async (categoryItem: Category) => {
        try {
            const updatedCategory = { ...categoryItem, status: !categoryItem.status };
            await axios.put(`${Constants.UPDATE_CATEGORY_URL}/${categoryItem._id}`, updatedCategory, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Status updated successfully');
            fetchCategories(search, limit, page); // Refetch current page
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status.');
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            setCategory({
                ...category,
                category_image: file,
                categoryImageUrl: URL.createObjectURL(file),
            });
        } else if (file) {
            toast.error("Please upload a JPG or PNG image under 5MB.");
        }
    };

    const handleEditClick = async (categoryItem: Category) => {
        try {
            const response = await axios.get<Category>(`${Constants.GET_CATEGORY_URL}/${categoryItem._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategory(response.data);
            setIsEditMode(true);
            setFormErrors({});
            setShowModal(true);
            setActiveDropdownIndex(null);
        } catch (error) {
            console.error('Failed to load category:', error);
            toast.error('Failed to load category data.');
        }
    };

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

        const url = isEditMode
            ? `${Constants.UPDATE_CATEGORY_URL}/${category._id}`
            : Constants.CREATE_CATEGORY_URL;
        const method = isEditMode ? 'put' : 'post';

        try {
            await axios[method](url, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success(`Category ${isEditMode ? 'updated' : 'added'} successfully`);
            setShowModal(false);
            fetchCategories(search, limit, page); // Refetch current page
        } catch (error) {
            const axiosError = error as AxiosError;
            const data = axiosError.response?.data as { errors?: FormErrors };
            if (data?.errors) {
                setFormErrors(data.errors);
            } else {
                console.error("Error submitting form:", error);
                toast.error(`Failed to ${isEditMode ? 'update' : 'add'} category.`);
            }
        }
    };

    const handleDeleteClick = (categoryItem: Category) => {
        setItemToDelete(categoryItem);
        setDeleteModalOpen(true);
        setActiveDropdownIndex(null);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_CATEGORY_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Category deleted successfully');
            fetchCategories(search, limit, page); // Refetch current page
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Failed to delete category.');
        }
    };

    // Calculate display range for pagination
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Categories</h1>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setFormErrors({});
                        setCategory({ status: true });
                        setIsEditMode(false);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow"
                >
                    + New Category
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search by category name..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <select
                    value={limit}
                    onChange={(e) => handlePageLengthChange(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>

            <Table headers={["#", "Category Name", "Slug", "Status", "Actions"]}>
                {categories.length > 0 ? (
                    categories.map((categoryItem, index) => (
                        <tr key={categoryItem._id} ref={ref => (dropdownRef.current[index] = ref)} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-1">{(page - 1) * limit + index + 1}</td>
                            <td className="font-semibold text-gray-600 dark:text-gray-300 px-4 py-1">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={categoryItem.categoryImageUrl}
                                        alt={categoryItem.category_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span>{categoryItem.category_name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-1 text-gray-600 dark:text-gray-400">{categoryItem.slug}</td>
                            <td className="px-4 py-1">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={categoryItem.status} onChange={() => updateStatus(categoryItem)} />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500">
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${categoryItem.status ? 'translate-x-full' : ''}`}></div>
                                    </div>
                                </label>
                            </td>
                            <td className="px-4 py-1">
                                <div className="relative inline-block text-left">
                                    <button
                                        onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                                    >
                                        <MoreVertical size={18} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    {activeDropdownIndex === index && (
                                        <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                            <button onClick={() => handleEditClick(categoryItem)} className="w-full flex items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                <EditIcon size={16} className="mr-2" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteClick(categoryItem)} className="w-full flex items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-500">
                                                <TrashIcon size={16} className="mr-2" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={5} className="text-center py-4 font-semibold text-gray-500">No Categories Found</td></tr>
                )}
            </Table>

            <PaginationWrapper
                count={pagination.totalPages}
                page={page}
                from={from}
                to={to}
                total={pagination.total}
                onChange={(e, newPage) => handlePageChange(newPage)}
                paginationVariant="outlined"
                paginationShape="rounded"
            />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Edit Category' : 'Add New Category'}>
                {/* Form fields are identical to your provided code, just ensure they are within this modal */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                                {category.categoryImageUrl ? (
                                    <img src={category.categoryImageUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                                ) : (
                                    <Upload className="text-purple-500 w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Image
                                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageChange} />
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG. Max 5MB.</p>
                            </div>
                        </div>
                        {formErrors.category_image && <p className="text-red-500 text-xs mt-1">{formErrors.category_image}</p>}
                    </div>
                    {/* Name Input */}
                    <div>
                        <label htmlFor="category_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                        <input id="category_name" type="text" value={category.category_name || ""} onChange={(e) => setCategory({ ...category, category_name: e.target.value })} placeholder="Enter Category Name" className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500" />
                        {formErrors.category_name && <p className="text-red-500 text-xs mt-1">{formErrors.category_name}</p>}
                    </div>
                    {/* Slug Input */}
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug <span className="text-red-500">*</span></label>
                        <input id="slug" type="text" value={category.slug || ""} onChange={(e) => setCategory({ ...category, slug: e.target.value })} placeholder="Enter Category Slug" className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500" />
                        {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
                    </div>
                    {/* Form Buttons */}
                    <div className="flex justify-end pt-2 space-x-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">{isEditMode ? 'Update' : 'Add New'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">Are you sure you want to delete <strong>{itemToDelete?.category_name}</strong>?</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default CategoryList;