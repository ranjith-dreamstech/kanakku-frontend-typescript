import DeleteConfirmationModal from "@components/admin/DeleteConfirmationModal";
import InvoiceStatusBadge from "@components/admin/InvoiceStatusBadge";
import PaginationWrapper from "@components/admin/PaginationWrapper";
import StatusBadge from "@components/admin/StatusBadge";
import Table from "@components/admin/Table";
import TableRow from "@components/admin/TableRow";
import Constants from "@constants/api";
import type { RootState } from "@store/index";
import axios from "axios";
import { CirclePlusIcon, Edit, LucideEye, Trash2Icon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string | null;
    referenceNo: string;
    name: string;
    status: string;
    createdAt: string;
    paymentTerms: string;
    taxableAmount: number;
    totalDiscount: number;
    vat: number;
    TotalAmount: number;
    paidAmount: number | null;
    payment_method: string;
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

const InvoiceList: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [itemToDelete, setItemToDelete] = useState<Invoice | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 10, totalPages: 1 });

    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);
    const handleNewInvoiceClick = () => {
        navigate("/admin/create-invoice");
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

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(Constants.GET_INVOICES_FOR_LIST_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let data = response.data.data;
            if (data.invoices.length > 0) {
                setInvoices(data.invoices);
            } else {
                setInvoices([]);
            }

            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching quotations:", error);
        }
    }

    useEffect(() => {
        fetchInvoices();
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
            label: 'View',
            icon: <LucideEye size={14} />,
            onClick: (item: Invoice) => { handleViewClick(item) }
        },
        {
            label: 'Edit',
            icon: <Edit size={14} />,
            onClick: (item: Invoice) => { handleEditClick(item) }
        },
        {
            label: 'Delete',
            icon: <Trash2Icon size={14} />,
            onClick: (item: Invoice) => { handleDeleteClick(item) }
        }
    ];

    const handleViewClick = (item: Invoice) => {
        navigate(`/admin/view-invoice/${item.id}`);
    }
    const handleEditClick = (item: Invoice) => {
        navigate(`/admin/edit-invoice/${item.id}`);
    }
    const handleDeleteClick = (item: Invoice) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    }

    const confirmDelete = async () => {
        try {
            await axios.delete(`${Constants.DELETE_INVOICE_URL}/${itemToDelete?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Invoice deleted successfully');
            setShowDeleteModal(false);
            await fetchInvoices();
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Invoices</h1>
                <button
                    onClick={handleNewInvoiceClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Invoice
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
            {/* Invoice Table */}
            <Table headers={["#", "Invoice ID", "Customer", "Created On", "Amount", "Paid", "Status", "Payment Method", "Due Date", "Actions"]}>
                {invoices && invoices.map((invoice, index) => (
                    <TableRow
                        key={invoice.id}
                        index={(page - 1) * limit + index + 1} // Correct index for pagination
                        row={invoice}
                        columns={[
                            invoice.invoiceNumber, ,
                            <div className="flex items-center">
                                <img
                                    src={invoice.billTo?.image || 'null'}
                                    alt={invoice.billTo?.name}
                                    className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-300 dark:border-gray-700"
                                />
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-white capitalize">{invoice.billTo?.name}</span>
                                    <p className="text-gray-500 text-xs font-semibold">{invoice.billTo?.email}</p>
                                </div>
                            </div>,
                            <span className="font-semibold text-gray-800 dark:text-white">{new Date(invoice.createdAt).toLocaleDateString()}</span>,
                            <span className="font-semibold text-gray-800 dark:text-white">{invoice.TotalAmount}</span>,
                            <span className="font-semibold text-gray-800 dark:text-white">{invoice.paidAmount ?? "0"}</span>,
                            <InvoiceStatusBadge status={invoice.status} />,
                            <span className="font-semibold text-gray-800 dark:text-white">{invoice.payment_method ?? ""}</span>,
                            <span className="font-semibold text-gray-800 dark:text-white">{new Date(invoice.dueDate as string).toLocaleDateString()}</span>,
                        ]}
                        actions={tableActions}
                    />
                ))}
                {invoices.length === 0 && (
                    <tr key="no-quotations">
                        <td className="text-center py-2 text-gray-800 dark:text-white font-semibold" colSpan={10}>
                            No Invoice Found
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
            {/* Delete Invoice */}
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

export default InvoiceList;