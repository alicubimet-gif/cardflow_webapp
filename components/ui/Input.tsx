import React, { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, id, ...props }, ref) => {
    const fallbackId = useId();
    const inputId = id || fallbackId;
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';
    const currentType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full text-left">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={currentType}
            ref={ref}
            className={`appearance-none block w-full px-3 py-2.5 border rounded-xl shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 text-sm disabled:opacity-50 text-slate-900 bg-white transition-all ${
              isPasswordType ? "pr-10" : ""
            } ${
              error 
                ? "border-rose-500 focus:ring-rose-500/10 focus:border-rose-500" 
                : "border-slate-350 focus:ring-blue-500 focus:border-blue-500"
            } ${className}`}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-hidden"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
