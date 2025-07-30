import { useEffect, useState, useRef } from "react";
import Constants from "../../../constants/api";
import axios, { AxiosError } from "axios";
import Table from "../../../components/admin/Tabls";
import { EditIcon, TrashIcon, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import MultiSelect from "../../../components/admin/Multiselect";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Define interfaces for type safety
interface ITaxRate {
    _id: string;
    tax_name: string;
    tax_rate: number;
    status: boolean;
    createdAt: string;
}

interface ITaxGroup {
    _id: string;
    tax_name: string;
    total_tax_rate: number;
    status: boolean;
    createdAt: string;
    // When getting the list, tax_rate_ids might just be strings
    tax_rate_ids: string[] | ITaxRate[];
}

// A more detailed type for when we fetch a single group, where tax rates are populated
interface ITaxGroupDetail extends Omit<ITaxGroup, 'tax_rate_ids'> {
    tax_rate_ids: ITaxRate[];
}

interface ISelectOption {
    value: string;
    label: string;
}

interface FormErrors {
    tax_name?: string;
    tax_rate_ids?: string;
}

// Type for the form state object
type TaxGroupFormData = Partial<{
    _id: string;
    tax_name: string;
    status: boolean;
    tax_rate_ids: string[];
}>;

export default function TaxGroups(): JSX.Element {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [taxRates, setTaxRates] = useState<ITaxRate[]>([]);
    const [taxRateOptions, setTaxRateOptions] = useState<ISelectOption[]>([]);
    const [selectedTaxRates, setSelectedTaxRates] = useState<string[]>([]);
    const [taxGroup, setTaxGroup] = useState<TaxGroupFormData>({});
    const [taxGroups, setTaxGroups] = useState<ITaxGroup[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const { token } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<ITaxGroup | null>(null);
    const [search, setSearch] = useState<string>("");
    const [perPage, setPerPage] = useState<number>(10);
    const [filteredData, setFiltered] = useState<ITaxGroup[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Fetch initial data on component mount
    useEffect(() => {
        fetchTaxGroups();
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

    // Filter data based on search
    useEffect(() => {
        const result = taxGroups.filter(
            (group) =>
                group.tax_name.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(result);
    }, [search, taxGroups]);

    // Pagination logic
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentTaxGroups = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / perPage);
    
    // Fetch tax rates for the MultiSelect component
    const fetchTaxRates = async () => {
        try {
            const response = await axios.get<ITaxRate[]>(Constants.FETCH_TAX_RATE_LIST_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rates = response.data || [];
            setTaxRates(rates);
            setTaxRateOptions(rates.map((rate) => ({ value: rate._id, label: rate.tax_name })));
        } catch (error) {
            console.error("Error fetching tax rates:", error);
            toast.error("Failed to fetch tax rates.");
        }
    };

    // Handle change in the MultiSelect component
    const handleTaxRateChange = (selectedOptions: ISelectOption[]) => {
        const ids = selectedOptions.map((option) => option.value);
        setSelectedTaxRates(ids);
        setTaxGroup({ ...taxGroup, tax_rate_ids: ids });
    };

    // Fetch all tax groups
    const fetchTaxGroups = async () => {
        try {
            const response = await axios.get<ITaxGroup[]>(Constants.FETCH_TAX_GROUP_LIST_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTaxGroups(response.data || []);
        } catch (error) {
            console.error("Error fetching tax groups:", error);
            toast.error("Failed to fetch tax groups.");
        }
    };

    // Update the status (active/inactive) of a tax group
    const updateStatus = async (group: ITaxGroup) => {
        try {
            const updatedTaxGroup = { ...group, status: !group.status };
            await axios.put(`${Constants.UPDATE_TAX_GROUP_URL}/${group._id}`, updatedTaxGroup, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Tax group status updated successfully');
            fetchTaxGroups();
        } catch (error) {
            console.error('Failed to update tax group status:', error);
            toast.error("Failed to update tax group status.");
        }
    };

    // Handle clicking the edit button
    const handleEditClick = async (group: ITaxGroup) => {
        try {
            const response = await axios.get<ITaxGroupDetail>(`${Constants.GET_TAX_GROUP_URL}/${group._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const groupData = response.data;
            setTaxGroup(groupData);
            if (groupData.tax_rate_ids) {
                const selectedIds = groupData.tax_rate_ids.map((rate) => rate._id);
                setSelectedTaxRates(selectedIds);
            }
            setIsEditMode(true);
            setFormErrors({});
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load tax group:', error);
            toast.error("Failed to load tax group for editing.");
        }
    };

    // Handle form submission for creating or updating a tax group
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setFormErrors({});
        e.preventDefault();
        
        const errors: FormErrors = {};
        if (!taxGroup.tax_name) {
            errors.tax_name = "Tax Group Name is required.";
        }
        if (!taxGroup.tax_rate_ids || taxGroup.tax_rate_ids.length === 0) {
            errors.tax_rate_ids = "At least one tax rate is required.";
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (isEditMode) {
                await axios.put(`${Constants.UPDATE_TAX_GROUP_URL}/${taxGroup._id}`, taxGroup, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Tax group updated successfully');
            } else {
                await axios.post(Constants.CREATE_TAX_GROUP_URL, taxGroup, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Tax group added successfully');
            }
            setShowModal(false);
            fetchTaxGroups();
        } catch (error) {   
            const axiosError = error as AxiosError<{ errors: FormErrors }>;
            if (axiosError.response?.data?.errors) {
                setFormErrors(axiosError.response.data.errors);
            } else {
                console.error("Error saving tax group:", error);
                toast.error("Failed to save tax group.");
            }
        }
    };

    // Set up for deletion confirmation
    const handleDeleteClick = (group: ITaxGroup) => {
        setItemToDelete(group);
        setDeleteModalOpen(true);
    };

    // Confirm and execute deletion
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_TAX_GROUP_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Tax group deleted successfully');
            fetchTaxGroups();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete tax group:', error);
            toast.error("Failed to delete tax group.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="text-gray-800 min-h-full">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tax Groups</h1>
                    <button
                        onClick={() => {
                            setShowModal(true);
                            setFormErrors({});
                            setTaxGroup({ status: true, tax_rate_ids: [] });
                            setIsEditMode(false);
                            setSelectedTaxRates([]);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow cursor-pointer"
                    >
                        + New Tax Group
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex justify-between items-center">
                    <input
                        type="text"
                        placeholder="Search by Tax Group Name..."
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

            <Table headers={["#", "Tax Group Name", "Tax Group Rate (%)", "Created On", "Status", "Actions"]}>
                {currentTaxGroups.length === 0 ? (
                    <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-4 py-3" colSpan={6}>
                            <p className="text-center text-gray-500">No tax groups found.</p>
                        </td>
                    </tr>
                ) : (
                    currentTaxGroups.map((group, index) => {
                        const createdDate = group.createdAt ? new Date(group.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                        return (
                            <tr key={group._id} ref={ref => { if (ref) dropdownRef.current[index] = ref; }} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                <td className="px-4 py-1">{indexOfFirst + index + 1}</td>
                                <td className="font-semibold text-gray-600 px-4 py-1">
                                    <span>{group.tax_name}</span>
                                </td>
                                <td className="px-4 py-1">{group.total_tax_rate}%</td>
                                <td className="px-4 py-1">{createdDate}</td>
                                <td className="px-4 py-1">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={group.status}
                                            onChange={() => updateStatus(group)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500 transition-all duration-300">
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${group.status ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                        </div>
                                    </label>
                                </td>
                                <td>
                                    <div className="relative inline-block text-left">
                                        <button
                                            onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)}
                                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                                        >
                                            <MoreVertical size={18} className="text-gray-600 dark:text-gray-300 cursor-pointer" />
                                        </button>
                                        {activeDropdownIndex === index && (
                                            <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                                <button
                                                    onClick={() => handleEditClick(group)}
                                                    className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer"
                                                >
                                                    <EditIcon className="inline-block mr-2 text-gray-600 dark:text-gray-300" size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(group)}
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Edit Tax Group' : 'Add New Tax Group'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="tax_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Tax Group Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="tax_name"
                            type="text"
                            value={taxGroup.tax_name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxGroup({ ...taxGroup, tax_name: e.target.value })}
                            placeholder="Enter Tax Group Name (e.g., Standard Tax)"
                            className="w-full text-gray-600 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        {formErrors.tax_name && <p className="text-red-500 text-xs mt-1">{formErrors.tax_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="tax_rates" className="block text-sm font-medium text-gray-700 mb-1">
                            Tax Rates <span className="text-red-500">*</span>
                        </label>
                        <MultiSelect 
                            options={taxRateOptions}
                            selectedOptions={taxRateOptions.filter(opt => selectedTaxRates.includes(opt.value))}
                            onChange={handleTaxRateChange}
                        />
                        {formErrors.tax_rate_ids && <p className="text-red-500 text-xs mt-1">{formErrors.tax_rate_ids}</p>}
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
    );
}