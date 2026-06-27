'use client';

import React, { useState, useEffect, forwardRef } from 'react';

export const countryCodes = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
];

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
    const [selectedCode, setSelectedCode] = useState('+91');
    const [nationalNumber, setNationalNumber] = useState('');

    // Parse incoming value (e.g. "+919876543210" or "9876543210")
    useEffect(() => {
      const trimmedValue = (value || '').trim();
      if (!trimmedValue) {
        setNationalNumber('');
        return;
      }

      // Sort by code length descending to match longer prefixes first
      const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
      const match = sortedCodes.find((c) => trimmedValue.startsWith(c.code));

      if (match) {
        setSelectedCode(match.code);
        setNationalNumber(trimmedValue.slice(match.code.length).replace(/\D/g, ''));
      } else if (trimmedValue.startsWith('+')) {
        // Fallback for custom code
        const codeMatch = trimmedValue.match(/^\+\d+/);
        if (codeMatch) {
          const code = codeMatch[0];
          setSelectedCode(code);
          setNationalNumber(trimmedValue.slice(code.length).replace(/\D/g, ''));
        } else {
          setSelectedCode('+91');
          setNationalNumber(trimmedValue.replace(/\D/g, ''));
        }
      } else {
        // No leading plus - assume default +91 prefix
        setSelectedCode('+91');
        setNationalNumber(trimmedValue.replace(/\D/g, ''));
      }
    }, [value]);

    const handleCountryChange = (newCode: string) => {
      setSelectedCode(newCode);
      const codeDigits = newCode.replace('+', '');
      const maxLen = 15 - codeDigits.length;
      const truncatedNum = nationalNumber.slice(0, maxLen);
      setNationalNumber(truncatedNum);
      onChange(truncatedNum ? `${newCode}${truncatedNum}` : '');
    };

    const handleNumberChange = (rawVal: string) => {
      const codeDigits = selectedCode.replace('+', '');
      const maxLen = 15 - codeDigits.length;

      // Allow only digits
      const digits = rawVal.replace(/\D/g, '').slice(0, maxLen);
      setNationalNumber(digits);
      
      onChange(digits ? `${selectedCode}${digits}` : '');
    };

    return (
      <div className="w-full">
        <div 
          className={`flex items-stretch border rounded-xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 transition-all ${
            error 
              ? 'border-rose-400 focus-within:border-rose-500' 
              : 'border-slate-200 focus-within:border-blue-500 dark:border-slate-200'
          } ${disabled ? 'opacity-60 bg-slate-50' : ''} ${className}`}
        >
          {/* Country Selector Dropdown */}
          <div className="relative flex items-center bg-slate-50 border-r border-slate-200 shrink-0">
            <select
              value={selectedCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={disabled}
              className="appearance-none bg-transparent pl-3 pr-8 py-2.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer select-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Phone input field */}
          <input
            ref={ref}
            type="text"
            id={id}
            name={name}
            value={nationalNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder || 'Phone Number'}
            className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 px-3.5 py-2.5 outline-hidden border-none"
            style={{ letterSpacing: '0.025em' }}
          />
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
