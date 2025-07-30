import { useEffect, useState, useRef } from "react";
import Constants from "../../../constants/api";
import axios, { AxiosError } from "axios";
import Table from "../../../components/admin/Tabls";
import { EditIcon, TrashIcon, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import TaxGroups from "./TaxGroups";

// Define an interface for the Tax Rate object for type safety
interface ITaxRate {
    _id: string;
    tax_name: string;
    tax_rate: number;
    status: boolean;
    createdAt: string;
}

// Define the shape of form errors
interface FormErrors {
    tax_name?: string;
    tax_rate?: string;
}

export default function TaxRateList(): JSX.Element {
    const [showModal, setShowModal] = useState<boolean>(false);
    // Use Partial<ITaxRate> for the form state, as it can be incomplete during creation/editing
    const [taxRate, setTaxRate] = useState<Partial<ITaxRate>>({});
    const [taxRates, setTaxRates] = useState<ITaxRate[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const { token } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<ITaxRate | null>(null);
    const [search, setSearch] = useState<string>("");
    const [perPage, setPerPage] = useState<number>(10);
    const [filteredData, setFiltered] = useState<ITaxRate[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Fetch tax rates on component mount
    useEffect(() => {
        fetchTaxRates();
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

    useEffect(() => {
        const result = taxRates.filter(
            (rate) =>
                rate.tax_name.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(result);
    }, [search, taxRates]);

    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentTaxRates = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / perPage);

    // Fetch tax rates
    const fetchTaxRates = async () => {
        try {
            const response = await axios.get<ITaxRate[]>(Constants.FETCH_TAX_RATE_LIST_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTaxRates(response.data || []);
        } catch (error) {
            console.error("Error fetching tax rates:", error);
            toast.error("Failed to fetch tax rates.");
        }
    };

    // Update Status
    const updateStatus = async (rate: ITaxRate) => {
        try {
            const updatedTaxRate = { ...rate, status: !rate.status };
            await axios.put(`${Constants.UPDATE_TAX_RATE_URL}/${rate._id}`, updatedTaxRate, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Tax rate status updated successfully');
            fetchTaxRates();
        } catch (error) {
            console.error('Failed to update tax rate status:', error);
            toast.error("Failed to update tax rate status.");
        }
    };

    // handleEditClick
    const handleEditClick = async (rate: ITaxRate) => {
        try {
            const response = await axios.get<ITaxRate>(`${Constants.GET_TAX_RATE_URL}/${rate._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTaxRate(response.data);
            setIsEditMode(true);
            setFormErrors({});
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load tax rate:', error);
            toast.error("Failed to load tax rate for editing.");
        }
    }

    // handleSubmit
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setFormErrors({});
        e.preventDefault();

        // Basic validation
        const errors: FormErrors = {};
        if (!taxRate.tax_name) {
            errors.tax_name = "Tax Name is required.";
        }
        if (taxRate.tax_rate === undefined || taxRate.tax_rate === null || taxRate.tax_rate < 0) {
            errors.tax_rate = "Tax Rate is required and must be a non-negative number.";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

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
            fetchTaxRates();
        } catch (error) {
            const axiosError = error as AxiosError<{ errors: FormErrors }>;
            if (axiosError.response && axiosError.response.data && axiosError.response.data.errors) {
                setFormErrors(axiosError.response.data.errors);
            } else {
                console.error("Error saving tax rate:", error);
                toast.error("Failed to save tax rate.");
            }
        }
    }

    // handleDeleteClick
    const handleDeleteClick = (rate: ITaxRate) => {
        setItemToDelete(rate);
        setDeleteModalOpen(true);
    }

    // confirmDelete
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_TAX_RATE_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Tax rate deleted successfully');
            fetchTaxRates();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete tax rate:', error);
            toast.error("Failed to delete tax rate.");
        }
    }

    return (
        <>
            <div className="p-6 space-y-6">
                <div className="text-gray-800 min-h-full">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tax Rates</h1>
                        <button
                            onClick={() => {
                                setShowModal(true);
                                setFormErrors({});
                                setTaxRate({ status: true }); // Default status to true for new tax rate
                                setIsEditMode(false);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow cursor-pointer"
                        >
                            + New Tax Rate
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex justify-between items-center">
                        <input
                            type="text"
                            placeholder="Search by Tax Name..."
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-md px-4 py-2 w-full text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={perPage}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPerPage(Number(e.target.value))}
                        className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                        {[10, 25, 50].map((num) => (
                            <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                        ))}
                    </select>
                </div>

                <Table headers={["#", "Tax Name", "Tax Rate (%)", "Created On", "Status", "Actions"]}>
                    {currentTaxRates.length <= 0 ? (
                        <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-3" colSpan={6}>
                                <div className="flex items-center justify-center">
                                    <span className="text-gray-500">No tax rates found.</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        currentTaxRates.map((rate, index) => {
                            const createdDate = rate.createdAt ? new Date(rate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                            return (
                                <tr key={rate._id} ref={el => dropdownRef.current[index] = el} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    <td className="px-4 py-1">{indexOfFirst + index + 1}</td>
                                    <td className="font-semibold text-gray-600 px-4 py-1">
                                        <span>{rate.tax_name}</span>
                                    </td>
                                    <td className="px-4 py-1">{rate.tax_rate}%</td>
                                    <td className="px-4 py-1">{createdDate}</td>
                                    <td className="px-4 py-1">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={rate.status}
                                                onChange={() => updateStatus(rate)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500 transition-all duration-300">
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${rate.status ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                            </div>
                                        </label>
                                    </td>
                                    <td>
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={() =>
                                                    setActiveDropdownIndex(activeDropdownIndex === index ? null : index)
                                                }
                                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                                            >
                                                <MoreVertical size={18} className="text-gray-600 dark:text-gray-300 cursor-pointer" />
                                            </button>
                                            {activeDropdownIndex === index && (
                                                <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                                    <button
                                                        onClick={() => handleEditClick(rate)}
                                                        className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer"
                                                    >
                                                        <EditIcon className="inline-block mr-2 text-gray-600 dark:text-gray-300" size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(rate)}
                                                        className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                    >
                                                        <TrashIcon className="inline-block mr-2" size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </Table>
                
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} entries
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

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Edit Tax Rate' : 'Add New Tax Rate'}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="tax_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="tax_name"
                                type="text"
                                value={taxRate.tax_name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRate({ ...taxRate, tax_name: e.target.value })}
                                placeholder="Enter Tax Name (e.g., GST, VAT)"
                                className="w-full text-gray-600 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            {formErrors.tax_name && <p className="text-red-500 text-xs mt-1">{formErrors.tax_name}</p>}
                        </div>

                        <div>
                            <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Rate (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="tax_rate"
                                type="number"
                                step="0.01"
                                value={taxRate.tax_rate || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRate({ ...taxRate, tax_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="Enter Tax Rate (e.g., 5, 18)"
                                className="w-full text-gray-600 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            {formErrors.tax_rate && <p className="text-red-500 text-xs mt-1">{formErrors.tax_rate}</p>}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-600 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 cursor-pointer"
                            >
                                {isEditMode ? 'Update' : 'Add New'}
                            </button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    title="Confirm Deletion"
                >
                    <p className="mb-4 text-gray-700 dark:text-gray-200">
                        Are you sure you want to delete{' '}
                        <strong>{itemToDelete?.tax_name}</strong>?
                    </p>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                            Delete
                        </button>
                    </div>
                </Modal>
            </div>
            <hr className="my-4 border-gray-300 dark:border-gray-600" />
            {/* <TaxGroups /> */}
        </>
    );
}