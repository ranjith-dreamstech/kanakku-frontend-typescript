import React, { useEffect, useState, type FC, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import type { RootState } from "../../../store";
import Constants from "../../../constants/api";
import Table from "../../../components/admin/Tabls";
import Modal from "../../../components/admin/Modal";
import PaginationWrapper from "../../../components/admin/PaginationWrapper";
import UnitTableRow from "../../../components/admin/UnitTableRow"; // Assuming this is the correct path

// Define the shape of your data
interface Unit {
    _id: string;
    unit_name: string;
    short_name: string;
    status: boolean;
}

// Define the shape for pagination data from the API
interface UnitPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

type NewUnit = Omit<Unit, '_id'>;

// Define the shape for form validation errors
interface FormErrors {
    unit_name?: string;
    short_name?: string;
}

const UnitList: FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [pagination, setPagination] = useState<UnitPagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [searchParams, setSearchParams] = useSearchParams();

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingUnit, setEditingUnit] = useState<string | null>(null);
    const [newUnit, setNewUnit] = useState<NewUnit>({
        unit_name: '',
        short_name: '',
        status: true,
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<Unit | null>(null);
    const { token } = useSelector((state: RootState) => state.auth);

    // Get search, limit, and page from URL params
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    const fetchUnits = async (search?: string, limit?: number, page?: number): Promise<void> => {
        try {
            const response = await axios.get(Constants.FETCH_UNITS_URL, {
                params: { search, limit, page },
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnits(response.data.data.units || []);
            setPagination(response.data.data.pagination); // Assuming API returns pagination info
        } catch (error) {
            console.error('Error fetching units:', error);
            toast.error("Failed to fetch units.");
        }
    };

    useEffect(() => {
        fetchUnits(search, limit, page);
    }, [search, limit, page]);

    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    const toggleStatus = async (unit: Unit): Promise<void> => {
        const updatedUnit = { ...unit, status: !unit.status };
        try {
            await axios.put(`${Constants.UPDATE_UNIT_URL}/${unit._id}`, updatedUnit, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Status updated successfully');
            fetchUnits(search, limit, page); // Refetch current page
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status.');
        }
    };

    const handleNewUnitChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value, type, checked } = e.target;
        setNewUnit((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleNewUnitSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setFormErrors({});

        try {
            const headers = { Authorization: `Bearer ${token}` };

            if (editingUnit) {
                await axios.put(`${Constants.UPDATE_UNIT_URL}/${editingUnit}`, newUnit, { headers });
                toast.success('Unit updated successfully');
            } else {
                await axios.post(Constants.CREATE_UNIT_URL, newUnit, { headers });
                toast.success('Unit added successfully');
            }

            fetchUnits(search, limit, page); // Refetch current page
            setShowModal(false);
            setNewUnit({ unit_name: '', short_name: '', status: true });
            setEditingUnit(null);
        } catch (err: any) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                console.error('Error:', err);
                const message = editingUnit ? 'Failed to update unit.' : 'Failed to add unit.';
                toast.error(message);
            }
        }
    };

    const handleEditClick = async (unit: Unit): Promise<void> => {
        try {
            const response = await axios.get<Unit>(`${Constants.GET_UNIT_URL}/${unit._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEditingUnit(unit._id);
            setNewUnit({
                unit_name: response.data.unit_name,
                short_name: response.data.short_name,
                status: response.data.status,
            });
            setFormErrors({});
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load unit:', error);
            toast.error('Failed to load unit data.');
        }
    };

    const handleDeleteClick = (item: Unit): void => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async (): Promise<void> => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_UNIT_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Unit deleted successfully');
            fetchUnits(search, limit, page); // Refetch current page
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete unit:', error);
            toast.error('Failed to delete unit.');
        }
    };
    
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Units</h1>
                <button
                    onClick={() => {
                        setEditingUnit(null);
                        setShowModal(true);
                        setNewUnit({ unit_name: '', short_name: '', status: true });
                        setFormErrors({});
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow"
                >
                    + New Unit
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search by name or short name.."
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded-md w-full md:w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <select
                    value={limit}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handlePageLengthChange(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>

            <Table headers={['#', 'Unit Name', 'Short Name', 'Status', 'Action']}>
                {units.length > 0 ? (
                    units.map((unit, index) => (
                        <UnitTableRow
                            key={unit._id}
                            index={(page - 1) * limit + index + 1} // Correct numbering for pagination
                            unit={unit}
                            onToggle={toggleStatus}
                            onEdit={handleEditClick}
                            handleDeleteClick={() => handleDeleteClick(unit)}
                        />
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="text-center py-6 text-gray-500 font-semibold">
                            No Units Found
                        </td>
                    </tr>
                )}
            </Table>

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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUnit ? 'Edit Unit' : 'Add New Unit'}>
                <form onSubmit={handleNewUnitSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Name</label>
                        <input
                            type="text"
                            name="unit_name"
                            value={newUnit.unit_name}
                            onChange={handleNewUnitChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        />
                        {formErrors.unit_name && (
                            <p className="text-sm text-red-600 mt-1">{formErrors.unit_name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Short Name</label>
                        <input
                            type="text"
                            name="short_name"
                            value={newUnit.short_name}
                            onChange={handleNewUnitChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        />
                        {formErrors.short_name && (
                            <p className="text-sm text-red-600 mt-1">{formErrors.short_name}</p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow cursor-pointer"
                        >
                            {editingUnit ? 'Update Unit' : 'Add Unit'}
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
                    <strong>{itemToDelete?.unit_name}</strong>?
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
};

export default UnitList;