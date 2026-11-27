import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

export const passwordProblems = (p) => [
  p.length < 8 && "at least 8 characters",
  !/[A-Za-z]/.test(p) && "a letter",
  !/\d/.test(p) && "a number",
].filter(Boolean);

export default function PasswordInput({ id, value, onChange, autoComplete = "current-password", ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} className="pl-10 pr-10" value={value} onChange={onChange} {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
