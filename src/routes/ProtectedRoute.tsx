import { useSelector } from "react-redux"
import type { RootState } from "../store"
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
    if(isLoading) {
        return <div>Loading...</div>
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" />
}

export default ProtectedRoute;