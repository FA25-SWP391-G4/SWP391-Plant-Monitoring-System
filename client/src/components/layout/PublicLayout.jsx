"use client";
import Navbar from "@/components/Navbar";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 border border-gray-100">
          {children}
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm border-t">
        © {new Date().getFullYear()} SmartFarm — All rights reserved.
      </footer>
    </div>
  );
}
