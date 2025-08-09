import React, { type FC, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { Edit, Trash2Icon, CirclePlusIcon } from "lucide-react";

import Modal from "@components/admin/Modal";
import Table from "@components/admin/Table";
import TableRow from "@components/admin/TableRow";
import Switch from "@components/admin/Switch";
import PaginationWrapper from "@components/admin/PaginationWrapper";
import Constants from "@constants/api";
import type { RootState } from "@store/index";


// Interface for the form data
interface BankAccountFormData {
    id?: string;
    userId?: string;
    accountHoldername: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    IFSCCode: string;
    status?: boolean;
}

// Interface for bank account data from API
interface BankAccount {
    id: string;
    userId: string;
    accountHoldername: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    IFSCCode: string;
    status: boolean;
    createdAt: string;
}

// Interface for pagination data from API
interface BankAccountPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const initialFormData: BankAccountFormData = {
    userId: "",
    accountHoldername: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    IFSCCode: "",
    status: true,
};

const BankAccountList: FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    initialFormData.userId = user.id;
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [showModal, setShowModal] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<BankAccount | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [pagination, setPagination] = useState<BankAccountPagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [formData, setFormData] = useState<BankAccountFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});


    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    const fetchBankAccounts = async (currentSearch = search, currentLimit = limit, currentPage = page) => {
        try {
            const response = await axios.get(Constants.GET_BANK_ACCOUNTS_URL, {
                params: { search: currentSearch, limit: currentLimit, page: currentPage },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBankAccounts(response.data.data.bankDetails);
            if (response.data.data.pagination) setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching bank accounts:", error);
            toast.error("Failed to fetch bank accounts.");
        }
    };
    
    useEffect(() => {
        fetchBankAccounts();
    }, [search, limit, page, token]);

    // --- Search and Pagination Handlers ---
    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    const handleEditClick = (item: BankAccount) => {
        setFormData({ ...item });
        setIsEditMode(true);
        setFormErrors({});
        setShowModal(true);
    };

    const handleDeleteClick = (account: BankAccount) => {
        setItemToDelete(account);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_BANK_ACCOUNT_URL}/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Bank account deleted successfully');
            fetchBankAccounts(); 
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete bank account:', error);
            toast.error('Failed to delete bank account.');
        }
    };

    const handleStatusChange = async (id: string, newStatus: boolean) => {
        setBankAccounts(prev =>
            prev.map(acc =>
                acc.id === id ? { ...acc, status: newStatus } : acc
            )
        );
        try {
            await axios.patch(`${Constants.UPDATE_BANK_ACCOUNT_STATUS_URL}/${id}`, { status: newStatus }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Status updated successfully');
            fetchBankAccounts(); 
        } catch (error) {
            toast.error('Failed to update status.');
            fetchBankAccounts(); 
        }
    };

    const tableActions = [
        { label: 'Edit', icon: <Edit size={14} />, onClick: (item: BankAccount) => handleEditClick(item) },
        { label: 'Delete', icon: <Trash2Icon size={14} />, onClick: (item: BankAccount) => handleDeleteClick(item) }
    ];

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.accountHoldername.trim()) newErrors.accountHoldername = 'Account holder name is required.';
        if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required.';
        if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required.';
        if (!formData.IFSCCode.trim()) newErrors.IFSCCode = 'IFSC code is required.';
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            ...formData,
            IFSCCode: formData.IFSCCode.toUpperCase() 
        };

        try {
            if (isEditMode) {
                await axios.put(`${Constants.UPDATE_BANK_ACCOUNT_URL}/${formData.id}`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Bank account updated successfully');
            } else {
                await axios.post(Constants.CREATE_BANK_ACCOUNT_URL, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Bank account created successfully');
            }
            fetchBankAccounts();
            setShowModal(false);
        } catch (error: any | AxiosError) {
            setFormErrors(error?.response?.data?.errors || {});
            toast.error('Something went wrong. Please try again.');
        }
    };

    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bank Accounts</h1>
                <button
                    onClick={() => {
                        setIsEditMode(false);
                        setFormData(initialFormData);
                        setFormErrors({});
                        setShowModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Bank Account
                </button>
            </div>

            {/* Search and Page Length */}
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Search bank accounts..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <select
                    value={limit}
                    onChange={(e) => handlePageLengthChange(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                    {[10, 25, 50].map((num) => (
                        <option key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <Table headers={["#", "Bank Name", "Account Holder", "Account Number", "IFSC Code", "Status", "Actions"]}>
                {bankAccounts && bankAccounts.length > 0 ? bankAccounts.map((acc, index) => (
                    <TableRow
                        key={acc.id}
                        index={from + index}
                        row={acc}
                        columns={[
                            acc.bankName,
                            acc.accountHoldername,
                            acc.accountNumber,
                            acc.IFSCCode,
                            <Switch name={`status-${acc.id}`} checked={acc.status} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStatusChange(acc.id, e.target.checked)} />,
                        ]}
                        actions={tableActions}
                    />
                )) : (
                    <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-500 font-medium">No Bank Accounts Found</td>
                    </tr>
                )}
            </Table>

            {/* Pagination */}
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

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Update Bank Account' : 'Create Bank Account'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Account Holder Name */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700 dark:text-gray-200">Account Holder Name <span className="text-red-500">*</span></label>
                        <input name="accountHoldername" value={formData.accountHoldername} onChange={handleChange} type="text" placeholder="Enter Account Holder Name" className="mt-1 border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {formErrors.accountHoldername && <p className="text-red-500 text-xs mt-1">{formErrors.accountHoldername}</p>}
                    </div>

                    {/* Bank Name */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700 dark:text-gray-200">Bank Name <span className="text-red-500">*</span></label>
                        <input name="bankName" value={formData.bankName} onChange={handleChange} type="text" placeholder="Enter Bank Name" className="mt-1 border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {formErrors.bankName && <p className="text-red-500 text-xs mt-1">{formErrors.bankName}</p>}
                    </div>

                    {/* Branch Name */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700 dark:text-gray-200">Branch Name <span className="text-red-500">*</span> </label>
                        <input name="branchName" value={formData.branchName} onChange={handleChange} type="text" placeholder="Enter Branch Name" className="mt-1 border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {formErrors.branchName && <p className="text-red-500 text-xs mt-1">{formErrors.branchName}</p>}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700 dark:text-gray-200">Account Number <span className="text-red-500">*</span></label>
                        <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} type="text" placeholder="Enter Account Number" className="mt-1 border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {formErrors.accountNumber && <p className="text-red-500 text-xs mt-1">{formErrors.accountNumber}</p>}
                    </div>

                    {/* IFSC Code */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700 dark:text-gray-200">IFSC Code <span className="text-red-500">*</span></label>
                        <input name="IFSCCode" value={formData.IFSCCode} onChange={handleChange} type="text" placeholder="Enter IFSC Code" className="mt-1 border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {formErrors.IFSCCode && <p className="text-red-500 text-xs mt-1">{formErrors.IFSCCode}</p>}
                    </div>

                    {/* Status Switch */}
                    <div className="flex items-center gap-3 pt-2">
                        <label htmlFor="status" className="font-medium text-sm text-gray-700 dark:text-gray-200">Status</label>
                        <Switch name="status" checked={formData.status ?? false} onChange={handleChange} />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer">Cancel</button>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md cursor-pointer">{isEditMode ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">
                    Are you sure you want to delete the account for <strong>{itemToDelete?.accountHoldername}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded cursor-pointer">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default BankAccountList;