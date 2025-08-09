import { Route, Routes } from "react-router-dom";
import AdminLogin from "@pages/admin/auth/AdminLogin";
import AdminDashboard from "@pages/admin/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "@components/admin/layouts/AdminLayout";
import UnitList from "@pages/admin/productAndServices/UnitList";
import BrandList from "@pages/admin/productAndServices/BrandList";
import CategoryList from "@pages/admin/productAndServices/Categories";
import ProductList from "@pages/admin/productAndServices/ProductList";
import AddProduct from "@pages/admin/productAndServices/AddProduct";
import EditProduct from "@pages/admin/productAndServices/EditProduct";
import TaxRateList from "@pages/admin/settings/TaxRates";
import TaxGroups from "@pages/admin/settings/TaxGroups";
import AccountSettings from "@pages/admin/settings/AccountSettings";
import SupplierList from "@pages/admin/purchases/SupplierList";
import SignatureList from "@pages/admin/settings/systemSettings/SignatureList";
import PurchaseOrderList from "@pages/admin/purchases/PurchaseOrderList";
import CreatePurchaseOrder from "@pages/admin/purchases/CreatePurchaseOrder";
import BankAccountList from "@pages/admin/settings/financeSettings/BankAccountList";
import CompanySettings from "@pages/admin/settings/websiteSettings/CompanySettings";
import EditPurchaseOrder from "@pages/admin/purchases/EditPurchaseOrder";
import PurchaseList from "@pages/admin/purchases/PurchaseList";
import CreatePurchase from "@pages/admin/purchases/CreatePurchase";
import SupplierPayments from "@pages/admin/purchases/SupplierPayments";
import DebitNoteList from "@pages/admin/purchases/DebitNoteList";
import CreateDebitNote from "@pages/admin/purchases/CreateDebitNote";
import CurrencyList from "@pages/admin/settings/financeSettings/currencies/CurrencyList";
import LocalizationSettings from "@pages/admin/settings/websiteSettings/LocalizationSettings";
import CustomerList from "@pages/admin/customers/CustomerList";
import CustomerForm from "@pages/admin/customers/CustomerForm";

const AdminRoute = () => {
    return (
        <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />

                    {/* Product & Services Routes */}
                    <Route path="/units" element={<UnitList />} />
                    <Route path="/brands" element={<BrandList />} />
                    <Route path="/categories" element={<CategoryList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/new" element={<AddProduct />} />
                    <Route path="/products/edit/:id" element={<EditProduct />} />

                    {/* Customers Routes */}
                    <Route path="/customers" element={<CustomerList />} />
                    <Route path="/customers/new" element={<CustomerForm />} />

                    {/* General Settings Routes */}
                    <Route path="/settings/account" element={<AccountSettings />} />

                    {/* Website Settings Routes */}
                    <Route path="/settings/company-settings" element={<CompanySettings />} />
                    <Route path="/settings/localization" element={<LocalizationSettings />} />

                    {/* System Settings Routes */}
                    <Route path="/settings/signatures" element={<SignatureList />} />

                    {/* Finance Settings Routes */}
                    <Route path="/settings/bank-accounts" element={<BankAccountList />} />
                    <Route path="/settings/tax-rates" element={<TaxRateList />} />
                    <Route path="/settings/tax-groups" element={<TaxGroups />} />
                    <Route path="/settings/currencies" element={<CurrencyList />} />

                    {/* Purchase Module Routes */}
                    <Route path="/purchase-orders" element={<PurchaseOrderList />} />
                    <Route path="/purchase-orders/new" element={<CreatePurchaseOrder />} />
                    <Route path="/purchase-orders/edit/:id" element={<EditPurchaseOrder />} />
                    <Route path="/purchases" element={<PurchaseList />} />
                    <Route path="/debit-notes" element={<DebitNoteList />} />
                    <Route path="/debit-notes/new" element={<CreateDebitNote />} />
                    <Route path="/purchase/new" element={<CreatePurchase />} />
                    <Route path="/suppliers" element={<SupplierList />} />
                    <Route path="/supplier-payments" element={<SupplierPayments />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default AdminRoute;