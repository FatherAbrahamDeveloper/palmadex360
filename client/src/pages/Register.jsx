import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/context/AuthContext";

export default function Register() {

    const navigate = useNavigate();

    const { register } = useAuth();

    const [email,setEmail]=useState("");

    const [password,setPassword]=useState("");

    const [confirmPassword,setConfirmPassword]=useState("");

    const [loading,setLoading]=useState(false);

    const [error,setError]=useState("");

    async function handleSubmit(e){

        e.preventDefault();

        setError("");

        if(password!==confirmPassword){

            setError("Passwords do not match");

            return;

        }

        try{

            setLoading(true);

            await register({

                email,

                password

            });

            navigate("/");

        }

        catch(err){

            setError(

                err?.response?.data?.message ||

                err.message ||

                "Registration failed"

            );

        }

        finally{

            setLoading(false);

        }

    }

    return(

<AuthLayout
icon={UserPlus}
title="Create your account"
subtitle="Join Palmadex 360"
footer={
<>
Already have an account? <Link to="/login">Login</Link>
</>
}
>

<Button variant="outline" className="w-full mb-6">

<GoogleIcon className="mr-2 h-5 w-5"/>

Google Coming Soon

</Button>

{error&&<div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>}

<form onSubmit={handleSubmit} className="space-y-4">

<div>

<Label>Email</Label>

<div className="relative">

<Mail className="absolute left-3 top-3 h-4 w-4"/>

<Input
className="pl-10"
value={email}
onChange={e=>setEmail(e.target.value)}
required
/>

</div>

</div>

<div>

<Label>Password</Label>

<div className="relative">

<Lock className="absolute left-3 top-3 h-4 w-4"/>

<Input
type="password"
className="pl-10"
value={password}
onChange={e=>setPassword(e.target.value)}
required
/>

</div>

</div>

<div>

<Label>Confirm Password</Label>

<div className="relative">

<Lock className="absolute left-3 top-3 h-4 w-4"/>

<Input
type="password"
className="pl-10"
value={confirmPassword}
onChange={e=>setConfirmPassword(e.target.value)}
required
/>

</div>

</div>

<Button className="w-full">

{loading?<Loader2 className="animate-spin"/>:"Create Account"}

</Button>

</form>

</AuthLayout>

);

}