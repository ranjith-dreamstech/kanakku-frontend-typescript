import DeleteConfirmationModal from "@components/admin/DeleteConfirmationModal";
import PaginationWrapper from "@components/admin/PaginationWrapper";
import StatusBadge from "@components/admin/StatusBadge";
import Table from "@components/admin/Table";
import TableRow from "@components/admin/TableRow";
import Constants from "@constants/api";
import type { RootState } from "@store/index";
import axios from "axios";
import { CirclePlusIcon, Edit, Trash2Icon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

interface Quotation {
    id: string;
    quotationId: string;
    quotationDate: string;
    referenceNo: string;
    name: string;
    status: string;
    createdAt: string;
    paymentTerms: string;
    taxableAmount: number;
    totalDiscount: number;
    vat: number;
    TotalAmount: number;
    billFrom: string;
    billTo: {
        id: string;
        name: string;
        email: string;
        phone: string;
        image: string | null;
        billingAddress?: {
            name: string;
            addressLine1: string;
            addressLine2: string;
            city: string;
            state: string;
            country: string;
            pincode: string;
        }
    };
    notes: string;
    sign_type: string;
    signature?: {
        id: string;
        name: string;

    };
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const QuotationList: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [itemToDelete, setItemToDelete] = useState<Quotation | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 10, totalPages: 1 });

    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);
    const handleNewQuotationClick = () => {
        navigate("/admin/quotations/new");
    }

    const handleSearch = (value: string) => {
        setSearchParams({
            search: value,
            limit: String(limit),
            page: String(page)
        });
    }

    const handlePageLengthChange = (value: number) => {
        setSearchParams({
            search,
            limit: String(value),
            page: String(page)
        });
    }

    const fetchQuotations = async () => {
        try {
            const response = await axios.get(Constants.GET_QUOTATIONS_FOR_LIST_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let data = response.data.data;
            if (data.quotations.length > 0) {
                setQuotations(data.quotations);
            } else {
                setQuotations([]);
            }

            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching quotations:", error);
        }
    }

    useEffect(() => {
        fetchQuotations();
    }, [search, limit, page, token]);

    const handlePageChange = (page: number) => {
        setSearchParams({
            search: search || '',
            limit: limit ? String(limit) : '10',
            page: String(page)
        });
    }

    const tableActions = [
        {
            label: 'Edit',
            icon: <Edit size={14} />,
            onClick: (item: Quotation) => { handleEditClick(item) }
        },
        {
            label: 'Delete',
            icon: <Trash2Icon size={14} />,
            onClick: (item: Quotation) => { handleDeleteClick(item) }
        }
    ];

    const handleEditClick = (item: Quotation) => {
        navigate(`/admin/quotations/edit/${item.id}`);
    }
    const handleDeleteClick = (item: Quotation) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    }

    const confirmDelete = async () => {
        try {
            await axios.delete(`${Constants.DELETE_QUOTATION_URL}/${itemToDelete?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Quotation deleted successfully');
            setShowDeleteModal(false);
            await fetchQuotations();
        } catch (error) {
            console.error('Failed to delete quotation:', error);
        }
    }

    // Calculate pagination display text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quotations</h1>
                <button
                    onClick={handleNewQuotationClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Quotation
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
            {/* Quotation Table */}
            <Table headers={["#", "Quotation ID", "Customer", "Created On", "Status", "Actions"]}>
                {quotations && quotations.map((quotation, index) => (
                    <TableRow
                        key={quotation.id}
                        index={(page - 1) * limit + index + 1} // Correct index for pagination
                        row={quotation}
                        columns={[
                            quotation.quotationId, ,
                            <div className="flex items-center">
                                <img
                                    src={quotation.billTo?.image || 'null'}
                                    alt={quotation.billTo?.name}
                                    className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-300 dark:border-gray-700"
                                />
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-white capitalize">{quotation.billTo?.name}</span>
                                    <p className="text-gray-500 text-xs font-semibold">{quotation.billTo?.email}</p>
                                </div>
                            </div>,
                            <span className="font-semibold text-gray-800 dark:text-white">{new Date(quotation.createdAt).toLocaleDateString()}</span>,
                            <StatusBadge status={quotation.status} />,
                        ]}
                        actions={tableActions}
                    />
                ))}
                {quotations.length === 0 && (
                    <tr key="no-quotations">
                        <td className="text-center py-2 text-gray-800 dark:text-white font-semibold" colSpan={6}>
                            No Quotations Found
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
            {/* Delete Quotation */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this quotation?"
            >
            </DeleteConfirmationModal>
        </div>
    );
};

export default QuotationList;