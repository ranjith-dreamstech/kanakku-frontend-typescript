import { Navigate, Route, Routes } from "react-router-dom"
import AdminRoute from "./AdminRoute"

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/admin/*" element={<AdminRoute />} />
            <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
    );
};

export default AppRoutes;