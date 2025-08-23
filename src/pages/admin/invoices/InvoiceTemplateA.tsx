import styled from 'styled-components';
import { numberToWords, systemSettings, formatCurrency } from '@utils/converters';
import type { InvoiceData } from '@models/invoice';

type InvoiceDetailsProps = {
    invoiceData: InvoiceData
}
const InvoiceTemplateA: React.FC<InvoiceDetailsProps> = ({ invoiceData }) => {
    console.log('invoiceData', invoiceData);
    const InvoiceWrapper = styled.div`
    p{
      font-size: 12px;
      font-weight: 500;
    }
  `;

    return (
        <InvoiceWrapper className="bg-white pl-12 pr-12 font-sans text-gray-800 max-w-5xl mx-auto my-8">

            {/* Header Section */}
            <header className="pb-6 border-b border-gray-200">
                {/* Row 1: Logo + Title */}
                <div className="flex justify-between items-center">
                    <img
                        src={systemSettings?.companyDetails?.logo}
                        alt="Company Logo"
                        className="w-32 h-auto"
                    />
                    <h1 className="text-xl font-bold text-gray-900">TAX INVOICE</h1>
                </div>

                {/* Row 2: Original + Date/Invoice */}
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <p className="text-xs">Original For Recipient</p>
                    <div className="flex items-center gap-4">
                        <p>Date: {invoiceData?.dueDate}</p>
                        <p>
                            Invoice No: {invoiceData?.invoiceNumber}
                        </p>
                    </div>
                </div>
            </header>


            {/* Billing Information Section */}
            <section className="flex justify-between mt-8">
                <div className="w-2/5">
                    <h2 className="font-bold text-violet-600 mb-2">Invoice To :</h2>
                    <p className="font-semibold">{invoiceData?.billTo.name}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billTo?.billingAddress?.addressLine1}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billTo?.billingAddress?.city}, {invoiceData?.billTo?.billingAddress?.state}, {invoiceData?.billTo?.billingAddress?.country}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billTo?.email}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billTo.phone}</p>
                </div>
                <div className="w-2/5">
                    <h2 className="font-bold text-violet-600 mb-2">Pay To :</h2>
                    <p className="font-semibold">{invoiceData?.billFrom.name}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billFrom.address}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billFrom.email}</p>
                    <p className="text-sm text-gray-600">{invoiceData?.billFrom.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-violet-600 mb-2">{systemSettings.companyDetails.name}</h2>
                    <p className="text-sm text-gray-600">Address: {systemSettings.companyDetails.address}</p>
                    <p className="text-sm text-gray-600">Mobile: {systemSettings.companyDetails.phone}</p>
                </div>
            </section>

            {/* Items Table */}
            <section className="mt-10">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th className="p-3 text-sm font-semibold text-gray-600">#</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Item</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 text-right">Qty</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 text-right">Price</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 text-right">Discount</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceData && invoiceData.items.map((item, index) => (
                            <tr key={item.id} className="border-b border-gray-200">
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-right">{item.qty}</td>
                                <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                                <td className="p-3 text-right">{formatCurrency(item.discount)}</td>
                                <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Totals Section */}
            <section className="flex justify-end mt-6">
                <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm text-gray-600 py-2">
                        <span className='font-bold'>Sub Total</span>
                        <span className='font-semibold'>{formatCurrency(invoiceData?.taxableAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 py-2">
                        <span className='font-bold'>Tax</span>
                        <span className='font-semibold'>{formatCurrency(invoiceData?.vat || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 py-2">
                        <span className='font-bold'>Discount</span>
                        <span className='font-semibold'>{formatCurrency(invoiceData?.totalDiscount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg py-3">
                        <span className='font-bold'>Total</span>
                        <span className='font-semibold'>{formatCurrency(invoiceData?.TotalAmount || 0)}</span>
                    </div>
                </div>
            </section>

            {/* Amount in words and Summary */}
            <section className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">Total Items / Qty : {invoiceData?.items.length} / {invoiceData?.items.reduce((sum, item) => sum + item.qty, 0)}</p>
                <p className="text-sm mt-2">
                    <span className="font-semibold">Total amount ( in words) : </span>
                    {numberToWords(invoiceData?.TotalAmount || 0)}
                </p>
            </section>

            {/* Footer: Bank Details & Signature */}
            <footer className="mt-12 pt-8 flex justify-between border-t border-gray-200">
                <div>
                    <h3 className="font-semibold mb-2">Bank Details</h3>
                    <p className="text-sm text-gray-600">Bank : {invoiceData?.bank?.bankName}</p>
                    <p className="text-sm text-gray-600">Account # : {invoiceData?.bank?.accountNumber}</p>
                    <p className="text-sm text-gray-600">IFSC : {invoiceData?.bank?.IFSCCode}</p>
                    <p className="text-sm text-gray-600">BRANCH : {invoiceData?.bank?.branchName}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm mb-4">For Kanakku</p>
                    <img src={invoiceData?.signature?.image ?? ''} alt="Signature" className="w-40 h-auto" />
                </div>
            </footer>

            {/* Terms and Conditions */}
            <section className="mt-10">
                <h3 className="font-semibold mb-2">Terms & Conditions :</h3>
                <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                    <li>{invoiceData?.termsAndCondition}</li>
                </ol>
            </section>

            <div className="mt-12 text-center text-sm text-gray-500">
                <p>Thanks for your Business</p>
            </div>

        </InvoiceWrapper>
    );
}

export default InvoiceTemplateA;