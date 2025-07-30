import { useEffect, useState, useRef } from "react";
import type { FC, ChangeEvent, FormEvent } from "react";
import Constants from "../../../constants/api";
import axios from "axios";
import Table from "../../../components/admin/Tabls"
import { EditIcon, TrashIcon, MoreVertical, Upload } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Interface for the brand data coming from the API
interface Brand {
    _id: string;
    brand_name: string;
    status: boolean;
    brandImageUrl: string;
}

// Interface for the state of the form, which can include a local File object
interface BrandFormState {
    _id?: string;
    brand_name?: string;
    status?: boolean;
    brand_image?: File | null; // For the file upload
    brandImageUrl?: string; // For the preview
}

// Interface for form validation errors
interface FormErrors {
    brand_name?: string;
    brand_image?: string;
}

const BrandList: FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [brand, setBrand] = useState<BrandFormState>({});
    const [brands, setBrands] = useState<Brand[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const dropdownRef = useRef<Array<HTMLTableRowElement | null>>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<Brand | null>(null);
    const [search, setSearch] = useState<string>("");
    const [perPage, setPerPage] = useState<number>(10);
    const [filteredData, setFilteredData] = useState<Brand[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const initialFormState: BrandFormState = {
        brand_name: '',
        status: true,
        brand_image: null,
        brandImageUrl: ''
    };

    // Fetch brands on component mount and set up click outside listener
    useEffect(() => {
        fetchBrands();
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

    // Filter brands based on search query
    useEffect(() => {
        const filtered = brands.filter(
            (brand) =>
                brand.brand_name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredData(filtered);
    }, [search, brands]);

    // Pagination logic
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentBrands = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / perPage);

    // Fetch brands from API
    const fetchBrands = async (): Promise<void> => {
        try {
            const response = await axios.get<Brand[]>(Constants.FETCH_BRAND_LIST_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBrands(response.data || []);
        } catch (error) {
            console.error("Error fetching brands:", error);
            toast.error("Failed to fetch brands.");
        }
    };

    // Update brand status
    const updateStatus = async (brandToUpdate: Brand): Promise<void> => {
        try {
            const updatedBrand = { ...brandToUpdate, status: !brandToUpdate.status };
            await axios.put(`${Constants.UPDATE_BRAND_URL}/${brandToUpdate._id}`, updatedBrand, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Status updated successfully');
            fetchBrands();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error("Failed to update status.");
        }
    };

    // Handle image selection for the form
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            setBrand({
                ...brand,
                brand_image: file,
                brandImageUrl: URL.createObjectURL(file),
            });
        } else if (file) {
            toast.error("Please upload a JPG or PNG image under 5MB.");
        }
    };

    // Prepare form for editing an existing brand
    const handleEditClick = async (brandToEdit: Brand): Promise<void> => {
        try {
            const response = await axios.get<Brand>(`${Constants.GET_BRAND_URL}/${brandToEdit._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBrand(response.data);
            setIsEditMode(true);
            setFormErrors({});
            setShowModal(true);
            setActiveDropdownIndex(null);
        } catch (error) {
            console.error('Failed to load brand:', error);
            toast.error("Failed to load brand data.");
        }
    }

    // Handle form submission for creating or updating a brand
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setFormErrors({});

        const formData = new FormData();
        formData.append("brand_name", brand.brand_name ?? "");
        formData.append("status", String(brand.status ?? true));
        if (brand.brand_image) {
            formData.append("brand_image", brand.brand_image);
        }

        try {
            const url = isEditMode
                ? `${Constants.UPDATE_BRAND_URL}/${brand._id}`
                : Constants.CREATE_BRAND_URL;
            const method = isEditMode ? 'put' : 'post';

            await axios[method](url, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success(`Brand ${isEditMode ? 'updated' : 'added'} successfully`);
            setShowModal(false);
            fetchBrands();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                console.error("Error submitting form:", error);
                toast.error(`Failed to ${isEditMode ? 'update' : 'add'} brand.`);
            }
        }
    }

    // Prepare for deletion
    const handleDeleteClick = (brandToDelete: Brand): void => {
        setItemToDelete(brandToDelete);
        setDeleteModalOpen(true);
        setActiveDropdownIndex(null);
    }

    // Confirm and execute deletion
    const confirmDelete = async (): Promise<void> => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_BRAND_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Brand deleted successfully');
            fetchBrands();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete brand:', error);
            toast.error("Failed to delete brand.");
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Brands</h1>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setFormErrors({});
                        setBrand(initialFormState);
                        setIsEditMode(false);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow cursor-pointer"
                >
                    + New Brand
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search by brand name..."
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <select
                    value={perPage}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setPerPage(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>

            <Table headers={["#", "Brand Name", "Status", "Actions"]}>
                {currentBrands.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4 text-gray-500">No brands found</td></tr>
                ) : (
                    currentBrands.map((brandItem, index) => (
                        <tr key={brandItem._id} ref={ref => dropdownRef.current[indexOfFirst + index] = ref} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-1">{indexOfFirst + index + 1}</td>
                            <td className="font-semibold text-gray-600 dark:text-gray-300 px-4 py-1">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={brandItem.brandImageUrl}
                                        alt={brandItem.brand_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span>{brandItem.brand_name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-1">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={brandItem.status}
                                        onChange={() => updateStatus(brandItem)}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500 transition-all duration-300">
                                        <div className={`absolute top-0.5 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${brandItem.status ? 'translate-x-full' : ''}`}></div>
                                    </div>
                                </label>
                            </td>
                            <td className="px-4 py-1">
                                <div className="relative inline-block text-left">
                                    <button
                                        onClick={() => setActiveDropdownIndex(activeDropdownIndex === (indexOfFirst + index) ? null : (indexOfFirst + index))}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                                    >
                                        <MoreVertical size={18} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    {activeDropdownIndex === (indexOfFirst + index) && (
                                        <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                            <button
                                                onClick={() => handleEditClick(brandItem)}
                                                className="w-full flex items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            >
                                                <EditIcon size={16} className="mr-2" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(brandItem)}
                                                className="w-full flex items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-500"
                                            >
                                                <TrashIcon size={16} className="mr-2" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </Table>
            
            {/* Pagination controls... */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Edit Brand' : 'Add New Brand'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                                {brand.brandImageUrl ? (
                                    <img src={brand.brandImageUrl} alt="Preview" className="w-full h-full object-cover rounded" />
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
                        {formErrors.brand_image && <p className="text-red-500 text-xs mt-1">{formErrors.brand_image}</p>}
                    </div>

                    <div>
                        <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="brand_name"
                            type="text"
                            value={brand.brand_name || ''}
                            onChange={(e) => setBrand({ ...brand, brand_name: e.target.value })}
                            placeholder="Enter brand name"
                            className="w-full text-gray-800 dark:text-white bg-white dark:bg-gray-800 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        {formErrors.brand_name && <p className="text-red-500 text-xs mt-1">{formErrors.brand_name}</p>}
                    </div>

                    <div className="flex justify-end pt-2 space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                        >
                            {isEditMode ? 'Update Brand' : 'Add Brand'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">
                    Are you sure you want to delete <strong>{itemToDelete?.brand_name}</strong>?
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

export default BrandList;