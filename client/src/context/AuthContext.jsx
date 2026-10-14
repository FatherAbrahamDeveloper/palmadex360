import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import authService from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        initialize();

    }, []);

    async function initialize() {

        const token = localStorage.getItem("token");

        if (!token) {

            setLoading(false);

            return;

        }

        try {

            const response = await authService.me();

            setUser(response.user);

        }

        catch (err) {

            console.error(err);

            localStorage.removeItem("token");

            setUser(null);

        }

        finally {

            setLoading(false);

        }

    }

    async function login(email, password) {

        const response = await authService.login(email, password);

        localStorage.setItem("token", response.token);

        setUser(response.user);

        return response;

    }

    async function register(data) {

        const response = await authService.register(data);

        localStorage.setItem("token", response.token);

        setUser(response.user);

        return response;

    }

   function logout() {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
}

    return (

        <AuthContext.Provider

            value={{

                user,

                loading,

                login,

                register,

                logout,

                isAuthenticated: !!user

            }}

        >

            {children}

        </AuthContext.Provider>

    );

}

export function useAuth() {

    return useContext(AuthContext);

}