import { CirclePlusIcon, Edit, Trash2Icon } from "lucide-react";
import type React from "react";
import { useSearchParams } from "react-router-dom";
import Table from "../../../../../components/admin/Table";
import CurrencyFormModal from "./CurrencyFormModal";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../store";
import axios from "axios";
import Constants from "../../../../../constants/api";
import { toast } from "react-toastify";
import TableRow from "../../../../../components/admin/TableRow";
import Switch from "../../../../../components/admin/Switch";
import PaginationWrapper from "../../../../../components/admin/PaginationWrapper";
import Modal from "../../../../../components/admin/Modal";

interface Currency {
    id: string;
    name: string;
    code: string;
    symbol: string;
    status: boolean;
    isDefault: boolean;
}

const CurrencyList: React.FC = () => {
    // Handle search and page length
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
    const { token } = useSelector((state: RootState) => state.auth);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [editData, setEditData] = useState<Currency | null>(null);
    const [deleteData, setDeleteData] = useState<Currency | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const handleCurrencySuccess = () => {
        setCurrencyModalOpen(false);
        fetchCurrencies();
    }

    useEffect(() => {
        fetchCurrencies();
    }, [search, limit, page, token]);

    const fetchCurrencies = async () => {
        try {
            const response = await axios.get(Constants.GET_CURRENCIES_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCurrencies(response.data.data.currencies);
            if (response.data.data.pagination) setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching currencies:", error);
            toast.error("Failed to fetch currencies.");
        }
    }

    const handleCurrencyStatusChange = async (id: string) => {
        const currentCurrency = currencies.find(currency => currency.id === id);
        if (!currentCurrency) return;
        const newStatus = !currentCurrency.status;
        setCurrencies(prev =>
            prev.map(currency =>
                currency.id === id ? { ...currency, status: newStatus } : currency
            )
        );

        try {
            await axios.patch(`${Constants.UPDATE_CURRENCY_STATUS_URL}/${id}`,
                { status: newStatus },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            toast.success('Status updated successfully');
           await fetchCurrencies();
        } catch (error) {
            toast.error('Failed to update status.');
        }
    }

    const handleCurrencyDefaultStatusChange = async (id: string) => {
        const currentCurrency = currencies.find(currency => currency.id === id);
        if (!currentCurrency) return;
        const newStatus = !currentCurrency.isDefault;
        setCurrencies(prev =>
            prev.map(currency =>
                currency.id === id ? { ...currency, isDefault: newStatus } : currency
            )
        );

        try {
           await axios.patch(`${Constants.UPDATE_CURRENCY_STATUS_URL}/${id}`,
                { isDefault: newStatus, status: newStatus },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            toast.success('Default Status updated successfully');
           await fetchCurrencies();
        } catch (error) {
            toast.error('Failed to update status.');
        }
    }

    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    }

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    }

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    }
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    const tableActions = [
        { label: 'Edit', icon: <Edit size={14} />, onClick: (item: Currency) => handleEditClick(item) },
        { label: 'Delete', icon: <Trash2Icon size={14} />, onClick: (item: Currency) => handleDeleteClick(item) }
    ];

    const handleEditClick = (item: Currency) => {
        setEditData(item);
        setCurrencyModalOpen(true);
    }

    const handleDeleteClick = (item: Currency) => {
        setDeleteData(item);
        setDeleteModalOpen(true);
    }

    const handleCurrencyDelete = async () => {
        try {
            await axios.delete(`${Constants.DELETE_CURRENCY_URL}/${deleteData?.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Currency deleted successfully.');
            setDeleteModalOpen(false);
            await fetchCurrencies();
        } catch (error) {
            toast.error('Failed to delete currency.');
        }
    }
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Currencies</h1>
                <button
                    onClick={() => {setCurrencyModalOpen(true); setEditData(null)}}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Currency
                </button>
            </div>
            {/* Search and Page Length */}
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Search currencies"
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

            {/* Currency Table */}
            <Table headers={["#", "Currency Name", "Symbol", "Code", "Status", "Default", "Actions"]}>
                {currencies && currencies.map((currency: Currency, index: number) => (
                    <TableRow
                        key={currency.id}
                        index={index + 1}
                        row={currency}
                        columns={[
                            currency.name,
                            currency.symbol,
                            currency.code,
                            <Switch name={`status-${currency.id}`} checked={currency.status} onChange={() => handleCurrencyStatusChange(currency.id)} disabled={currency.isDefault} />,
                            <Switch name={`default-${currency.id}`} checked={currency.isDefault} onChange={() => handleCurrencyDefaultStatusChange(currency.id)} disabled={currency.isDefault} />,
                        ]}
                        actions={tableActions}
                    />
                ))}
                {!currencies.length &&
                    <tr>
                        <td colSpan={6} className="text-center text-gray-500 py-2 dark:text-gray-400 font-semibold">No currencies found</td>
                    </tr>
                }
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
            {/* Currency Form Modal */}
            <CurrencyFormModal
                isOpen={currencyModalOpen}
                onClose={() => { setCurrencyModalOpen(false) }}
                onSuccess={() => { handleCurrencySuccess(); }}
                editData={editData}
            />

            {/* Delete Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false) }} title="Delete Currency">
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete {deleteData?.name}?</p>
                    <div className="flex justify-end mt-4">
                        <button
                            type="button"
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md mr-2 cursor-pointer"
                            onClick={() => { setDeleteModalOpen(false) }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md cursor-pointer"
                            onClick={() => { handleCurrencyDelete(); }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default CurrencyList;