import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t py-10 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="mb-2 font-semibold text-foreground">SmartGarden</div>
          <p>IoT Plant Monitoring & Auto-Watering. Grow smarter, water wiser.</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <Link href="/(public)/contact" className="hover:text-foreground">Contact</Link>
          <Link href="/(public)/login" className="hover:text-foreground">Login</Link>
          <Link href="/(public)/register" className="hover:text-foreground">Register</Link>
        </nav>
        <div className="md:text-right">
          <p>© {year} SmartGarden. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
