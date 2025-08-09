import React, { useCallback, useEffect, useState, type FC } from "react";
import Modal from "../../../../components/admin/Modal";
import { Edit, Image, Trash2Icon, CirclePlusIcon } from "lucide-react";
import Constants from "../../../../constants/api"; // Assuming API constants are defined here
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import Table from "../../../../components/admin/Table";
import TableRow from "../../../../components/admin/TableRow"; // Assuming you have this component
import { useSearchParams } from "react-router-dom";
import Pagination from "@mui/material/Pagination";
import Switch from "../../../../components/admin/Switch";
import CustomPagination from "../../../../components/admin/CustomPagination";
import PaginationWrapper from "../../../../components/admin/PaginationWrapper";
// Interface for the form data
interface SignatureFormData {
    id?: string;
    signatureName: string;
    signatureImage: File | null;
    signatureImage_preview_url?: string;
    signatureImage_removed?: boolean;
    markAsDefault?: boolean;
    status?: boolean;
}

// Interface for signature data from API
interface Signature {
    id: string;
    signatureName: string;
    signatureImage: string; // URL from server
    markAsDefault: boolean;
    status: boolean;
    createdAt: string;
}

// Interface for pagination data from API
interface SignaturePagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const initialFormData: SignatureFormData = {
    signatureName: '',
    signatureImage: null,
    signatureImage_preview_url: '',
    signatureImage_removed: false,
    markAsDefault: false,
    status: true
};

