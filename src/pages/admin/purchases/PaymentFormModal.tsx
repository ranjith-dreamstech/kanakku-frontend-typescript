import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useEffect, useState, type FC } from "react";
import axios, { AxiosError } from "axios";
import Constants from "../../../constants/api";
import { toast } from "react-toastify";
import Modal from "../../../components/admin/Modal";
import SearchableDropdown from "../../../components/admin/SearchableDropdown";
import DateInput from "../../../components/admin/DateInput";

interface PaymentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isEditMode: boolean;
    initialData: SupplierPayment | null;
    purchases: Purchase[];
    paymentModes: IPaymentMode[];
}

interface SupplierPayment {
    id: string;
    paymentId: string;
    referenceNumber: string;
    paymentDate: any;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    notes: string;
    supplier: {
        id: string;
        name: string;
        email: string;
        phone: string;
        profileImage: string;
    };
    purchase: {
        id: string;
        purchaseId: string;
        totalAmount: number;
        purchaseDate: string;
    };
    paymentMode: {
        id: string;
        name: string;
    };
    attachment: string | null;
}

interface IPaymentMode {
    id: string;
    name: string;
}


interface Purchase {
    id: string;
    purchaseId: string;
    totalAmount: number;
    vendor: {
        id: string;
    };
    payment?: {
        amount: number;
        paidAmount: number;
        dueAmount: number;
        paymentDate: number;
    }
}

