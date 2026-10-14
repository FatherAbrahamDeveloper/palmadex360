import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingScreen = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
            </div>

            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>

            <p className="text-gray-500 text-sm">
                Authenticating...
            </p>
        </div>
    </div>
);

export default function ProtectedRoute() {

    const { loading, isAuthenticated } = useAuth();

    const location = useLocation();

    if (loading) {

        return <LoadingScreen />;

    }

    if (!isAuthenticated) {

        return (

            <Navigate

                to="/login"

                replace

                state={{ from: location }}

            />

        );

    }

    return <Outlet />;

}