'use client';

import React, { forwardRef } from 'react';

export const countryCodes: any[] = [];

export interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, id, name, placeholder, className = '', disabled = false, error, onBlur }, ref) => {
    
    const handleNumberChange = (rawVal: string) => {
      // Allow only digits, max 15 digits
      const digits = rawVal.replace(/\D/g, '').slice(0, 15);
      onChange(digits);
    };

    return (
      <div className="w-full">
        <input
          ref={ref}
          type="text"
          id={id}
          name={name}
          value={value ? value.replace(/\D/g, '') : ''}
          onChange={(e) => handleNumberChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder || 'Phone Number'}
          className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all bg-white shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 ${
            error 
              ? 'border-rose-400 focus-within:border-rose-500 focus:ring-rose-500/10' 
              : 'border-slate-200 focus-within:border-blue-500 dark:border-slate-200'
          } ${disabled ? 'opacity-60 bg-slate-50' : ''} ${className}`}
          style={{ letterSpacing: '0.025em' }}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
