import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { Leaf } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/30">
      {/* Header */}
      <header className="w-full p-6">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PlantSmart</h1>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3 text-balance">Reset Your Password</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Forgot Password Form */}
          <ForgotPasswordForm />

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
