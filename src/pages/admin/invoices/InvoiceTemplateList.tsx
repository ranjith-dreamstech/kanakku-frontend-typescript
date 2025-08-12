import React, { useEffect } from "react";
import invoice1 from "@assets/invoices/invoice-1.png";
import invoice2 from "@assets/invoices/invoice-2.png";
import invoice3 from "@assets/invoices/invoice-3.png";
import invoice4 from "@assets/invoices/invoice-4.png";
import invoice5 from "@assets/invoices/invoice-5.png";
import { Star, Eye, X } from "lucide-react";
import axios from "axios";
import Constants from "@constants/api";
import { useSelector } from "react-redux";
import type { RootState } from "@store/index";
import Modal from "@components/admin/Modal";

interface InvoiceTemplate {
    id: number;
    name: string;
    image: string;
}

const templates: InvoiceTemplate[] = [
    { id: 1, name: "General Invoice 1", image: invoice1 },
    { id: 2, name: "General Invoice 2", image: invoice2 },
    { id: 3, name: "General Invoice 3", image: invoice3 },
    { id: 4, name: "General Invoice 4", image: invoice4 },
    { id: 5, name: "Dark Invoice", image: invoice5 },
];

const InvoiceTemplateList: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [defaultInvoiceTemplate, setDefaultInvoiceTemplate] = React.useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedTemplate, setSelectedTemplate] = React.useState<number | null>(null);

    const makeDefault = async (id: number) => {
        try {
            await axios.post(
                Constants.MAKE_INVOICE_TEMPLATE_DEFAULT_URL,
                { default_invoice_template: id },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            await fetchDefaultTemplate();
            console.log(`Invoice template ${id} set as default.`);
        } catch (error) {
            console.error("Error making invoice template default:", error);
        }
    };

    const fetchDefaultTemplate = async () => {
        try {
            const response = await axios.get(Constants.FETCH_DEFAULT_INVOICE_TEMPLATE_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data.data;
            if (data?.default_invoice_template) {
                setDefaultInvoiceTemplate(Number(data.default_invoice_template));
            }
        } catch (error) {
            console.error("Error fetching default invoice template:", error);
        }
    };

    useEffect(() => {
        fetchDefaultTemplate();
    }, []);

    const viewTemplate = (id: number) => {
        setSelectedTemplate(id);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Invoice Templates</h2>
                <p className="text-gray-500 text-sm mt-1">Select a template for your invoices</p>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden border border-gray-200 flex flex-col h-full"
                    >
                        {/* Thumbnail */}
                        <div
                            onClick={() => viewTemplate(template.id)}
                            className="relative group h-48 overflow-hidden cursor-pointer"
                        >
                            <img
                                src={template.image}
                                alt={template.name}
                                className="w-full h-full object-cover object-top"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-purple-500 bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                                <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer">
                                    <Eye className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-3 mt-auto border-t border-gray-100">
                            <span className="text-gray-800 font-medium text-sm truncate">
                                {template.name}
                            </span>
                            <button
                                onClick={() => makeDefault(template.id)}
                                className="p-1.5 rounded-full hover:bg-purple-100 transition flex-shrink-0 cursor-pointer"
                            >
                                <span
                                    className={`flex items-center justify-center rounded-full ${defaultInvoiceTemplate === template.id
                                            ? "bg-purple-600"
                                            : "bg-white border border-gray-300"
                                        }`}
                                >
                                    <Star
                                        className={`w-5 h-5 p-1 rounded-full ${defaultInvoiceTemplate === template.id
                                                ? "text-white"
                                                : "text-purple-600"
                                            }`}
                                    />
                                </span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invoice Template">
                {selectedTemplate && (
                    <img
                        src={templates.find((template) => template.id === selectedTemplate)?.image}
                        alt={templates.find((template) => template.id === selectedTemplate)?.name}
                        className="w-full"
                    />
                )}
            </Modal>
        </div>
    );
};

export default InvoiceTemplateList;
