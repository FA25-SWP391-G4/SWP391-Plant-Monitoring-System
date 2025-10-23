"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-green-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-green-700">Forgot Password</h1>
        {!sent ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <button className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700">
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="mt-6 p-4 border rounded-lg text-sm text-green-700 bg-green-50">
            ✅ A password reset link has been sent to your email.
          </div>
        )}
        <p className="mt-4 text-sm text-center">
          <Link href="/(public)/login" className="text-green-700 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
