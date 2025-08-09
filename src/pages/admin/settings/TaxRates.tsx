import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Constants from "../../../constants/api";
import axios, { AxiosError } from "axios";
import Table from "../../../components/admin/Table";
import PaginationWrapper from "../../../components/admin/PaginationWrapper";
import { EditIcon, TrashIcon, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Define an interface for the Tax Rate object for type safety
interface ITaxRate {
    _id: string;
    tax_name: string;
    tax_rate: number;
    status: boolean;
    createdAt: string;
}

// Interface for pagination data from the API
interface TaxRatePagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


// Define the shape of form errors
interface FormErrors {
    tax_name?: string;
    tax_rate?: string;
}

export default function TaxRateList(): JSX.Element {
    // Hooks
    const { token } = useSelector((state: RootState) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);
    
    // State
    const [taxRates, setTaxRates] = useState<ITaxRate[]>([]);
    const [pagination, setPagination] = useState<TaxRatePagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [taxRate, setTaxRate] = useState<Partial<ITaxRate>>({});
    const [showModal, setShowModal] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<ITaxRate | null>(null);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

    // Get params from URL
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    // Fetch tax rates based on URL params
    const fetchTaxRates = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.FETCH_TAX_RATE_LIST_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Assumed API response structure: { data: { taxRates: [], pagination: {} } }
            setTaxRates(response.data.data.taxRates || []);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching tax rates:", error);
            toast.error("Failed to fetch tax rates.");
        }
    };
    
    // Effect to fetch data when URL params change
    useEffect(() => {
        fetchTaxRates(search, limit, page);
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
    const updateStatus = async (rate: ITaxRate) => {
        try {
            const updatedTaxRate = { ...rate, status: !rate.status };
            await axios.put(`${Constants.UPDATE_TAX_RATE_URL}/${rate._id}`, updatedTaxRate, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Tax rate status updated successfully');
            fetchTaxRates(search, limit, page); // Refetch current page
        } catch (error) {
            console.error('Failed to update tax rate status:', error);
            toast.error("Failed to update tax rate status.");
        }
    };

    const handleEditClick = async (rate: ITaxRate) => {
        try {
            const response = await axios.get<ITaxRate>(`${Constants.GET_TAX_RATE_URL}/${rate._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTaxRate(response.data);
            setIsEditMode(true);
            setFormErrors({});
            setShowModal(true);
            setActiveDropdownIndex(null);
        } catch (error) {
            console.error('Failed to load tax rate:', error);
            toast.error("Failed to load tax rate for editing.");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormErrors({});
        
        try {
            if (isEditMode) {
                await axios.put(Constants.UPDATE_TAX_RATE_URL + `/${taxRate._id}`, taxRate, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Tax rate updated successfully');
            } else {
                await axios.post(Constants.CREATE_TAX_RATE_URL, taxRate, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Tax rate added successfully');
            }
            setShowModal(false);
            fetchTaxRates(search, limit, page); // Refetch current page
        } catch (error) {
            const axiosError = error as AxiosError<{ errors: FormErrors }>;
            if (axiosError.response?.data?.errors) {
                setFormErrors(axiosError.response.data.errors);
            } else {
                console.error("Error saving tax rate:", error);
                toast.error("Failed to save tax rate.");
            }
        }
    };

    const handleDeleteClick = (rate: ITaxRate) => {
        setItemToDelete(rate);
        setDeleteModalOpen(true);
        setActiveDropdownIndex(null);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_TAX_RATE_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Tax rate deleted successfully');
            fetchTaxRates(search, limit, page); // Refetch current page
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete tax rate:', error);
            toast.error("Failed to delete tax rate.");
        }
    };
    
    // Calculate display range for pagination text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tax Rates</h1>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setFormErrors({});
                        setTaxRate({ status: true });
                        setIsEditMode(false);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow"
                >
                    + New Tax Rate
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search by Tax Name..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <select
                    value={limit}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePageLengthChange(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>

            <Table headers={["#", "Tax Name", "Tax Rate (%)", "Created On", "Status", "Actions"]}>
                {taxRates.length > 0 ? (
                    taxRates.map((rate, index) => (
                        <tr key={rate._id} ref={el => dropdownRef.current[index] = el} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-2">{(page - 1) * limit + index + 1}</td>
                            <td className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-2">{rate.tax_name}</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{rate.tax_rate}%</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{new Date(rate.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-2">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={rate.status} onChange={() => updateStatus(rate)} />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500">
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${rate.status ? 'translate-x-full' : ''}`}></div>
                                    </div>
                                </label>
                            </td>
                            <td className="px-4 py-2">
                                <div className="relative inline-block text-left">
                                    <button onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                                        <MoreVertical size={18} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    {activeDropdownIndex === index && (
                                        <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                            <button onClick={() => handleEditClick(rate)} className="w-full flex items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                <EditIcon size={16} className="mr-2" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteClick(rate)} className="w-full flex items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-500">
                                                <TrashIcon size={16} className="mr-2" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td className="text-center py-4 font-semibold text-gray-500" colSpan={6}>No Tax Rates Found</td></tr>
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Edit Tax Rate' : 'Add New Tax Rate'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="tax_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Name <span className="text-red-500">*</span></label>
                        <input id="tax_name" type="text" value={taxRate.tax_name || ''} onChange={(e) => setTaxRate({ ...taxRate, tax_name: e.target.value })} placeholder="Enter Tax Name (e.g., GST, VAT)" className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-purple-500"/>
                        {formErrors.tax_name && <p className="text-red-500 text-xs mt-1">{formErrors.tax_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%) <span className="text-red-500">*</span></label>
                        <input id="tax_rate" type="number" step="0.01" value={taxRate.tax_rate ?? ''} onChange={(e) => setTaxRate({ ...taxRate, tax_rate: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Enter Tax Rate (e.g., 5, 18)" className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-purple-500"/>
                        {formErrors.tax_rate && <p className="text-red-500 text-xs mt-1">{formErrors.tax_rate}</p>}
                    </div>

                    <div className="flex justify-end pt-2 space-x-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">{isEditMode ? 'Update' : 'Add New'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">Are you sure you want to delete <strong>{itemToDelete?.tax_name}</strong>?</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
                </div>
            </Modal>
        </div>
    );
}