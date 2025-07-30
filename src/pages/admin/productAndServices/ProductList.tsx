import { useEffect, useState, useRef } from "react";
import type { FC, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Constants from "../../../constants/api";
import axios from "axios";
import Table from "../../../components/admin/Tabls";
import Modal from "../../../components/admin/Modal";
import { EditIcon, TrashIcon, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

// Define interfaces for nested objects to ensure type safety
interface Brand {
    _id: string;
    brand_name: string;
}

interface Category {
    _id: string;
    category_name: string;
}

// Define the main interface for a Product object
interface Product {
    _id: string;
    name: string;
    code: string;
    product_image: string;
    selling_price: number;
    status: boolean;
    brand: Brand | null; // Brand can be null
    category: Category | null; // Category can be null
}

const ProductList: FC = () => {
    // State variables with explicit TypeScript types
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredData, setFiltered] = useState<Product[]>([]);
    const [itemToDelete, setItemToDelete] = useState<Product | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [perPage, setPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<(HTMLTableRowElement | null)[]>([]);

    const fetchProducts = async () => {
        try {
            // Type the expected response data from the API call
            const response = await axios.get<Product[]>(Constants.FETCH_PRODUCTS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProducts(response.data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products.");
        }
    };

    useEffect(() => {
        fetchProducts();
        // Add type for the event parameter
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current.every(ref => ref && !ref.contains(event.target as Node))) {
                setActiveDropdownIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.code.toLowerCase().includes(search.toLowerCase()) ||
            // Optional chaining is great here for type safety
            product.brand?.brand_name.toLowerCase().includes(search.toLowerCase()) ||
            product.category?.category_name.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(filtered);
    }, [search, products]);

    // Pagination Logic
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentProducts = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / perPage);

    // Add type for the product parameter
    const handleEditClick = (product: Product) => {
        navigate(`/admin/products/edit/${product._id}`);
    };

    // Add type for the product parameter
    const handleDeleteClick = (product: Product) => {
        setItemToDelete(product);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        // A type guard to ensure itemToDelete is not null
        if (!itemToDelete) return;
        try {
            await axios.delete(`${Constants.DELETE_PRODUCT_URL}/${itemToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Product deleted successfully');
            fetchProducts();
            setDeleteModalOpen(false);
            setItemToDelete(null); // Reset state
        } catch (error) {
            console.error('Failed to delete product:', error);
            toast.error('Failed to delete product.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h1>
                <button
                    onClick={() => navigate('/admin/products/new')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow cursor-pointer"
                >
                    + New Product
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                    type="text"
                    placeholder="Search by name, code, brand, category..."
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-1/3 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <select
                    value={perPage}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setPerPage(Number(e.target.value))}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                    {[10, 25, 50].map((num) => <option key={num} value={num}>{num} / page</option>)}
                </select>
            </div>

            <Table headers={["#", "Product", "Brand", "Category", "Price", "Status", "Actions"]}>
                {currentProducts.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4">No products found</td></tr>
                ) : (
                    currentProducts.map((product, index) => (
                        <tr key={product._id} ref={ref => (dropdownRef.current[index] = ref)} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-2">{indexOfFirst + index + 1}</td>
                            <td className="font-semibold px-4 py-2">
                                <div className="flex items-center space-x-3">
                                    <img src={'http://127.0.0.1:5000' + product.product_image} alt={product.name} className="w-10 h-10 rounded-full object-cover" />
                                    <span>{product.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-2">{product.brand?.brand_name || 'N/A'}</td>
                            <td className="px-4 py-2">{product.category?.category_name || 'N/A'}</td>
                            <td className="px-4 py-2">${product.selling_price.toFixed(2)}</td>
                            <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {product.status ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-4 py-2">
                                <div className="relative inline-block text-left">
                                    <button onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <MoreVertical size={18} />
                                    </button>
                                    {activeDropdownIndex === index && (
                                        <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg">
                                            <button onClick={() => handleEditClick(product)} className="w-full flex items-center px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                                <EditIcon size={16} className="mr-2" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteClick(product)} className="w-full flex items-center px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                                <TrashIcon size={16} className="mr-2" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </Table>

            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredData.length > 0 ? indexOfFirst + 1 : 0} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} entries
                </p>
                <div className="space-x-2 text-sm">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 text-gray-600 dark:text-gray-300 dark:border-gray-600 cursor-pointer"
                    >
                        Previous
                    </button>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{currentPage}</span>
                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 text-gray-600 dark:text-gray-300 dark:border-gray-600 cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <p className="mb-4 text-gray-800 dark:text-gray-200">Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded cursor-pointer">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default ProductList;