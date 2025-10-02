import { LogoutConfirmation } from "@/components/logout-confirmation"
import { Sprout, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LogoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/subtle-plant-leaf-pattern.jpg')] opacity-5" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">PlantSmart</h1>
          </div>
        </div>

        {/* Logout Confirmation */}
        <LogoutConfirmation />
      </div>
    </div>
  )
}
