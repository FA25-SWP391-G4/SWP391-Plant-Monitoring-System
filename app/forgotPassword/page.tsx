import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { Leaf, KeyRound } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="w-full p-6 border-b border-emerald-100/50 bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            PlantSmart
          </h1>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-balance">Reset Your Password</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Forgot Password Form */}
          <ForgotPasswordForm />

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors underline"
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
