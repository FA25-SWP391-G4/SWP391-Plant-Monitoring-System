// Layout for public pages – NO <html> or <body> here
import Footer from "@/components/public/Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
