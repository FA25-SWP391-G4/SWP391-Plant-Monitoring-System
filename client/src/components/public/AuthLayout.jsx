"use client";
import BrandLogo from "@/components/public/BrandLogo";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-[100dvh] grid md:grid-cols-2">
      <div className="relative hidden md:block bg-gradient-to-br from-green-600/10 via-emerald-500/10 to-blue-500/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-md mx-auto p-10 text-center">
            <BrandLogo className="justify-center" />
            <h2 className="mt-6 text-3xl font-bold">Grow smarter with SmartGarden</h2>
            <p className="mt-3 text-muted-foreground">
              Monitor, automate and care for your plants from anywhere.
            </p>
            <div className="mt-8 rounded-2xl border bg-background/60 backdrop-blur p-6 text-left">
              <ul className="space-y-2 text-sm">
                <li>• Real-time moisture & climate sensors</li>
                <li>• Auto-watering with thresholds</li>
                <li>• Alerts & care insights</li>
                <li>• Multi-tenant roles & Premium</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 flex flex-col">
        <div className="flex items-center justify-between">
          <BrandLogo />
        </div>
        <div className="flex-1 w-full max-w-md mx-auto flex items-center">
          <div className="w-full">{children}</div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
