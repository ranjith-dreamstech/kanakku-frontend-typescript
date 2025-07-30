import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Constants from '../../../constants/api';
import { toast } from 'react-toastify';
import { Upload, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';

// --- Type Definitions ---

// For dropdown data from API
interface ICategory {
    _id: string;
    category_name: string;
}

interface IBrand {
    _id: string;
    brand_name: string;
}

interface IUnit {
    _id: string;
    unit_name: string;
}

interface ITax {
    _id: string;
    tax_name: string;
}

// For the main product data object (used in props)
interface IProduct {
    _id: string;
    item_type: 'Product' | 'Service';
    name: string;
    code: string;
    category?: { _id: string };
    brand?: { _id: string };
    unit?: { _id: string };
    selling_price: number;
    purchase_price: number;
    discount_type: 'Fixed' | 'Percentage';
    discount_value: number;
    tax?: { _id: string };
    barcode: string;
    alert_quantity: number;
    description: string;
    product_image: string;
    gallery_images: string[];
}

// For the component's props
interface ProductFormProps {
    productData?: IProduct;
}

// For the form's state
interface IFormData {
    item_type: 'Product' | 'Service';
    name: string;
    code: string;
    category: string;
    brand: string;
    unit: string;
    selling_price: string | number;
    purchase_price: string | number;
    discount_type: 'Fixed' | 'Percentage';
    discount_value: number;
    tax: string;
    barcode: string;
    alert_quantity: string | number;
    description: string;
    images_to_remove?: string[];
}

// For form validation errors
type FormErrors = Partial<Record<keyof IFormData | 'product_image', string>>;


// --- Component ---

export default function ProductForm({ productData }: ProductFormProps) {
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const isEditMode = Boolean(productData);

    const [formData, setFormData] = useState<IFormData>({
        item_type: 'Product',
        name: '',
        code: '',
        category: '',
        brand: '',
        unit: '',
        selling_price: '',
        purchase_price: '',
        discount_type: 'Fixed',
        discount_value: 0,
        tax: '',
        barcode: '',
        alert_quantity: '',
        description: '',
    });

    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImagePreview, setProductImagePreview] = useState<string>('');
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    
    // Dynamic data states
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [brands, setBrands] = useState<IBrand[]>([]);
    const [units, setUnits] = useState<IUnit[]>([]);
    const [taxes, setTaxes] = useState<ITax[]>([]);

    // Fetch dynamic data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            const headers = { 'Authorization': `Bearer ${token}` };
            try {
                const [catRes, brandRes, unitRes, taxRes] = await Promise.all([
                    axios.get<ICategory[]>(Constants.FETCH_PRODUCT_CATEGORIES_URL, { headers }),
                    axios.get<IBrand[]>(Constants.FETCH_PRODUCT_BRANDS_URL, { headers }),
                    axios.get<IUnit[]>(Constants.FETCH_PRODUCT_UNITS_URL, { headers }),
                    axios.get<ITax[]>(Constants.FETCH_PRODUCT_TAXES_URL, { headers }),
                ]);
                setCategories(catRes.data);
                setBrands(brandRes.data);
                setUnits(unitRes.data);
                setTaxes(taxRes.data);
            } catch (error) {
                console.error("Failed to fetch form data:", error);
                toast.error("Failed to load required data for the form.");
            }
        };
        fetchData();
    }, [token]);

    // Populate form if in edit mode
    useEffect(() => {
        if (isEditMode && productData) {
            setFormData({
                item_type: productData.item_type || 'Product',
                name: productData.name || '',
                code: productData.code || '',
                category: productData.category?._id || '',
                brand: productData.brand?._id || '',
                unit: productData.unit?._id || '',
                selling_price: productData.selling_price || '',
                purchase_price: productData.purchase_price || '',
                discount_type: productData.discount_type || 'Fixed',
                discount_value: productData.discount_value || 0,
                tax: productData.tax?._id || '',
                barcode: productData.barcode || '',
                alert_quantity: productData.alert_quantity || '',
                description: productData.description || '',
                images_to_remove: [],
            });
            if (productData.product_image) {
                setProductImagePreview(Constants.BASE_URL + productData.product_image);
            }
            if (productData.gallery_images) {
                // Avoid mutating the prop directly. Create a new array.
                const fullImageUrls = productData.gallery_images.map(image => Constants.BASE_URL + image);
                setGalleryImagePreviews(fullImageUrls);
            }
        }
    }, [isEditMode, productData]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProductImage(file);
            setProductImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setGalleryImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setGalleryImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryImage = (indexToRemove: number) => {
        const imagePathToRemove = galleryImagePreviews[indexToRemove];

        // Note: This logic for removing a *newly added* file might be buggy.
        // `galleryImages` only contains new files, while `galleryImagePreviews` contains both old and new.
        // The `indexToRemove` might not correctly map to the `galleryImages` array if old images are present.
        setGalleryImages(prev => prev.filter((_, i) => i !== indexToRemove));
        
        setGalleryImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
        
        // Note: You are adding the full preview URL to `images_to_remove`.
        // For existing images, the backend might expect a relative path instead of the full URL.
        setFormData(prev => ({
            ...prev,
            images_to_remove: [...(prev.images_to_remove || []), imagePathToRemove]
        }));
    };
    
    const generateRandomCode = () => {
        const randomCode = `PROD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        setFormData(prev => ({ ...prev, code: randomCode }));
    };

    const generateRandomBarcode = () => {
        const randomBarcode = Math.random().toString().slice(2, 15);
        setFormData(prev => ({...prev, barcode: randomBarcode}));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormErrors({});

        const submissionData = new FormData();
        // Assert formData keys to avoid TypeScript errors with FormData.append
        Object.keys(formData).forEach(key => {
            const formKey = key as keyof IFormData;
            const value = formData[formKey];
            if (value !== undefined && value !== null) {
                submissionData.append(formKey, Array.isArray(value) ? JSON.stringify(value) : String(value));
            }
        });
        
        if (productImage) {
            submissionData.append('product_image', productImage);
        }
        
        galleryImages.forEach(file => {
            submissionData.append('gallery_images', file);
        });

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            if (isEditMode) {
                await axios.put(`${Constants.UPDATE_PRODUCT_URL}/${productData?._id}`, submissionData, config);
                toast.success("Product updated successfully!");
            } else {
                await axios.post(Constants.CREATE_PRODUCT_URL, submissionData, config);
                toast.success("Product created successfully!");
            }
            navigate('/admin/products');
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                setFormErrors(error.response.data.errors);
            } else {
                console.error("Submission failed:", error);
                toast.error(error.response?.data?.message || "An unexpected error occurred.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
            {/* --- Product Image --- */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
                <div className="mt-1 flex items-center space-x-6">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                        {productImagePreview ? (
                            <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <Upload className="text-gray-400 w-8 h-8" />
                        )}
                    </div>
                    <div>
                        <label className="cursor-pointer bg-purple-600 text-white px-4 py-2 text-sm rounded-md hover:bg-purple-700">
                            <span>Upload Image</span>
                            <input type="file" className="hidden" onChange={handleProductImageChange} accept="image/png, image/jpeg, image/webp" />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">JPG, PNG or WEBP format, not exceeding 5MB.</p>
                    </div>
                </div>
                {formErrors.product_image && <p className="text-red-500 text-xs mt-1">{formErrors.product_image}</p>}
            </div>

            {/* --- Item Type --- */}
            <div>
                 <label className="block text-sm font-medium text-gray-700">Item Type *</label>
                 <div className="mt-2 flex items-center space-x-6">
                   <label className="flex items-center">
                       <input type="radio" name="item_type" value="Product" checked={formData.item_type === 'Product'} onChange={handleInputChange} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                       <span className="ml-2 text-sm text-gray-700">Product</span>
                   </label>
                   <label className="flex items-center">
                       <input type="radio" name="item_type" value="Service" checked={formData.item_type === 'Service'} onChange={handleInputChange} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                       <span className="ml-2 text-sm text-gray-700">Service</span>
                   </label>
                 </div>
                 {formErrors.item_type && <p className="text-red-500 text-xs mt-1">{formErrors.item_type}</p>}
            </div>


            {/* --- Form Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block text-gray-700 p-2 w-full border border-gray-300 rounded-md shadow-sm" />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                
                {/* Code */}
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code *</label>
                    <div className="mt-1 flex">
                        <input type="text" name="code" id="code" value={formData.code} onChange={handleInputChange} className="flex-grow block text-gray-700 p-2 w-full border border-gray-300 rounded-l-md shadow-sm" />
                        <button type="button" onClick={generateRandomCode} className="px-3 py-2 bg-gray-200 text-gray-700 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 text-sm">Generate</button>
                    </div>
                    {formErrors.code && <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>}
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
                    <select name="category" id="category" value={formData.category} onChange={handleInputChange} className="mt-1 block text-gray-700 p-2 w-full border border-gray-300 rounded-md shadow-sm">
                        <option value="">Select Category</option>
                        {categories.map(cat => <option className='text-gray-700' key={cat._id} value={cat._id}>{cat.category_name}</option>)}
                    </select>
                    {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                </div>
                
                {/* Brand */}
                <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand *</label>
                    <select name="brand" id="brand" value={formData.brand} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm">
                        <option value="">Select Brand</option>
                        {brands.map(b => <option className='text-gray-700' key={b._id} value={b._id}>{b.brand_name}</option>)}
                    </select>
                    {formErrors.brand && <p className="text-red-500 text-xs mt-1">{formErrors.brand}</p>}
                </div>

                {/* Selling Price */}
                <div>
                    <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">Selling Price *</label>
                    <input type="number" name="selling_price" id="selling_price" value={formData.selling_price} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm" />
                    {formErrors.selling_price && <p className="text-red-500 text-xs mt-1">{formErrors.selling_price}</p>}
                </div>
                
                {/* Purchase Price */}
                <div>
                    <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">Purchase Price *</label>
                    <input type="number" name="purchase_price" id="purchase_price" value={formData.purchase_price} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm" />
                    {formErrors.purchase_price && <p className="text-red-500 text-xs mt-1">{formErrors.purchase_price}</p>}
                </div>
                
                {/* Units */}
                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Units *</label>
                    <select name="unit" id="unit" value={formData.unit} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm">
                         <option value="">Select Item Unit</option>
                         {units.map(u => <option className='text-gray-700' key={u._id} value={u._id}>{u.unit_name}</option>)}
                    </select>
                    {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
                </div>
                
                {/* Discount Type */}
                <div>
                    <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">Discount Type *</label>
                    <select name="discount_type" id="discount_type" value={formData.discount_type} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm">
                        <option value="Fixed">Fixed</option>
                        <option value="Percentage">Percentage</option>
                    </select>
                    {formErrors.discount_type && <p className="text-red-500 text-xs mt-1">{formErrors.discount_type}</p>}
                </div>
                
                {/* Discount Value */}
                 <div>
                    <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">Discount Value *</label>
                    <input type="number" name="discount_value" id="discount_value" value={formData.discount_value} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm" />
                    {formErrors.discount_value && <p className="text-red-500 text-xs mt-1">{formErrors.discount_value}</p>}
                </div>
                
                {/* Barcode */}
                <div>
                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode *</label>
                     <div className="mt-1 flex">
                        <input type="text" name="barcode" id="barcode" value={formData.barcode} onChange={handleInputChange} className="flex-grow block text-gray-700 p-2 w-full border border-gray-300 rounded-l-md shadow-sm" />
                        <button type="button" onClick={generateRandomBarcode} className="px-3 py-2 bg-gray-200 text-gray-700 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 text-sm">Generate</button>
                    </div>
                    {formErrors.barcode && <p className="text-red-500 text-xs mt-1">{formErrors.barcode}</p>}
                </div>
                
                {/* Alert Quantity */}
                <div>
                    <label htmlFor="alert_quantity" className="block text-sm font-medium text-gray-700">Alert Quantity *</label>
                    <input type="number" name="alert_quantity" id="alert_quantity" value={formData.alert_quantity} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm" />
                    {formErrors.alert_quantity && <p className="text-red-500 text-xs mt-1">{formErrors.alert_quantity}</p>}
                </div>

                {/* Tax */}
                <div>
                    <label htmlFor="tax" className="block text-sm font-medium text-gray-700">Tax *</label>
                    <select name="tax" id="tax" value={formData.tax} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm">
                        <option value="">Select Item's Tax</option>
                         {taxes.map(t => <option className='text-gray-700' key={t._id} value={t._id}>{t.tax_name}</option>)}
                    </select>
                    {formErrors.tax && <p className="text-red-500 text-xs mt-1">{formErrors.tax}</p>}
                </div>

            </div>

            {/* --- Description --- */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Product Description *</label>
                <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleInputChange} className="mt-1 text-gray-700 p-2 block w-full border border-gray-300 rounded-md shadow-sm"></textarea>
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>

            {/* --- Gallery Images --- */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                <div className="mt-1 flex items-center space-x-4">
                    <label className="cursor-pointer bg-gray-50 text-gray-500 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-100">
                        <Upload />
                        <span>Drop your files or Browse</span>
                         <p className="text-xs text-gray-400 mt-1">Max Upload Size 5MB</p>
                        <input type="file" className="hidden" onChange={handleGalleryImagesChange} accept="image/png, image/jpeg, image/webp" multiple />
                    </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                    {galleryImagePreviews.map((preview, index) => (
                        <div key={index} className="relative w-24 h-24">
                            <img src={preview} alt="Gallery preview" className="w-full h-full object-cover rounded-md" />
                            <button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
                <button type="button" onClick={() => navigate('/products')} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">{isEditMode ? 'Update Product' : 'Save Product'}</button>
            </div>
        </form>
    );
}