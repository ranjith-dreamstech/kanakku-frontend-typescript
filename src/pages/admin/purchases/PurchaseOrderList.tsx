import { CirclePlusIcon } from "lucide-react";
import Table from "../../../components/admin/Tabls";
import { useNavigate } from "react-router-dom";

const PurchaseOrderList: React.FC = () => {
    const navigate = useNavigate();
    const handleNewPoClick = () => {
        navigate("/admin/purchase-orders/new");
    }
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase Orders</h1>
                <button
                    onClick={handleNewPoClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md shadow cursor-pointer flex items-center gap-2">
                    <CirclePlusIcon size={14} /> New Purchase Order
                </button>
            </div>
            {/* Search Input & PageLength */}
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Search..."
                    className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <select
                    value={1}
                    className="border border-gray-300 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                    {[10, 25, 50].map((num) => (
                        <option className="text-gray-800 dark:text-white" key={num} value={num}>{num} / page</option>
                    ))}
                </select>
            </div>

            <Table headers={["#", "Order Number", "Date", "Supplier", "Amount", "Payment Mode", "Status", "Action"]}>
                    <tr>
                        <td colSpan={8} className="text-center py-4 text-gray-800 dark:text-white font-semibold">No purchase orders found</td>
                    </tr>
            </Table>
        </div>
    );
}

export default PurchaseOrderList;