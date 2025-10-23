import Link from "next/link";
import BrandLogo from "@/components/public/BrandLogo";
import FeatureGrid from "@/components/public/FeatureGrid";

export default function LandingPage() {
  return (
    <div className="relative">
      <section className="container mx-auto px-4 pt-16 pb-12">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/(public)/login" className="hover:underline">Sign in</Link>
            <Link href="/(public)/register" className="rounded-full border px-4 py-2 hover:bg-green-50 text-green-700 border-green-600">
              Get started
            </Link>
          </div>
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your plants, <span className="text-green-600">perfectly watered</span>.
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl">
              SmartGarden connects sensors and pumps to automate care. See live data, set thresholds and relax.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/(public)/register" className="rounded-xl bg-green-600 px-5 py-2.5 text-white font-medium shadow hover:bg-green-700">
                Try for free
              </Link>
              <Link href="/upgrade" className="rounded-xl border px-5 py-2.5 font-medium hover:bg-muted">
                See Premium
              </Link>
            </div>
          </div>
          <div>
            <div className="aspect-video rounded-2xl border bg-green-100" />
          </div>
        </div>

        <div className="mt-14">
          <FeatureGrid />
        </div>
      </section>
    </div>
  );
}
