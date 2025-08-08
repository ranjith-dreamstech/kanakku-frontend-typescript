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
import StatusBadge from "../../../components/admin/StatusBadge";
import PaymentModeBadge from "../../../components/admin/PaymentModeBadge";
import DeleteConfirmationModal from "../../../components/admin/DeleteConfirmationModal";

interface DebitNoteList {
    id: string;
    debitNoteId: string;
    referenceNo: string;
    vendor: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    purchase: {
        id: string;
        purchaseId: string;
        purchaseDate: string;
        totalAmount: number;
    };
    paymentMode?:{
        id: string;
        name: string;
        slug: string;
    };
    debitNoteDate: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    sign_type: string;
    signatureName: string | null;
    signatureImage: string | null;
    notes: string;
    createdBy: {
        id: string;
        name: string;
    };
    approvedBy?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const DebitNoteList: FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    // State for the list of purchase orders and pagination
    const [debitNotes, setDebitNotes] = useState<DebitNoteList[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 10, totalPages: 1 });

    // State for the delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<DebitNoteList | null>(null);

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
    const handleNewDebitNoteClick = () => {
        navigate("/admin/debit-notes/new");
    };

    // Fetch debitNotes whenever search, limit, or page changes
    useEffect(() => {
        fetchDebitNotes(search, limit, page);
    }, [search, limit, page, token]);

    const fetchDebitNotes = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.FETCH_FOR_DEBIT_NOTE_LIST_URL, {
                params: { search, limit, page }, 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setDebitNotes(response.data.data?.debitNotes ?? []);
            setPagination(response.data.data.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            toast.error('Failed to fetch purchase orders.');
        }
    };

    const handleEditClick = (item: Purchase) => {
        navigate(`/admin/purchase-orders/edit/${item.id}`);
    };

    const handleDeleteClick = (item: DebitNoteList) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_DEBIT_NOTE_URL}/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Debit note deleted successfully');
            fetchDebitNotes(search, limit, page); 
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete debit note:', error);
            toast.error('Failed to delete debit note.');
        }
    };

    const tableActions = [
        {
            label: 'Edit',
            icon: <Edit size={14} />,
            onClick: (item: Purchase) => { handleEditClick(item) }
        },
        {
            label: 'Delete',
            icon: <Trash2Icon size={14} />,
            onClick: (item: DebitNoteList) => { handleDeleteClick(item) }
        }
    ];

    // Calculate pagination display text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Debit Notes (Purchase Returns)</h1>
                <button
                    onClick={handleNewDebitNoteClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Debit Note
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

            <Table headers={["#", "Debit Note ID","Purchase ID", "Date", "Supplier", "Amount", "Payment Mode", "Status", "Action"]}>
                {debitNotes && debitNotes.map((debitNote, index) => (
                    <TableRow
                        key={debitNote.id}
                        index={(page - 1) * limit + index + 1} // Correct index for pagination
                        row={debitNote}
                        columns={[
                            debitNote.debitNoteId,
                            debitNote.purchase?.purchaseId || "",
                            debitNote.debitNoteDate,
                            <div className="flex items-center">
                                <img
                                    src={debitNote.vendor.profileImage}
                                    alt={debitNote.vendor.name}
                                    className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-300 dark:border-gray-700"
                                />
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-white capitalize">{debitNote.vendor.name || ""}</span>
                                    <p className="text-gray-500 text-xs font-semibold">{debitNote.vendor?.email || ""}</p>
                                </div>
                            </div>,
                            '₹' + debitNote.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                            <PaymentModeBadge mode={debitNote.paymentMode?.name ?? "NA"} />,
                            <StatusBadge status={debitNote.status} />,
                        ]}
                        actions={tableActions}
                    />
                ))}

                {debitNotes.length === 0 && (
                    <tr>
                        <td colSpan={8} className="text-center py-4 text-gray-800 dark:text-white font-semibold">
                            No debit notes found
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
            
            <DeleteConfirmationModal 
                isOpen={showDeleteModal} 
                onClose={() => setShowDeleteModal(false)} 
                onConfirm={confirmDelete} 
                title="Confirm Deletion"
                message="Are you sure you want to delete this debit note?"
                >
            </DeleteConfirmationModal>
        </div>
    );
}

export default DebitNoteList;