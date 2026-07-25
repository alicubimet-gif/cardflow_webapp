"use client";

import React from "react";
import Image from "next/image";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center">
        {/* Branding Logo */}
        <div className="mb-8">
          <Image
            src="/branding/logo-light.png"
            alt="CardFlow"
            width={180}
            height={56}
            priority
            className="w-auto h-auto object-contain select-none pointer-events-none"
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        {/* WifiOff Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-6">
          <WifiOff size={32} />
        </div>

        {/* Message */}
        <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
          You’re Offline
        </h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          CardFlow cannot connect to the server right now.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Check your internet connection and try again.
        </p>

        {/* Action Button */}
        <button
          onClick={handleReload}
          className="mt-8 w-full py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
