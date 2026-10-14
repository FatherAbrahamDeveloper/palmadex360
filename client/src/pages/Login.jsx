import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    LogIn,
    Mail,
    Lock,
    Loader2
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

import { useAuth } from "@/context/AuthContext";

export default function Login() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        setError("");

        try {

            await login(email, password);

            navigate("/");

        }

        catch (err) {

            setError(

                err?.response?.data?.message ||

                err.message ||

                "Login failed"

            );

        }

        finally {

            setLoading(false);

        }

    };

    const handleGoogle = () => {

        alert("Google Login will be implemented later.");

    };

    return (

        <AuthLayout

            icon={LogIn}

            title="Welcome Back"

            subtitle="Sign in to Palmadex360 Account"

            footer={

                <>

                    Don't have an account?{" "}

                    <Link

                        to="/register"

                        className="text-primary hover:underline"

                    >

                        Register

                    </Link>

                </>

            }

        >

            <Button

                variant="outline"

                className="w-full h-11 mb-6"

                onClick={handleGoogle}

            >

                <GoogleIcon className="mr-2 h-5 w-5" />

                Continue with Google

            </Button>

            <div className="relative mb-6">

                <div className="absolute inset-0 flex items-center">

                    <div className="w-full border-t"></div>

                </div>

                <div className="relative flex justify-center">

                    <span className="bg-background px-2 text-xs uppercase text-muted-foreground">

                        Or

                    </span>

                </div>

            </div>

            {error && (

                <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">

                    {error}

                </div>

            )}

            <form

                onSubmit={handleSubmit}

                className="space-y-4"

            >

                <div>

                    <Label>Email</Label>

                    <div className="relative">

                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                        <Input

                            type="email"

                            value={email}

                            onChange={(e) => setEmail(e.target.value)}

                            className="pl-10 h-11"

                            required

                        />

                    </div>

                </div>

                <div>

                    <Label>Password</Label>

                    <div className="relative">

                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                        <Input

                            type="password"

                            value={password}

                            onChange={(e) => setPassword(e.target.value)}

                            className="pl-10"

                            required

                        />

                    </div>

                </div>

                <Button

                    className="w-full"

                    disabled={loading}

                >

                    {

                        loading ?

                        <>

                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>

                            Logging In...

                        </>

                        :

                        "Log In"

                    }

                </Button>

            </form>

        </AuthLayout>

    );

}