"use client";

import Link from "next/link";
import BrandLogo from "@/components/public/BrandLogo"; // ✅ default import
import { useAuth } from "@/providers/AuthProvider";   // ✅ named import

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b border-green-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* ✅ Brand Logo */}
        <BrandLogo />

        {/* ✅ Navigation Links */}
        <ul className="flex items-center gap-6">
          <li>
            <Link href="/" className="hover:text-green-600 font-medium">
              Home
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-green-600 font-medium">
              Contact
            </Link>
          </li>

          {/* ✅ Auth Controls */}
          {!user ? (
            <>
              <li>
                <Link
                  href="/login"
                  className="rounded-lg border px-4 py-2 hover:bg-green-50"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700"
                >
                  Register
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="text-sm text-gray-700">
                Hi, <strong>{user.name}</strong>
              </li>
              <li>
                <button
                  onClick={logout}
                  className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
