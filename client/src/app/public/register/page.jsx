"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-green-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-green-700">Create your account</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            placeholder="Full name"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <button
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link href="/(public)/login" className="text-green-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