const SignatureList: FC = () => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const { token } = useSelector((state: RootState) => state.auth);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<Signature | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState<SignaturePagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [formData, setFormData] = useState<SignatureFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Derive search, limit, and page from URL search params
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    const fetchSignatures = async (currentSearch = search, currentLimit = limit, currentPage = page) => {
        try {
            const response = await axios.get(Constants.GET_SIGNATURES_URL, {
                params: { search: currentSearch, limit: currentLimit, page: currentPage },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSignatures(response.data.data.signatures);
            if (response.data.data.pagination) setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching signatures:", error);
            toast.error("Failed to fetch signatures.");
        }
    };

    useEffect(() => {
        fetchSignatures();
    }, [search, limit, page, token]);

    // --- Handlers for Search and Pagination ---
    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };
    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    // --- Handlers for CRUD operations ---
    const handleEditClick = (item: Signature) => {
        setFormData({
            ...item,
            signatureImage_preview_url: item.signatureImage, // Set preview URL from existing image
            signatureImage: null,
            signatureImage_removed: false,
        });
        setIsEditMode(true);
        setFormErrors({});
        setShowModal(true);
    };

    const handleDeleteClick = (signature: Signature) => {
        setItemToDelete(signature);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            // NOTE: Replace with your actual delete endpoint
            await axios.delete(`${Constants.DELETE_SIGNATURE_URL}/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Signature deleted successfully');
            fetchSignatures(); // Refresh the list
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete signature:', error);
            toast.error('Failed to delete signature.');
        }
    };

    // --- Table Actions Definition ---
    const tableActions = [
        { label: 'Edit', icon: <Edit size={14} />, onClick: (item: Signature) => handleEditClick(item) },
        { label: 'Delete', icon: <Trash2Icon size={14} />, onClick: (item: Signature) => handleDeleteClick(item) }
    ];

    // --- Form Handling ---
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.signatureName.trim()) {
            newErrors.signatureName = 'Signature name is required.';
        } else if (formData.signatureName.length < 3) {
            newErrors.signatureName = 'Name must be at least 3 characters.';
        }
        if (!isEditMode && !formData.signatureImage) {
            newErrors.signatureImage = 'Signature image is required for new entries.';
        }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                signatureImage: file,
                signatureImage_preview_url: URL.createObjectURL(file),
                signatureImage_removed: false
            }));
        }
    };

    const handleImageDelete = () => {
        setFormData(prev => ({
            ...prev,
            signatureImage: null,
            signatureImage_preview_url: '',
            signatureImage_removed: true
        }));
    };

    const handleStatusChange = async (id: String, newStatus: boolean) => {
        setSignatures(prev =>
            prev.map(sig =>
                sig.id === id ? { ...sig, status: newStatus } : sig
            )
        );
        try {
            await axios.patch(`${Constants.UPDATE_SIGNATURE_STATUS_URL}/${id}`, { status: newStatus }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchSignatures();
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status.');
        }

    }

    const handleDefaultChange = async (id: String, newDefault: boolean) => {
        try {
            await axios.patch(`${Constants.UPDATE_SIGNATURE_DEFAULT_URL}/${id}`, { markAsDefault: newDefault }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchSignatures();
            toast.success('Default signature updated successfully');
        } catch (error) {
            toast.error('Failed to update default.');
        }
    }
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data = new FormData();
        data.append('signatureName', formData.signatureName);
        data.append('markAsDefault', String(formData.markAsDefault || false));
        data.append('status', String(formData.status || false));

        if (formData.signatureImage instanceof File) {
            data.append('signatureImage', formData.signatureImage);
        }
        if (formData.signatureImage_removed) {
            data.append('signatureImage_removed', 'true');
        }

        try {
            if (isEditMode) {
                // NOTE: Replace with your actual update endpoint
                await axios.put(`${Constants.UPDATE_SIGNATURE_URL}/${formData.id}`, data, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Signature updated successfully');
            } else {
                // NOTE: Replace with your actual create endpoint
                await axios.post(Constants.CREATE_SIGNATURE_URL, data, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Signature created successfully');
            }
            fetchSignatures();
            setShowModal(false);
        } catch (error: any | AxiosError) {
            setFormErrors(error?.response?.data?.errors || {});
            toast.error('Something went wrong. Please try again.');
        }
    };

    // --- Render Logic ---
    console.log(pagination);

    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);
    
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Signatures</h1>
                <button
                    onClick={() => {
                        setIsEditMode(false);
                        setFormData(initialFormData);
                        setFormErrors({});
                        setShowModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Signature
                </button>
            </div>

            {/* Search and Page Length */}
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Search signatures..."
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
                        <option key={num} value={num} >{num} / page</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <Table headers={["#", "Signature Name", "Signature", "Status", "Default", "Actions"]}>
                {signatures && signatures.length > 0 ? signatures.map((sig, index) => (
                    <TableRow
                        key={sig.id}
                        index={from + index}
                        row={sig}
                        columns={[
                            sig.signatureName,
                            <img src={sig.signatureImage} alt={sig.signatureName} className="h-10 w-24 object-cover border rounded-md" />,
                            <Switch name={`status-${sig.id}`} checked={sig.status} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStatusChange(sig.id, e.target.checked)} disabled={sig.markAsDefault} />,
                            <Switch name={`status-${sig.id}`} checked={sig.markAsDefault} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDefaultChange(sig.id, e.target.checked)} />,
                        ]}
                        actions={tableActions}
                    />
                )) : (
                    <tr>
                        <td colSpan={6} className="text-center py-4 text-gray-500 font-medium">No Signatures Found</td>
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
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Update Signature' : 'Create Signature'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-24 h-24 border border-gray-300 rounded-md flex items-center justify-center overflow-hidden bg-white">
                            {formData.signatureImage_preview_url ? (
                                <img src={formData.signatureImage_preview_url} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xl text-gray-400"><Image /></span>
                            )}
                            {formData.signatureImage_preview_url && (
                                <button type="button" onClick={handleImageDelete} title="Remove Image" className="absolute top-[-1px] right-[-1px] bg-white border border-red-500 rounded-full p-1 shadow-md hover:bg-red-500 group">
                                    <Trash2Icon size={14} className="text-red-500 group-hover:text-white" />
                                </button>
                            )}
                        </div>
                        <div>
                            <label htmlFor="imageUpload" className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md transition duration-200 cursor-pointer">
                                <Image size={16} className="mr-2" /> Upload Image
                            </label>
                            <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" id="imageUpload" />
                            <p className="text-xs text-gray-500 mt-1">PNG or JPG, max 5MB.</p>
                            {formErrors.signatureImage && <p className="text-red-500 text-xs mt-1">{formErrors.signatureImage}</p>}
                        </div>
                    </div>

                    {/* Signature Name */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700 dark:text-gray-200">Name <span className="text-red-500">*</span></label>
                        <input
                            name="signatureName"
                            value={formData.signatureName}
                            onChange={handleChange}
                            type="text"
                            placeholder="Enter Signature Name"
                            className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                        />
                        {formErrors.signatureName && <p className="text-red-500 text-xs mt-1">{formErrors.signatureName}</p>}
                    </div>

                    {/* Status and Is Default */}
                    <div className="flex justify-between items-center gap-6 flex-wrap">
                        {/* Status Switch */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="status" className="font-medium text-sm text-gray-700 dark:text-gray-200">
                                Status
                            </label>
                            <Switch
                                name="status"
                                checked={formData.status ?? false}
                                onChange={handleChange}
                                disabled={false}
                            />
                        </div>

                        {/* Default Switch */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="markAsDefault" className="font-medium text-sm text-gray-700 dark:text-gray-200">
                                Set as Default
                            </label>
                            <Switch
                                name="markAsDefault"
                                checked={formData.markAsDefault ?? false}
                                onChange={handleChange}
                            />
                        </div>
                    </div>


                    {/* Buttons */}
                    <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer">Cancel</button>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md cursor-pointer">{isEditMode ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-700 dark:text-gray-200">
                    Are you sure you want to delete <strong>{itemToDelete?.signatureName}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded cursor-pointer">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default SignatureList;