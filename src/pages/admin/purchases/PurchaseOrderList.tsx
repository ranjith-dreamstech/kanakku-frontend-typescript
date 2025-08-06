import React, { useEffect, useState, type FC } from "react";
import { CirclePlusIcon, Edit, Trash2Icon } from "lucide-react";
import Table from "../../../components/admin/Tabls";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import Constants from "../../../constants/api";
import TableRow from "../../../components/admin/TableRow";
import Modal from "../../../components/admin/Modal";
import { toast } from "react-toastify";
import PaginationWrapper from "../../../components/admin/PaginationWrapper";

// Define a type for a single Purchase Order for better type safety
interface PurchaseOrder {
    id: string;
    purchaseOrderId: string;
    purchaseOrderDate: string;
    billFrom: string;
    billTo?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        profileImage: string;
    };
    TotalAmount: number;
    payment_mode: string;
    status: string;
}

// Define a type for the pagination data returned from the API
interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const PurchaseOrderList: FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    // State for the list of purchase orders and pagination
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 10, totalPages: 1 });

    // State for the delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<PurchaseOrder | null>(null);

    // Using URL search parameters to manage state for search, limit, and page
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    // Handlers for updating URL search parameters
    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    // Handler to navigate to the 'new purchase order' page
    const handleNewPoClick = () => {
        navigate("/admin/purchase-orders/new");
    };

    // Fetch purchase orders whenever search, limit, or page changes
    useEffect(() => {
        fetchPurchaseOrders(search, limit, page);
    }, [search, limit, page, token]);

    const fetchPurchaseOrders = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.FETCH_PURCHASE_ORDERS_URL, {
                params: { search, limit, page }, // Pass pagination params to the API
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPurchaseOrders(response.data.data.purchaseOrders ?? []);
            setPagination(response.data.data.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            toast.error('Failed to fetch purchase orders.');
        }
    };

    const handleEditClick = (item: PurchaseOrder) => {
        navigate(`/admin/purchase-orders/${item.id}`);
    };

    const handleDeleteClick = (item: PurchaseOrder) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_PURCHASE_ORDER_URL}/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Purchase order deleted successfully');
            fetchPurchaseOrders(search, limit, page); // Refetch data after delete
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete purchase order:', error);
            toast.error('Failed to delete purchase order.');
        }
    };

    // Define table actions
    const tableActions = [
        {
            label: 'Edit',
            icon: <Edit size={14} />,
            onClick: (item: PurchaseOrder) => { handleEditClick(item) }
        },
        {
            label: 'Delete',
            icon: <Trash2Icon size={14} />,
            onClick: (item: PurchaseOrder) => { handleDeleteClick(item) }
        }
    ];

    // Calculate pagination display text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase Orders</h1>
                <button
                    onClick={handleNewPoClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Purchase Order
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

            <Table headers={["#", "Order Number", "Date", "Supplier", "Amount", "Payment Mode", "Status", "Action"]}>
                {purchaseOrders && purchaseOrders.map((purchaseOrder, index) => (
                    <TableRow
                        key={purchaseOrder.id}
                        index={(page - 1) * limit + index + 1} // Correct index for pagination
                        row={purchaseOrder}
                        columns={[
                            purchaseOrder.purchaseOrderId,
                            purchaseOrder.purchaseOrderDate,
                            <div className="flex items-center">
                                <img
                                    src={purchaseOrder.billTo?.profileImage}
                                    alt={purchaseOrder.billTo?.name}
                                    className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-300 dark:border-gray-700"
                                />
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-white capitalize">{purchaseOrder.billTo?.name}</span>
                                    <p className="text-gray-500 text-xs font-semibold">{purchaseOrder.billTo?.email}</p>
                                </div>
                            </div>,
                            '₹'+purchaseOrder.TotalAmount,
                            purchaseOrder.payment_mode,
                            purchaseOrder.status,
                        ]}
                        actions={tableActions}
                    />
                ))}

                {purchaseOrders.length === 0 && (
                    <tr>
                        <td colSpan={8} className="text-center py-4 text-gray-800 dark:text-white font-semibold">
                            No purchase orders found
                        </td>
                    </tr>
                )}
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

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">
                    Are you sure you want to delete the purchase order <strong>{itemToDelete?.purchaseOrderId}</strong>?
                </p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded">
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

export default PurchaseOrderList;