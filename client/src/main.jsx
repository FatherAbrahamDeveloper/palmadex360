import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "./lib/query-client";
import "./index.css";

function ThemedToaster() {
    const { resolved } = useTheme();
    return <Toaster position="top-right" richColors closeButton theme={resolved} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
            <BrowserRouter>
                <AuthProvider>
                    <RealtimeProvider>
                        <App />
                    </RealtimeProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
            <ThemedToaster />
        </ThemeProvider>

    </React.StrictMode>
);