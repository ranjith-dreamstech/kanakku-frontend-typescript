import type React from 'react';
import { PlusCircle, Calendar, ChevronDown, Edit, Trash2 } from 'lucide-react';
import DateInput from '../../../components/admin/DateInput';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Constants from '../../../constants/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import SearchableDropdown from '../../../components/admin/SearchableDropdown';
import { useDebounce } from '../../../hooks/useDebounce';

interface User {
    id: string;
    name: string;
}

interface PurchaseFormData {
    billFrom: string;
    billTo: string;
    items: productItem[];
}

const initialFormData: PurchaseFormData = {
    billFrom: '',
    billTo: '',
    items: []
}
interface selectedAdmin {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string;
    siteLogo: File | null;
    favicon: File | null;
    companyLogo: File | null;
    fax: string;
    userId: string | null;
}

interface selectedSupplier {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    user_type: number;
    profileImage: string;
    dateOfBirth: string;
    address: string;
    country: string | null;
    state: string | null;
    city: string | null;
    postalCode: string;
}

interface Product {
    id: string;
    item_type: string;
    name: string;
    code: string;
    unit: {
        id: string;
        name: string;
    } | null;
    prices: {
        selling: number;
        purchase: number;
    },
    discount: {
        type: 'Fixed' | 'Percentage';
        value: number;
    } | null;
    tax: {
        group_id: string;
        group_name: string;
        total_rate: number;
        components: {
            rate_id: string;
            name: string;
            rate: number;
            status: boolean;
        }[],
    } | null;
    quantity: number;
    rate: number;
    amount: number;
}