interface PaymentFormData {
    id?: string;
    purchaseId: string;
    supplierId: string;
    referenceNumber: string;
    paymentDate: Date | null;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMode: string;
    notes: string;
    attachment: File | null;
}
const initialFormData: PaymentFormData = {
    purchaseId: '',
    supplierId: '',
    referenceNumber: '',
    paymentDate: new Date(),
    amount: 0,
    paidAmount: 0,
    dueAmount: 0,
    paymentMode: '',
    notes: '',
    attachment: null
}
const PaymentFormModal: FC<PaymentFormModalProps> = ({ isOpen, onClose, onConfirm, isEditMode, initialData, purchases, paymentModes }) => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [formData, setFormData] = useState<PaymentFormData>(initialFormData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initialData) {
                setFormData(initialFormData);
            } else {
                // Reset for new payment
                setFormData(initialFormData);
            }
            setErrors({});
        }
    }, [isOpen, isEditMode, initialData]);

    const handleFormChange = (field: keyof PaymentFormData, value: any) => {
        let newFormData = { ...formData, [field]: value };

        if (field === 'purchaseId') {
            const selectedPurchase = purchases.find(p => p.id === value);
            if(selectedPurchase?.payment){
                newFormData.amount = selectedPurchase?.payment?.dueAmount || 0;
            }else{
                newFormData.amount = selectedPurchase?.totalAmount || 0;
            }
            newFormData.supplierId = selectedPurchase?.vendor.id || '';
        }

        if (field === 'paidAmount') {
            if (Number(value) > newFormData.amount) {
                setErrors(prev => ({ ...prev, paidAmount: 'Paid amount cannot exceed total amount.' }));
            } else if(Number(value) < 1) {
                setErrors(prev => ({ ...prev, paidAmount: 'Paid amount must be greater than 0.' }));
            }else {
                const newErrors = { ...errors };
                delete newErrors.paidAmount;
                setErrors(newErrors);
            }
            let dueAmount = newFormData.amount - Number(value);
            newFormData.dueAmount = dueAmount;
        }
        setFormData(newFormData);
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.purchaseId) newErrors.purchaseId = 'Purchase ID is required.';
        if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required.';
        if (formData.paidAmount <= 0) newErrors.paidAmount = 'Paid amount must be greater than 0.';
        if (formData.paidAmount > formData.amount) newErrors.paidAmount = 'Paid amount cannot exceed total amount.';
        if (!formData.paymentMode) newErrors.paymentMode = 'Payment mode is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const apiData = new FormData();
        apiData.append('purchaseId', formData.purchaseId);
        apiData.append('supplierId', formData.supplierId);
        apiData.append('dueAmount', String(formData.amount - formData.paidAmount));
        apiData.append('referenceNumber', formData.referenceNumber);
        apiData.append('paymentDate', formData.paymentDate!.toISOString().split('T')[0]);
        apiData.append('amount', String(formData.amount));
        apiData.append('paidAmount', String(formData.paidAmount));
        apiData.append('paymentMode', formData.paymentMode);
        apiData.append('notes', formData.notes);
        if (formData.attachment) {
            apiData.append('attachment', formData.attachment);
        }

        try {
            if (isEditMode) {
                await axios.put(`${Constants.UPDATE_SUPPLIER_PAYMENT_URL}/${formData.id}`, apiData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Payment updated successfully');
            } else {
                await axios.post(Constants.CREATE_SUPPLIER_PAYMENT_URL, apiData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Payment created successfully');
            }
            onConfirm();
        } catch (error: any | AxiosError) {
            console.error("Failed to save payment:", error);
            toast.error(error?.response?.data?.message || 'Failed to save payment.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Payment' : 'Add New Payment'} size="3xl">
            <form onSubmit={handleSubmit} className="p-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    {/* Purchase ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase ID <span className="text-red-500">*</span></label>
                        <SearchableDropdown
                            options={purchases.map(p => ({ id: p.id, name: p.purchaseId }))}
                            placeholder='Select Purchase ID'
                            value={purchases.map(p => ({ id: p.id, name: p.purchaseId })).find(order => order.id === formData.purchaseId) ?? null}
                            onChange={(e, value) => handleFormChange('purchaseId', value?.id || null)}
                        />
                        {errors.purchaseId && <span className="text-red-500 text-xs">{errors.purchaseId}</span>}
                    </div>

                    {/* Payment Date */}
                    <div>
                        <DateInput
                            label="Payment Date"
                            value={formData.paymentDate}
                            onChange={(newDate) => handleFormChange('paymentDate', newDate)}
                            isRequired
                        />
                        {errors.paymentDate && <span className="text-red-500 text-xs">{errors.paymentDate}</span>}
                    </div>

                    {/* Reference Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference Number</label>
                        <input type="text" value={formData.referenceNumber} onChange={(e) => handleFormChange('referenceNumber', e.target.value)} className="mt-1 border border-gray-300 rounded-md px-3 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                    </div>

                    {/* Total Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                        <input type="number" value={formData.amount} readOnly className="mt-1 border border-gray-300 rounded-md px-3 py-2 w-full read-only:bg-gray-100 dark:read-only:bg-gray-700 dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </div>

                    {/* Paid Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paid Amount <span className="text-red-500">*</span></label>
                        <input type="number" value={formData.paidAmount} onChange={(e) => handleFormChange('paidAmount', e.target.value)} className="mt-1 border border-gray-300 rounded-md px-3 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {errors.paidAmount && <span className="text-red-500 text-xs">{errors.paidAmount}</span>}
                    </div>

                    {/* Due Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Amount <span className="text-red-500">*</span></label>
                        <input type="number" value={formData.dueAmount} onChange={(e) => handleFormChange('dueAmount', e.target.value)} readOnly className="mt-1 border border-gray-300 rounded-md px-3 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600" />
                        {errors.dueAmount && <span className="text-red-500 text-xs">{errors.dueAmount}</span>}
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode <span className="text-red-500">*</span></label>
                        <SearchableDropdown
                            options={paymentModes}
                            placeholder='Select Payment Mode'
                            value={paymentModes.find(mode => mode.id === formData.paymentMode) ?? null}
                            onChange={(e, value) => handleFormChange('paymentMode', value?.id || null)}
                        />
                        {errors.paymentMode && <span className="text-red-500 text-xs">{errors.paymentMode}</span>}
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea value={formData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} rows={2} className="mt-1 border border-gray-300 rounded-md px-3 py-2 w-full dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"></textarea>
                    </div>

                    {/* Attachment */}
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {/* <UploadCloud className="mx-auto h-12 w-12 text-gray-400" /> */}
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="attachment" className="relative cursor-pointer bg-white dark:bg-transparent rounded-md font-medium text-purple-600 hover:text-purple-500">
                                        <span>Browse files</span>
                                        <input id="attachment" name="attachment" type="file" className="sr-only" onChange={(e) => handleFormChange('attachment', e.target.files ? e.target.files[0] : null)} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Max size: 5MB</p>
                            </div>
                        </div>
                        {formData.attachment && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Selected: {formData.attachment.name}</p>}
                    </div>
                </div>

                <div className="flex justify-between items-center px-6 pb-6 pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">Cancel</button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 cursor-pointer">{isEditMode ? 'Update' : 'Create'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default PaymentFormModal;