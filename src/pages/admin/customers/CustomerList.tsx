import { CirclePlusIcon, Edit, Trash2Icon, User2Icon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Table from "@components/admin/Table";
import { useSelector } from "react-redux";
import type { RootState } from "@store/index";
import Constants from "@constants/api";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import TableRow from "@components/admin/TableRow";
import PaginationWrapper from "@components/admin/PaginationWrapper";
import DeleteConfirmationModal from "@components/admin/DeleteConfirmationModal";

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface CustomerList {
    id: number;
    name: string;
    email: string;
    phone: string;    
}

const CustomerList: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [customers, setCustomers] = useState<CustomerList[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [deleteItem, setDeleteItem] = useState<CustomerList | null>(null);
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);

    const handleCreateClick = () => {
        navigate('/admin/customers/new');
    };

    const tableActions = [
        {
            label: 'Edit',
            icon: <Edit size={14} />,
            onClick: (item: CustomerList) => { handleEditClick(item) }
        },
        {
            label: 'Delete',
            icon: <Trash2Icon size={14} />,
            onClick: (item: CustomerList) => { handleDeleteClick(item) }
        }
    ];

    useEffect(() => {
        fetchCustomers(search, limit, page);
    }, [search, limit, page]);

    const fetchCustomers = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.GET_CUSTOMERS_FOR_LIST_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Assuming API response is { data: { customers: [], pagination: {} } }
            setCustomers(response.data.data.customers || []);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to fetch customers.");
        }
    };

    const handleEditClick = (item: CustomerList) => {
        navigate(`/admin/customers/edit/${item.id}`);
    }
    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    const handleDeleteClick = async (item: CustomerList) => {
        setDeleteItem(item);
        setDeleteModalOpen(true);
    }

    const handleConfirmDelete = async () => {
        if (deleteItem) {
            try {
                await axios.delete(`${Constants.DELETE_CUSTOMER_URL}/${deleteItem.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Customer deleted successfully.");
                fetchCustomers(search, limit, page);
                setDeleteModalOpen(false);
            } catch (error) {
                console.error("Error deleting customer:", error);
                toast.error("Failed to delete customer.");
            }
        }
    }
    // Calculate pagination display text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customer</h1>
                <button
                    onClick={() => { handleCreateClick(); }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Customer
                </button>
            </div>
            {/* Search Input & PageLength */}
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <select
                    value={limit}
                    onChange={(e) => handlePageLengthChange(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>
            {/* Table */}
            <Table headers={['#', 'Customer', 'Phone', 'Balance', 'Total Invoice', 'Created On', 'Status', 'Actions']}>
                {customers && customers.map((customer: any, index: number) => (
                    <TableRow
                        key={customer.id}
                        index={index + 1}
                        row={customer}
                        columns={[
                            <div className="flex items-center">
                                {customer.imageUrl ? (
                                    <img
                                        src={customer.imageUrl}
                                        alt={customer.name || "Customer"}
                                        className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-300 dark:border-gray-700"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center text-gray-800 dark:text-white rounded-full border border-gray-300 dark:border-gray-700 h-10 w-10 mr-3">
                                        <User2Icon size={20} />
                                    </div>
                                )}
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-white capitalize">
                                        {customer.name || ""}
                                    </span>
                                    <p className="text-gray-500 text-xs font-semibold">
                                        {customer.email || ""}
                                    </p>
                                </div>
                            </div>,
                            customer.phone,
                            customer.balance,
                            customer.total_invoice,
                            customer.createdAt,
                            customer.status
                        ]}
                        actions={tableActions}
                    >

                    </TableRow>
                ))}
                {!customers.length &&
                    <tr>
                        <td colSpan={8} className="text-center text-gray-800 dark:text-white py-2 font-semibold">No Customers Found</td>
                    </tr>
                }
            </Table>

            {/* Pagination Component */}
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

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
            />
        </div>
    );
}

export default CustomerList;