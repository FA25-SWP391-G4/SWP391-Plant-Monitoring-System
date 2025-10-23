"use client";
import Link from "next/link";

export default function BrandLogo({ className = "" }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="h-9 w-9 rounded-2xl bg-green-600/10 ring-1 ring-green-600/40 flex items-center justify-center">
        <span className="text-lg font-black text-green-600">SG</span>
      </div>
      <span className="font-semibold tracking-tight">SmartGarden</span>
    </Link>
  );
}
