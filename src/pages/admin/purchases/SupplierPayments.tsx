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

interface SupplierPayment {
    id: string;
    paymentId: string;
    referenceNumber: string;
    paymentDate: any;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    notes: string;
    supplier: {
        id: string;
        name: string;
        email: string;
        phone: string;
        profileImage: string;
    };
    purchase:{
        id: string;
        purchaseId: string;
        totalAmount: number;
        purchaseDate: string;
    };
    paymentMode: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const SupplierPayments: FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    // State for the list of supplier payments and pagination
    const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 10, totalPages: 1 });

    // State for the delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<SupplierPayment | null>(null);

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
    const handleNewPurchaseClick = () => {
        navigate("/admin/purchase/new");
    };

    // Fetch purchases whenever search, limit, or page changes
    useEffect(() => {
        fetchPurchases(search, limit, page);
    }, [search, limit, page, token]);

    const fetchPurchases = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.GET_SUPPLIER_PAYMENTS_URL, {
                params: { search, limit, page }, 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("response", response.data.data.payments);
            
            setSupplierPayments(response.data.data.payments ?? []);
            setPagination(response.data.data.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            toast.error('Failed to fetch purchase orders.');
        }
    };

    const handleEditClick = (item: SupplierPayment) => {
        navigate(`/admin/purchase-orders/edit/${item.id}`);
    };

    const handleDeleteClick = (item: SupplierPayment) => {
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
            fetchPurchases(search, limit, page); 
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete purchase order:', error);
            toast.error('Failed to delete purchase order.');
        }
    };

    const tableActions = [
        {
            label: 'Edit',
            icon: <Edit size={14} />,
            onClick: (item: SupplierPayment) => { handleEditClick(item) }
        },
        {
            label: 'Delete',
            icon: <Trash2Icon size={14} />,
            onClick: (item: SupplierPayment) => { handleDeleteClick(item) }
        }
    ];

    // Calculate pagination display text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Supplier Payments</h1>
                <button
                    onClick={handleNewPurchaseClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Payment
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

            <Table headers={["#", "Supplier", "Payment ID", "Payment Date", "Amount", "Payment Mode", "Action"]}>
                {supplierPayments && supplierPayments.map((payment, index) => (
                    <TableRow
                        key={payment.id}
                        index={(page - 1) * limit + index + 1} // Correct index for pagination
                        row={payment}
                        columns={[
                            <div className="flex items-center">
                                <img
                                    src={payment.supplier?.profileImage}
                                    alt={payment.supplier?.name}
                                    className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-300 dark:border-gray-700"
                                />
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-white capitalize">{payment.supplier?.name}</span>
                                    <p className="text-gray-500 text-xs font-semibold">{payment.supplier?.email}</p>
                                </div>
                            </div>,
                            payment.paymentId,
                            payment.paymentDate,
                            '₹' + payment.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                            payment.paymentMode ?? "CASH",
                        ]}
                        actions={tableActions}
                    />
                ))}

                {supplierPayments.length === 0 && (
                    <tr>
                        <td colSpan={8} className="text-center py-4 text-gray-800 dark:text-white font-semibold">
                            No supplier payments found
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
                    Are you sure you want to delete the payment <strong>{itemToDelete?.paymentId}</strong>?
                </p>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded cursor-pointer">
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

export default SupplierPayments;