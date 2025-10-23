"use client";
import PublicLayout from "@/components/layout/PublicLayout";

export default function ContactPage() {
  return (
    <PublicLayout>
      <h2 className="text-2xl font-bold text-emerald-600 mb-4">Contact Us</h2>
      <p className="text-gray-600 mb-6 text-sm text-center">
        We’d love to hear from you! Fill out the form below or email us at{" "}
        <a href="mailto:support@smartfarm.com" className="text-emerald-600 underline">
          support@smartfarm.com
        </a>.
      </p>
      <form className="space-y-4">
        <input type="text" placeholder="Your name" className="w-full border rounded-md p-2" required />
        <input type="email" placeholder="Email" className="w-full border rounded-md p-2" required />
        <textarea placeholder="Message" className="w-full border rounded-md p-2 h-24" required />
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-md"
        >
          Send Message
        </button>
      </form>
    </PublicLayout>
  );
}