interface productItem {
    id: string;
    name: string;
    unit: string;
    qty: number;
    rate: number;
    discount: number;
    tax: number;
    amount: number;
}
const CreatePurchaseOrder: React.FC = () => {
    // Dropdown options state
    const [adminUsers, setAdminUsers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<User[]>([]);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearchInput, setProductSearchInput] = useState<string>('');
    const [isProductLoading, setIsProductLoading] = useState<boolean>(false);
    const [PurchaseFormData, setPurchaseFormData] = useState<PurchaseFormData>(initialFormData);
    // Use the debounce hook to delay API calls
    const debouncedSearchTerm = useDebounce(productSearchInput, 500); // 500ms delay

    // Selected items state
    const [selectedItems, setSelectedItems] = useState<productItem[]>([]);
    
    // Selected admin/supplier state
    const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<User | null>(null);
    const [companyDetails, setCompanyDetails] = useState<selectedAdmin | null>(null);
    const [supplierDetails, setSupplierDetails] = useState<selectedSupplier | null>(null);

    const { token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        fetchAdminUsers();
        fetchSuppliers();
    }, []);

    // Function to handle admin user selection
    const handleAdminChange = async (user: User) => {
        setSelectedAdmin(user);
        try {
            const response = await axios.get(`${Constants.FETCH_COMPANY_SETTINGS_URL}/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            setCompanyDetails(response.data.data);
        } catch (error) {
            setCompanyDetails(null);
        }
    }

    // handle supplier selection
    const handleSupplierChange = async (user: User) => {
        setSelectedSupplier(user);
        try {
            const response = await axios.get(`${Constants.FETCH_USER_BY_ID_URL}/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            setSupplierDetails(response.data.data);
        } catch (error) {
            setSupplierDetails(null);
        }
    }

    useEffect(() => {
        const fetchProductsByQuery = async () => {
            // Only search if the debounced term is not empty
            if (debouncedSearchTerm) {
                setIsProductLoading(true);
                try {
                    const response = await axios.get(`${Constants.FETCH_PRODUCTS_WITH_SEARCH_URL}?search=${debouncedSearchTerm}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const availableProducts = response.data.data.filter(
                        (product: Product) => !selectedItems.some(selected => selected.id === product.id)
                    );
                    setProducts(availableProducts);

                } catch (error) {
                    console.error('Error fetching products:', error);
                    setProducts([]);
                } finally {
                    setIsProductLoading(false);
                }
            } else {
                // Clear results when the search input is empty
                setProducts([]);
            }
        };

        fetchProductsByQuery();
    }, [debouncedSearchTerm, selectedItems, token]);

    /// handle product change
    const handleProductChange = (product: Product) => {
        if (!product) return; 

        let productDiscount = 0;
        let taxRate = 0;
        let productTax = 0;
        const sellingPrice = product.prices?.selling ?? 0;
        const discountType = product.discount?.type;
        const discountValue = product.discount?.value ?? 0;

        if (discountType === "Fixed") {
            productDiscount = discountValue;
        } else if (discountType === "Percentage") {
            productDiscount = (sellingPrice * discountValue) / 100;
        }

        taxRate = product.tax?.components.reduce((acc, component) => acc + component.rate, 0) ?? 0;
        productTax = (sellingPrice * taxRate) / 100;
        
        const newItem: productItem = {
            id: product.id,
            name: product.name,
            unit: product.unit?.name ?? '',
            qty: 1,
            rate: sellingPrice,
            discount: productDiscount,
            tax: productTax,
            amount: (sellingPrice * 1) - productDiscount + productTax,
        };

        setSelectedItems(prev => [...prev, newItem]);
        setPurchaseFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }))
    };

    // handle remove item
    const handleRemoveItem = (itemToRemove: productItem) => {
        setSelectedItems(prev => prev.filter(item => item.id !== itemToRemove.id));
    };

    // Function to fetch admin users
    const fetchAdminUsers = async () => {
        try {
            const response = await axios.get(`${Constants.FETCH_USERS_URL}/1`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.data.length > 0) {
                const formattedUsers = response.data.data.map((user: any) => ({ id: user.id, name: `${user.firstName} ${user.lastName}` }));
                setAdminUsers(formattedUsers);
            } else {
                setAdminUsers([]);
            }

        } catch (error) {
            console.error('Error fetching admin users:', error);
        }
    }
    // Function to fetch suppliers
    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${Constants.FETCH_USERS_URL}/2`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.data.length > 0) {
                const formattedSuppliers = response.data.data.map((supplier: any) => ({ id: supplier.id, name: `${supplier.firstName} ${supplier.lastName}` }));
                setSuppliers(formattedSuppliers);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    }

    return (
        <div className="p-4 md:p-6 bg-white dark:bg-gray-50 dark:bg-gray-900 min-h-screen shadow-md">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">New Purchase Order</h1>
                    <img src="https://kanakku-web-new.dreamstechnologies.com/e4f01b6957284e6a7fcd.svg" alt="" />
                </div>

                {/* Top Section: PO Details & Logo */}
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <div className="w-full">
                            <label htmlFor="po-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Order ID
                            </label>
                            <input
                                type="text"
                                id="po-id"
                                value="PO-00098"
                                readOnly
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="ref-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Reference No
                            </label>
                            <input
                                type="text"
                                id="ref-no"
                                placeholder="Enter Reference Number"
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                        </div>
                        <div className="w-full">
                            <DateInput
                                label="Order Date"
                                value={null}
                                onChange={() => { }}
                                minDate={new Date()}
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Status
                            </label>
                            <select
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            >
                                <option>Select</option>
                                <option value="new">New</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full">
                        <div className="flex flex-col w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            >
                                <option>Select</option>
                                <option value="new">New</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div> */}

                {/* Billing Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-white">Bill From <span className='text-red-500'>*</span></h3>

                        <div className="mt-4">
                            <SearchableDropdown
                                options={adminUsers}
                                placeholder="Select Admin"
                                value={selectedAdmin}
                                onChange={(e, value) => handleAdminChange(value as User)}
                            />

                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md font-semibold">
                                Select admin to view company details.
                            </p>

                            {selectedAdmin && companyDetails && (
                                <div className="mt-4 flex gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                                    <div className="w-15 h-15 flex items-center justify-center rounded bg-white dark:bg-gray-800 border border-gray-200">
                                        <img
                                            src={companyDetails.logoUrl || 'https://kanakku-web-new.dreamstechnologies.com/e4f01b6957284e6a7fcd.svg'}
                                            alt={companyDetails.companyName}
                                            className="w-12 h-12 object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white uppercase">
                                            {companyDetails.companyName}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{companyDetails.city}, {companyDetails.district}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {companyDetails.address}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white">Bill To <span className='text-red-500'>*</span></h3>
                            <button className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Add New
                            </button>
                        </div>
                        <div className="mt-4">
                            <SearchableDropdown
                                options={suppliers}
                                placeholder="Select Admin"
                                value={selectedSupplier}
                                onChange={(e, value) => handleSupplierChange(value as User)}
                            />

                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md font-semibold">
                                Select supplier to view vendor details
                            </p>

                            {selectedSupplier && supplierDetails && (
                                <div className="mt-4 flex gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                                    <div className="w-15 h-15 flex items-center justify-center rounded bg-white dark:bg-gray-800 border border-gray-200">
                                        <img
                                            src={supplierDetails.profileImage || 'https://kanakku-web-new.dreamstechnologies.com/e4f01b6957284e6a7fcd.svg'}
                                            alt={supplierDetails.firstName}
                                            className="w-12 h-12 object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white uppercase">
                                            {supplierDetails.firstName + ' ' + supplierDetails.lastName}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300"><span className='font-semibold'>Email :</span> {supplierDetails.email}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400"><span className='font-semibold'>Phone :</span> {supplierDetails.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items & Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 md:w-1/3 flex flex-col lg:w-1/3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products/Services</label>
                        <SearchableDropdown
                            options={products}
                            placeholder="Select Product"
                            value={null}
                            inputValue={productSearchInput}
                            onInputChange={(e, value) => setProductSearchInput(value)}
                            onChange={(e, value) =>{
                                handleProductChange(value as Product);
                                setProductSearchInput('');
                            } }
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead className="bg-gray-900 text-white">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold rounded-tl-md">Product / Service</th>
                                    <th className="p-3 text-left text-sm font-semibold">Unit</th>
                                    <th className="p-3 text-left text-sm font-semibold">Quantity</th>
                                    <th className="p-3 text-left text-sm font-semibold">Rate</th>
                                    <th className="p-3 text-left text-sm font-semibold">Discount</th>
                                    <th className="p-3 text-left text-sm font-semibold">Tax</th>
                                    <th className="p-3 text-left text-sm font-semibold">Amount</th>
                                    <th className="p-3 text-left text-sm font-semibold rounded-tr-md">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PurchaseFormData.items && PurchaseFormData.items.map((item, index) => (
                                    <tr key={item.id} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-md">
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={1}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                                            />
                                        </td>
                                        <td className="p-3">₹{item.rate}</td>
                                        <td className="p-3">₹{item.discount}</td>
                                        <td className="p-3">₹{item.tax}</td>
                                        <td className="p-3">₹{item.amount}</td>
                                        <td className="p-3 flex gap-2 items-center justify-center md:justify-start md:gap-4">
                                            <button>
                                                <Edit size={16} className="text-gray-600 dark:text-white" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveItem(item)}
                                                className='cursor-pointer'
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {selectedItems.length === 0 &&
                                    <tr className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-md">
                                        <td className="p-3 font-medium text-center" colSpan={8}>
                                            No Items Selected
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>

                </div>
                <div className="p-0">
                    <button className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add New
                    </button>
                </div>
                {/* Bottom Section: Extra Info & Totals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <button className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md">Add Notes</button>
                            <button className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">Add Terms & Conditions</button>
                            <button className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">Save Details</button>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Notes</label>
                        <textarea rows={3} placeholder="Enter Notes" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-800 dark:border-gray-600 shadow-sm"></textarea>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Amount</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Tax</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Discount</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Round Off Total</span>
                            <span>₹0</span>
                        </div>
                        <hr className="border-gray-200 dark:border-gray-600" />
                        <div className="flex justify-between font-bold text-gray-800 dark:text-white">
                            <span>Total</span>
                            <span>₹0.00</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total in Words</p>

                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex items-center">
                                <input id="manual-sig" type="radio" name="signature" className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                                <label htmlFor="manual-sig" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Manual Signature</label>
                            </div>
                            <div className="flex items-center">
                                <input id="e-sig" type="radio" name="signature" className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                                <label htmlFor="e-sig" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">eSignature</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Signature Name <span className="text-red-500">*</span></label>
                            <select className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm">
                                <option>rgtgrtg</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Signature Image</p>
                            <div className="mt-2 h-16 w-32 bg-gray-100 dark:bg-gray-700 rounded-md">
                                {/* Signature image will go here */}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CreatePurchaseOrder;