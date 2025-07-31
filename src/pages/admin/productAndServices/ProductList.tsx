import { useEffect, useState, useRef } from "react";
import type { FC, ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Constants from "../../../constants/api";
import axios from "axios";
import Table from "../../../components/admin/Tabls";
import Modal from "../../../components/admin/Modal";
import PaginationWrapper from "../../../components/admin/PaginationWrapper";
import { EditIcon, TrashIcon, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Define interfaces for nested and main objects
interface Brand {
    _id: string;
    brand_name: string;
}

interface Category {
    _id: string;
    category_name: string;
}

interface Product {
    _id: string;
    name: string;
    code: string;
    product_image: string;
    selling_price: number;
    status: boolean;
    brand: Brand | null;
    category: Category | null;
}

// Interface for pagination data from the API
interface ProductPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const ProductList: FC = () => {
    // Hooks
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<ProductPagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [itemToDelete, setItemToDelete] = useState<Product | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

    // Get params from URL
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 10);
    const page = Number(searchParams.get('page') || 1);

    // Fetch products based on URL params
    const fetchProducts = async (search?: string, limit?: number, page?: number) => {
        try {
            const response = await axios.get(Constants.FETCH_PRODUCTS_URL, {
                params: { search, limit, page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Assumed API response structure: { data: { products: [], pagination: {} } }
            setProducts(response.data.data.products || []);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products.");
        }
    };

    // Effect to fetch data when URL params change
    useEffect(() => {
        fetchProducts(search, limit, page);
    }, [search, limit, page]);

    // Effect to handle clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current.every(ref => ref && !ref.contains(event.target as Node))) {
                setActiveDropdownIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handlers for search and pagination controls
    const handleSearch = (keyword: string) => {
        setSearchParams({ search: keyword, limit: String(limit), page: '1' });
    };

    const handlePageLengthChange = (newLimit: number) => {
        setSearchParams({ search, limit: String(newLimit), page: '1' });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ search, limit: String(limit), page: String(newPage) });
    };

    // Action handlers
    const handleEditClick = (product: Product) => {
        navigate(`/admin/products/edit/${product._id}`);
    };

    const handleDeleteClick = (product: Product) => {
        setItemToDelete(product);
        setDeleteModalOpen(true);
        setActiveDropdownIndex(null);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_PRODUCT_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Product deleted successfully');
            fetchProducts(search, limit, page); // Refetch current page
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete product:', error);
            toast.error('Failed to delete product.');
        }
    };
    
    // Calculate display range for pagination text
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h1>
                <button
                    onClick={() => navigate('/admin/products/new')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow"
                >
                    + New Product
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search by name, code, brand, category..."
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-1/3 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-800"
                />
                <select
                    value={limit}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handlePageLengthChange(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                    {[10, 25, 50].map((num) => <option key={num} value={num}>{num} / page</option>)}
                </select>
            </div>

            <Table headers={["#", "Product", "Brand", "Category", "Price", "Status", "Actions"]}>
                {products.length > 0 ? (
                    products.map((product, index) => (
                        <tr key={product._id} ref={ref => (dropdownRef.current[index] = ref)} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-2">{(page - 1) * limit + index + 1}</td>
                            <td className="font-semibold px-4 py-2 text-gray-700 dark:text-gray-300">
                                <div className="flex items-center space-x-3">
                                    <img src={product.product_image} alt={product.name} className="w-10 h-10 rounded-full object-cover border dark:border-gray-600" />
                                    <div>
                                        <span>{product.name}</span>
                                        <p className="text-xs text-gray-500 font-normal">{product.code}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{product.brand?.brand_name || 'N/A'}</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{product.category?.category_name || 'N/A'}</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">₹{product.selling_price.toFixed(2)}</td>
                            <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {product.status ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-4 py-2">
                                <div className="relative inline-block text-left">
                                    <button onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <MoreVertical size={18} />
                                    </button>
                                    {activeDropdownIndex === index && (
                                        <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg">
                                            <button onClick={() => handleEditClick(product)} className="w-full flex items-center px-4 py-2 text-left text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                <EditIcon size={16} className="mr-2" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteClick(product)} className="w-full flex items-center px-4 py-2 text-left text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-500">
                                                <TrashIcon size={16} className="mr-2" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={7} className="text-center py-4 font-semibold text-gray-500">No products found</td></tr>
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

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-800 dark:text-gray-200">Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default ProductList;