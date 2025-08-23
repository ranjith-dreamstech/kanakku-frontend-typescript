import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PlusCircle, Edit, Trash2, Edit3 } from 'lucide-react';
import DateInput from '@components/admin/DateInput';
import axios from 'axios';
import Constants from '@constants/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@store/index';
import SearchableDropdown from '@components/admin/SearchableDropdown';
import { useDebounce } from '@hooks/useDebounce';
import Modal from '@components/admin/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { numberToWords } from '@utils/converters';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import CreateSupplierForm from './CreateSupplierForm';

// --- INTERFACES ---

interface User {
    id: string;
    name: string;
}

interface PurchaseFormData {
    _id: string;
    purchaseOrderId: string;
    userId: string;
    billFrom: string;
    billTo: string;
    referenceNo: string;
    orderDate: Date | null;
    status: string;
    items: productItem[];
    notes: string;
    termsAndCondition: string;
    bank: string | null;
    sign_type: 'digitalSignature' | 'eSignature';
    signatureId: string | null;
    signatureName: string;
    esignDataUrl: string | null;
    subTotal: number | null;
    totalTax: number | null;
    totalDiscount: number | null;
    grandTotal: number | null;
}

interface selectedAdmin {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    city?: { id: string; name: string; };
    state?: { id: string; name: string; };
    country?: { id: string; name: string; };
    pincode: string;
    siteLogo: File | null;
    logoUrl?: string;
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
    unit: { id: string; name: string; } | null;
    prices: { selling: number; purchase: number; };
    discount: { type: 'Fixed' | 'Percentage'; value: number; } | null;
    tax: { group_id: string; group_name: string; total_rate: number; } | null;
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
    tax_group_id?: string;
    discount_type?: 'Fixed' | 'Percentage';
    discount_value?: number;
}

interface taxGroup {
    _id: string;
    tax_name: string;
    total_tax_rate: number;
    tax_rates: {
        _id: string;
        tax_name: string;
        tax_rate: number;
    }[];
}

interface IManualSignature {
    id: string;
    name: string;
    imageUrl: string;
}

interface IBankAccount {
    id: string;
    name: string;
}

