"use client";
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-green-700 text-center">Contact Us</h1>
      {!sent ? (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <input
            placeholder="Full Name"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <textarea
            placeholder="Message"
            rows={5}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <button className="bg-green-600 text-white rounded-lg px-5 py-2 font-medium hover:bg-green-700 w-fit">
            Send Message
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-lg border p-4 bg-green-50 text-green-700 text-center">
          ✅ Thank you! We’ll reply within 1–2 business days.
        </div>
      )}
    </section>
  );
}