const EditPurchaseOrder: React.FC = () => {
    const navigate = useNavigate();
    const purchaseOrderId = useParams().id || '';
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [adminUsers, setAdminUsers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearchInput, setProductSearchInput] = useState<string>('');
    const [isProductLoading, setIsProductLoading] = useState<boolean>(false);
    const debouncedSearchTerm = useDebounce(productSearchInput, 500);
    const [supplierSearchInput, setSupplierSearchInput] = useState<string>('');
    const debouncedSupplierSearchTerm = useDebounce(supplierSearchInput, 500);

    const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<User | null>(null);
    const [companyDetails, setCompanyDetails] = useState<selectedAdmin | null>(null);
    const [supplierDetails, setSupplierDetails] = useState<selectedSupplier | null>(null);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [purchaseFormData, setPurchaseFormData] = useState<PurchaseFormData>({
        _id: '',
        userId: user?.id || '',
        purchaseOrderId: '',
        billFrom: '',
        billTo: '',
        referenceNo: '',
        orderDate: null,
        status: '',
        items: [],
        notes: '',
        termsAndCondition: '',
        bank: null,
        sign_type: 'digitalSignature',
        signatureId: null,
        signatureName: '',
        esignDataUrl: null,
        subTotal: null,
        totalTax: null,
        totalDiscount: null,
        grandTotal: null
    });

    // Edit Modal State
    const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<productItem | null>(null);
    const [taxes, setTaxes] = useState<taxGroup[]>([]);

    // Extra Information State
    const [activeInfoTab, setActiveInfoTab] = useState<'notes' | 'termsAndCondition' | 'bank'>('notes');
    const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
    const [manualSignatures, setManualSignatures] = useState<IManualSignature[]>([]);
    const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const sigPadRef = useRef<SignatureCanvas>(null);

    useEffect(() => {
        fetchAdminUsers();
        // fetchSuppliers();
        fetchTaxes();
        fetchBankAccounts();
        fetchManualSignatures();
        if(purchaseOrderId){
            fetchPurchaseOrder();
        }
    }, []);

    const fetchPurchaseOrder = async () => {
        setIsLoading(true);

        try {
            const response = await axios.get(`${Constants.FETCH_PURCHASE_ORDER_URL}/${purchaseOrderId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = response.data.data;

            if (data) {
                if (data.billTo) {
                    let _supplier = {id: data.billTo.id, name: data.billTo.name};
                    handleSupplierChange(_supplier);
                }

                if (data.billFrom) {
                    let _admin = {id: data.billFrom.id, name: data.billFrom.name};
                    handleAdminChange(_admin);
                }

                if (data.bank) {
                    setBankAccounts((prev) => {
                        const exists = prev.find(bank => bank.id === data.bank.id);
                        if (exists) return prev;
                        return [...prev, { id: data.bank.id, name: data.bank.bankName }];
                    });
                }

                setPurchaseFormData(prev => ({
                    ...prev,
                    _id: data.id,
                    purchaseOrderId: data.purchaseOrderId || '',
                    userId: user?.id || '',
                    billFrom: data.billFrom?.id || '',
                    billTo: data.billTo?.id || '',
                    referenceNo: data.referenceNo || '',
                    orderDate: data.purchaseOrderDate ? new Date(data.purchaseOrderDate) : null,
                    status: data.status || '',
                    items: data.items || [],
                    notes: data.notes || '',
                    termsAndCondition: data.termsAndCondition || '',
                    bank: data.bank?.id || null,
                    sign_type: data.sign_type || 'digitalSignature',
                    signatureId: data.signature?.id || null,
                    signatureName: data.signature?.name || '',
                    esignDataUrl: data.signature?.image || null
                }));
            }
        } catch (error) {
            console.error('Error fetching purchase order:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTaxes = async () => {
        if (!token) return;
        try {
            const response = await axios.get(Constants.FETCH_TAX_GROUPS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setTaxes(response.data.data);
        } catch (error) {
            console.error('Error fetching taxes:', error);
            setTaxes([]);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            const response = await axios.get(Constants.FETCH_BANK_ACCOUNTS_WITH_SEARCH_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.data.length > 0) {
                const formattedBankAccounts = response.data.data.map((item: any) => {
                    return {
                        id: item.id,
                        name: item.bankName
                    }
                });

                setBankAccounts(formattedBankAccounts);
            } else {
                setBankAccounts([]);
            }
        } catch (error) {
            console.error("Error fetching bank accounts:", error);
        }
    }

    const fetchManualSignatures = async () => {
        try {
            const response = await axios.get(Constants.FETCH_SIGNATURES_WITH_SEARCH_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.data.length > 0) {
                const formattedSignatures = response.data.data.map((item: any) => {
                    return {
                        id: item.id,
                        name: item.signatureName,
                        imageUrl: item.signatureImage
                    }
                });

                setManualSignatures(formattedSignatures);
            } else {
                setManualSignatures([]);
            }
        } catch (error) {
            console.error("Error fetching manual signatures:", error);
        }
    }
    const handleAdminChange = async (user: User) => {
        setSelectedAdmin(user);
        try {
            const response = await axios.get(`${Constants.FETCH_COMPANY_SETTINGS_URL}/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            //set billFrom to prev formData
            setPurchaseFormData(prev => ({ ...prev, billFrom: user.id }));
            setCompanyDetails(response.data.data);
        } catch (error) {
            setCompanyDetails(null);
        }
    };

    const handleSupplierChange = async (user: User) => {
        setSelectedSupplier(user);
        try {
            const response = await axios.get(`${Constants.FETCH_USER_BY_ID_URL}/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            //set billTo to prev formData
            setPurchaseFormData(prev => ({ ...prev, billTo: user.id }));
            setSupplierDetails(response.data.data);
        } catch (error) {
            setSupplierDetails(null);
        }
    };

    useEffect(() => {
        const fetchProductsByQuery = async () => {
            if (debouncedSearchTerm) {
                setIsProductLoading(true);
                try {
                    const response = await axios.get(`${Constants.FETCH_PRODUCTS_WITH_SEARCH_URL}?search=${debouncedSearchTerm}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const availableProducts = response.data.data.filter(
                        (product: Product) => purchaseFormData.items.every((item: productItem) => item.id !== product.id)
                    );
                    setProducts(availableProducts);
                } catch (error) {
                    console.error('Error fetching products:', error);
                    setProducts([]);
                } finally {
                    setIsProductLoading(false);
                }
            } else {
                setProducts([]);
            }
        };
        fetchProductsByQuery();
    }, [debouncedSearchTerm, token]);

    // --- ITEM & FORM HANDLERS ---
    const handleFormChange = (field: keyof PurchaseFormData, value: any) => {
        setPurchaseFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProductChange = (product: Product) => {
        if (!product) return;
        let productDiscount = 0;
        const sellingPrice = product.prices?.selling ?? 0;
        const discountType = product.discount?.type;
        const discountValue = product.discount?.value ?? 0;

        if (discountType === "Fixed") productDiscount = discountValue;
        else if (discountType === "Percentage") productDiscount = (sellingPrice * discountValue) / 100;

        const taxRate = product.tax?.total_rate ?? 0;
        const productTax = (sellingPrice * taxRate) / 100;

        const newItem: productItem = {
            id: product.id,
            name: product.name,
            unit: product.unit?.name ?? '',
            qty: 1,
            rate: sellingPrice,
            discount: productDiscount,
            tax: productTax,
            tax_group_id: product.tax?.group_id,
            discount_type: discountType,
            discount_value: discountValue,
            amount: (sellingPrice * 1) - productDiscount + productTax,
        };
        handleFormChange('items', [...purchaseFormData.items, newItem]);
    };

    const handleRemoveItem = (itemToRemove: productItem) => {
        handleFormChange('items', purchaseFormData.items.filter(item => item.id !== itemToRemove.id));
    };

    const handleEditItem = (itemToEdit: productItem) => {
        setEditingItem({ ...itemToEdit });
        setIsEditProductModalOpen(true);
    };

    const handleEditingItemChange = (field: keyof productItem, value: string | number) => {
        setEditingItem(prev => {
            if (!prev) return null;

            const fieldsToNumber = ['qty', 'rate', 'discount_value'];

            const newValue = fieldsToNumber.includes(field as string)
                ? Number(value) || 0
                : value;

            const updatedItem = { ...prev, [field]: newValue };

            const { qty, rate, discount_value, discount_type, tax_group_id } = updatedItem;

            const subtotal = qty * rate;

            const discountAmount = discount_type === 'Percentage'
                ? (subtotal * (discount_value || 0)) / 100
                : (discount_value || 0);

            const discountedSubtotal = subtotal - discountAmount;

            const selectedTaxGroup = taxes.find(t => String(t._id) === String(tax_group_id));
            const taxRate = selectedTaxGroup?.total_tax_rate || 0;
            const taxPerUnit = (rate * taxRate) / 100;

            const totalTax = taxPerUnit * qty;

            const newAmount = discountedSubtotal + totalTax;

            return {
                ...updatedItem,
                discount: discountAmount,
                tax: totalTax,
                amount: newAmount
            };
        });
    };



    const handleUpdateItem = () => {
        if (!editingItem) return;
        const updatedItems = purchaseFormData.items.map(item =>
            item.id === editingItem.id ? editingItem : item
        );
        handleFormChange('items', updatedItems);
        setIsEditProductModalOpen(false);
        setEditingItem(null);
    };

    // --- SIGNATURE HANDLERS ---
    const clearSignature = () => sigPadRef.current?.clear();
    const saveSignature = () => {
        if (sigPadRef.current) {
            const dataUrl = sigPadRef.current.getCanvas().toDataURL('image/png');
            handleFormChange('esignDataUrl', dataUrl);
            setSignatureModalOpen(false);
        }
    };

    // --- DYNAMIC CALCULATIONS ---
    const { subTotal, totalTax, totalDiscount, grandTotal } = useMemo(() => {
        const totals = purchaseFormData.items.reduce((acc, item) => {
            acc.subTotal += item.rate * item.qty;
            acc.totalDiscount += item.discount;
            acc.totalTax += item.tax;
            return acc;
        }, { subTotal: 0, totalTax: 0, totalDiscount: 0 });
        let grand_total = totals.subTotal - totals.totalDiscount + totals.totalTax;
        setPurchaseFormData(prev => ({ ...prev, subTotal: totals.subTotal, totalTax: totals.totalTax, totalDiscount: totals.totalDiscount, grandTotal: grand_total }));
        return { ...totals, grandTotal: grand_total };
    }, [purchaseFormData.items]);

    const totalInWords = useMemo(() => {
        if (grandTotal <= 0) return 'Zero';
        return numberToWords(grandTotal);
    }, [grandTotal]);

    const selectedManualSignatureImage = useMemo(() => {
        return manualSignatures.find(sig => sig.id === purchaseFormData.signatureId)?.imageUrl || null;
    }, [purchaseFormData.signatureId, manualSignatures]);


    const fetchAdminUsers = async () => {
        try {
            const response = await axios.get(`${Constants.FETCH_USERS_URL}/1`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
    };
    
    useEffect(() => {
        const fetchSuppliersByQuery = async () => {
            try {
                const response = await axios.get(`${Constants.FETCH_USERS_URL}/2`, {
                    params: { search: debouncedSupplierSearchTerm, limit: 100, page: 1 },
                    headers: { 'Authorization': `Bearer ${token}` }
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
        fetchSuppliersByQuery();
    }, [debouncedSupplierSearchTerm, token]);
    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${Constants.FETCH_USERS_URL}/2`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
    };

    const validatePurchaseOrderData = () => {
        // Add your validation logic here
        const newErrors: { [key: string]: string } = {};
        //reference number required
        if (!purchaseFormData.referenceNo.trim()) newErrors.referenceNo = 'Reference number is required.';
        //order date required
        if (!purchaseFormData.orderDate) newErrors.orderDate = 'Order date is required.';
        //status required
        if (!purchaseFormData.status.trim()) newErrors.status = 'Status is required.';
        //billFrom required
        if (!purchaseFormData.billFrom.trim()) newErrors.billFrom = 'Bill from is required.';
        //billTo required
        if (!purchaseFormData.billTo.trim()) newErrors.billTo = 'Bill to is required.';
        //atleast 1 item required
        if (purchaseFormData.items.length === 0) newErrors.items = 'At least one item is required.';
        //sign_type if manual then signatureId required
        if (purchaseFormData.sign_type === 'digitalSignature' && !purchaseFormData.signatureId) newErrors.signatureId = 'Manual signature is required.';
        //sign_type if esignature then signatureName required
        if (purchaseFormData.sign_type === 'eSignature' && !purchaseFormData.signatureName.trim()) newErrors.signatureName = 'Esignature name is required.';
        if(purchaseFormData.sign_type === 'eSignature' && !purchaseFormData.esignDataUrl) newErrors.esignDataUrl = 'Esignature is required.';
        setFormErrors(newErrors);
        return newErrors;
    }
    const savePurchaseOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validatePurchaseOrderData();

        if (Object.keys(errors).length > 0) {
            const firstErrorField = Object.keys(errors)[0];
            const firstErrorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement | null;
            firstErrorElement?.focus();
            return;
        }

        const formData = new FormData();

        Object.entries(purchaseFormData).forEach(([key, value]) => {
            if (key === 'esignDataUrl' && purchaseFormData.sign_type === 'eSignature') {
                const file = dataURLtoFile(value, 'signature.png');
                formData.append('signatureImage', file);

            } else if (value instanceof Date) {
                const year = value.getFullYear();
                const month = String(value.getMonth() + 1).padStart(2, "0");
                const day = String(value.getDate()).padStart(2, "0");

                formData.append(key, `${year}-${month}-${day}`);

            } else if (Array.isArray(value) && key === 'items') {
                value.forEach((item, index) => {
                    Object.entries(item).forEach(([itemKey, itemValue]) => {
                        if (itemValue !== undefined && itemValue !== null) {
                            formData.append(`items[${index}][${itemKey}]`, String(itemValue));
                        }
                    });
                });

            } else if (typeof value !== 'object' && value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        try {
            await axios.put(`${Constants.UPDATE_PURCHASE_ORDER_URL}/${purchaseFormData._id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Purchase order updated successfully.');
            navigate('/admin/purchase-orders');
        } catch (error: any) {
            if (error.response?.status !== 200 && error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                toast.error('An unexpected error occurred.');
            }
        }
    };


    const dataURLtoFile = (dataUrl: string, filename: string): File => {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    };
    
    if(isLoading) return <div>Loading...</div>;
    return (
        <div className="p-4 md:p-6 bg-white-50 dark:bg-gray-50 dark:bg-gray-900 min-h-screen border border-gray-200 dark:border-gray-700 rounded">
            <form onSubmit={savePurchaseOrder}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase Order Details</h1>
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
                                value={purchaseFormData.purchaseOrderId}
                                readOnly
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="ref-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Reference No <em className='text-red-500'>*</em>
                            </label>
                            <input
                                type="text"
                                id="ref-no"
                                placeholder="Enter Reference Number"
                                value={purchaseFormData.referenceNo}
                                name='referenceNo'
                                onChange={(e) => handleFormChange('referenceNo', e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                            {formErrors?.referenceNo && <span className="text-red-500 text-sm">{formErrors.referenceNo}</span>}
                        </div>
                        <div className="w-full">
                            <DateInput
                                label="Order Date"
                                value={purchaseFormData.orderDate}
                                onChange={(newDate) => handleFormChange('orderDate', newDate)}
                                minDate={new Date()}
                                isRequired
                            />
                            {formErrors?.orderDate && <span className="text-red-500 text-sm">{formErrors.orderDate}</span>}
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Status <em className='text-red-500'>*</em>
                            </label>
                            <select
                                name="status"
                                onChange={(e) => handleFormChange('status', e.target.value)}
                                value={purchaseFormData.status}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            >
                                <option>Select</option>
                                <option value="new">New</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {formErrors?.status && <span className="text-red-500 text-sm">{formErrors.status}</span>}
                        </div>
                    </div>
                </div>

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
                            {formErrors?.billFrom && <span className="text-red-500 text-sm">{formErrors.billFrom}</span>}
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
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{companyDetails.city?.name ?? ""}, {companyDetails.state?.name ?? ""}</p>
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
                            <button
                                type='button'
                                onClick={() => setIsSupplierModalOpen(true)}
                                className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold cursor-pointer">
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Add New
                            </button>
                        </div>
                        <div className="mt-4">
                            <SearchableDropdown
                                options={suppliers}
                                placeholder="Select Supplier"
                                value={selectedSupplier}
                                inputValue={supplierSearchInput}
                                onInputChange={(e, value) => setSupplierSearchInput(value)}
                                onChange={(e, value) => {handleSupplierChange(value as User); setSupplierSearchInput('')}}
                            />
                            {formErrors?.billTo && <span className="text-red-500 text-sm">{formErrors.billTo}</span>}
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
                            placeholder="Search and Select Product"
                            value={null}
                            inputValue={productSearchInput}
                            onInputChange={(e, value) => setProductSearchInput(value)}
                            onChange={(e, value) => {
                                if (value) handleProductChange(value as Product);
                                setProductSearchInput('');
                            }}
                        />
                    </div>
                    <div className="p-4 overflow-x-auto">
                        {formErrors?.items && <span className="text-red-500 text-sm">{formErrors.items}</span>}
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
                                {purchaseFormData.items.map((item) => (
                                    <tr key={item.id} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3">{item.unit}</td>
                                        <td className="p-3">{item.qty}</td>
                                        <td className="p-3">₹{item.rate.toFixed(2)}</td>
                                        <td className="p-3">₹{item.discount.toFixed(2)}</td>
                                        <td className="p-3">₹{item.tax.toFixed(2)}</td>
                                        <td className="p-3">₹{item.amount.toFixed(2)}</td>
                                        <td className="p-3 flex gap-2 items-center justify-center md:justify-start md:gap-4">
                                            <button type='button' onClick={() => handleEditItem(item)} aria-label="Edit item" className='cursor-pointer'>
                                                <Edit size={16} className="text-gray-600 dark:text-white" />
                                            </button>
                                            <button type='button' onClick={() => handleRemoveItem(item)} className='cursor-pointer' aria-label="Remove item">
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {purchaseFormData.items.length === 0 && (
                                    <tr className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                        <td className="p-3 font-medium text-center" colSpan={8}>
                                            No Items Selected
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {/* Add New Product */}
                        <div className="p-4 flex">
                            <button className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Add New
                            </button>
                        </div>
                    </div>
                </div>


                {/* Other sections can go here */}

            </div>

            {/* Edit Product Modal */}
            <Modal isOpen={isEditProductModalOpen} onClose={() => setIsEditProductModalOpen(false)} title={`Edit: ${editingItem?.name}`}>
                {editingItem && (
                    <div className="p-4 space-y-4">
                        <div>
                            <label htmlFor="edit-qty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                            <input
                                type="number"
                                id="edit-qty"
                                min="1"
                                step="1"
                                value={editingItem.qty}
                                onChange={(e) => handleEditingItemChange('qty', e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rate (₹)</label>
                            <input
                                type="number"
                                id="edit-rate"
                                min="0"
                                value={editingItem.rate}
                                onChange={(e) => handleEditingItemChange('rate', e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                        </div>
                        {/* Discount Type */}
                        <div>
                            <label htmlFor="edit-discount-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</label>
                            <select
                                id="edit-discount-type"
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                                value={editingItem.discount_type}
                                onChange={(e) => handleEditingItemChange('discount_type', e.target.value)}
                            >
                                <option value="Percentage">Percentage</option>
                                <option value="Fixed">Fixed</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Amount (₹)</label>
                            <input
                                type="number"
                                id="edit-discount"
                                min="0"
                                value={editingItem.discount_value}
                                onChange={(e) => handleEditingItemChange('discount_value', e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-tax-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apply Tax Group</label>
                            <select
                                id="edit-tax-select"
                                data-tax-group={editingItem.tax_group_id}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                                value={editingItem.tax_group_id || ''}
                                onChange={(e) => {
                                    const selectedTaxGroup = taxes.find(t => t._id === e.target.value);
                                    if (selectedTaxGroup) {
                                        const newTaxAmount = (editingItem.rate * selectedTaxGroup.total_tax_rate) / 100;
                                        handleEditingItemChange('tax', newTaxAmount);
                                        handleEditingItemChange('tax_group_id', String(selectedTaxGroup._id));
                                    } else {
                                        handleEditingItemChange('tax', 0);
                                        handleEditingItemChange('tax_group_id', '');
                                    }
                                }}
                            >
                                <option value="">None</option>
                                {taxes.map(taxGroup => (
                                    <option key={taxGroup._id} value={taxGroup._id}>
                                        {taxGroup.tax_name} ({taxGroup.total_tax_rate}%)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-2">
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                New Amount: ₹{editingItem.amount.toFixed(2)}
                            </p>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsEditProductModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateItem}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                            >
                                Update Item
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* Left Side: Tabs */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Extra Information</h3>
                    <div className="flex items-center gap-2 mb-4">
                        <button type='button' onClick={() => setActiveInfoTab('notes')} className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-md ${activeInfoTab === 'notes' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Add Notes</button>
                        <button type='button' onClick={() => setActiveInfoTab('termsAndCondition')} className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-md ${activeInfoTab === 'termsAndCondition' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Add Terms & Conditions</button>
                        <button type='button' onClick={() => setActiveInfoTab('bank')} className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-md ${activeInfoTab === 'bank' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Bank Details</button>
                    </div>

                    {activeInfoTab === 'notes' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Notes</label>
                            <textarea value={purchaseFormData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} rows={4} placeholder="Enter Notes" className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"></textarea>
                        </div>
                    )}
                    {activeInfoTab === 'termsAndCondition' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions</label>
                            <textarea value={purchaseFormData.termsAndCondition} onChange={(e) => handleFormChange('termsAndCondition', e.target.value)} rows={4} placeholder="Enter Terms & Conditions" className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"></textarea>
                        </div>
                    )}
                    {activeInfoTab === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account</label>
                            <SearchableDropdown
                                options={bankAccounts}
                                placeholder="Select Bank Account"
                                value={bankAccounts.find(b => b.id === purchaseFormData.bank) || null}
                                onChange={(e, value) => handleFormChange('bank', (value as IBankAccount)?.id || null)}
                            />
                        </div>
                    )}
                </div>

                {/* Right Side: Totals & Signature */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>Amount</span><span>₹{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>Discount</span><span>- ₹{totalDiscount.toFixed(2)}</span></div>
                    <hr className="border-gray-200 dark:border-gray-600" />
                    <div className="flex justify-between font-bold text-gray-800 dark:text-white"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{totalInWords}</p>

                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center"><input id="manual-sig" type="radio" name="signature" checked={purchaseFormData.sign_type === 'digitalSignature'} onChange={() => {handleFormChange('sign_type', 'digitalSignature'),handleFormChange('esignDataUrl', null)}} className="h-4 w-4 text-purple-600 cursor-pointer" /><label htmlFor="manual-sig" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Manual Signature</label></div>
                        <div className="flex items-center"><input id="e-sig" type="radio" name="signature" checked={purchaseFormData.sign_type === 'eSignature'} onChange={() => {handleFormChange('sign_type', 'eSignature'),handleFormChange('esignDataUrl', null)}} className="h-4 w-4 text-purple-600 cursor-pointer" /><label htmlFor="e-sig" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">eSignature</label></div>
                    </div>

                    {purchaseFormData.sign_type === 'digitalSignature' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Signature Name <span className="text-red-500">*</span></label>
                            <select value={purchaseFormData.signatureId || ''} onChange={(e) => handleFormChange('signatureId', e.target.value)} name='signatureId' className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600">
                                <option value="" disabled>Select a signature</option>
                                {manualSignatures.map(sig => <option key={sig.id} value={sig.id}>{sig.name}</option>)}
                            </select>
                            {formErrors?.signatureId && <p className="text-red-500 text-xs mt-1">{formErrors.signatureId}</p>}
                            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Signature Image</p>
                            <div className="mt-2 h-20 w-48 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                {selectedManualSignatureImage ? <img src={selectedManualSignatureImage} alt="Selected Signature" className="max-h-full max-w-full" /> : <span className="text-xs text-gray-400">No signature selected</span>}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Signature Name <span className="text-red-500">*</span></label>
                            <input name='signatureName' type="text" value={purchaseFormData.signatureName} onChange={e => handleFormChange('signatureName', e.target.value)} placeholder="Enter Signature Name" className="border border-gray-300 rounded-md px-4 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                            {formErrors?.signatureName && <p className="text-red-500 text-xs mt-1">{formErrors.signatureName}</p>}
                            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Draw your eSignature</p>
                            <div className="mt-2 h-20 w-48 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-400" onClick={() => setSignatureModalOpen(true)}>
                                {purchaseFormData.esignDataUrl ? <img src={purchaseFormData.esignDataUrl} alt="Drawn Signature" className="max-h-full max-w-full" /> : <div className="text-center text-gray-500"><Edit3 size={20} className="mx-auto mb-1" /><span className="text-xs">Draw Signature</span></div>}
                            </div>
                            {formErrors?.esignDataUrl && <p className="text-red-500 text-xs mt-1">{formErrors.esignDataUrl}</p>}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <button type='button' className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 cursor-pointer">Cancel</button>
                <button type='submit' className="ml-4 px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 cursor-pointer">Save</button>
            </div>
            
            <Modal isOpen={isSignatureModalOpen} onClose={() => setSignatureModalOpen(false)} title="Draw Signature">
                <div className="p-4">
                    <div className="bg-white border border-gray-400">
                        <SignatureCanvas
                            ref={sigPadRef}
                            penColor='black'
                            canvasProps={{ className: 'w-full h-48' }}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type='button' onClick={clearSignature} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer">Clear</button>
                        <button type='button' onClick={() => setSignatureModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 cursor-pointer">Cancel</button>
                        <button type='button' onClick={saveSignature} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 cursor-pointer">Save</button>
                    </div>
                </div>
            </Modal>
            </form>
            {/* Create Supplier Form */}
            <CreateSupplierForm
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onSuccess={() => setIsSupplierModalOpen(false)}
            />
        </div>
    );
};

export default EditPurchaseOrder;