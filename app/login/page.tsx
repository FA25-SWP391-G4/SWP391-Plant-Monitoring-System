"use client"

import type React from "react"

import { Sprout, Mail, Lock, CheckCircle, Facebook, Apple } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

const socialProviders = [
  {
    id: "google",
    label: "Continue with Google",
    icon: () => (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" focusable="false">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.26-1.66 3.7-5.5 3.7-3.32 0-6.02-2.75-6.02-6.05S8.18 5.7 11.5 5.7c1.9 0 3.18.8 3.9 1.48l2.65-2.56C16.6 2.6 14.3 1.7 11.5 1.7 6.4 1.7 2.2 5.92 2.2 11s4.2 9.3 9.3 9.3c5.4 0 8.95-3.8 8.95-9.15 0-.62-.07-1.1-.16-1.6H12z"
        />
        <path
          fill="#34A853"
          d="M3.1 7.4l3.2 2.3C7.1 7.3 9.1 5.7 11.5 5.7c1.9 0 3.18.8 3.9 1.48l2.65-2.56C16.6 2.6 14.3 1.7 11.5 1.7 7.9 1.7 4.86 3.7 3.1 7.4z"
        />
        <path
          fill="#FBBC05"
          d="M11.5 20.3c3.84 0 5.26-2.44 5.5-3.7H12v-3.9h8.29c.09.5.16.98.16 1.6 0 5.35-3.55 9.15-8.95 9.15-3.9 0-7.18-2.6-8.35-6.12l3.26-2.54c.78 2.3 2.95 4.5 5.88 4.5z"
        />
        <path fill="#4285F4" d="M21.29 12.7H12v-2.5h9.29c.06.3.11.66.11 1.25 0 .46-.04.88-.11 1.25z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Continue with Apple",
    icon: () => <Apple className="h-5 w-5" aria-hidden="true" />,
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    icon: () => <Facebook className="h-5 w-5" aria-hidden="true" />,
  },
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log("Login data:", formData)

    setIsLoading(false)

    if (formData.email === "admin@gmail.com" && formData.password === "123") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col">
      <header className="w-full border-b border-emerald-100/60 bg-white/80 backdrop-blur-md">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Sprout className="h-7 w-7 text-emerald-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">PlantSmart</span>
          </div>
          <div className="hidden sm:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-emerald-700 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="text-gray-600 hover:text-emerald-700 transition-colors">
              Features
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Welcome Text */}
          <div>
            <div className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mb-4">
              🌱 Welcome Back
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Welcome Back to
              <br />
              <span className="text-emerald-600">PlantSmart</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Sign in to continue nurturing your green sanctuary with intelligent care, real-time insights, and friendly
              reminders.
            </p>

            {/* Benefits List */}
            <div className="hidden lg:block mt-10">
              <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Smart watering schedules tailored to each plant</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Health alerts and expert recommendations</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Beautiful dashboard across all your devices</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div>
            <section
              aria-labelledby="signin-heading"
              className="bg-white rounded-2xl shadow-xl border border-emerald-100/70 p-6 sm:p-8"
            >
              <h2 id="signin-heading" className="text-xl font-semibold text-gray-900 mb-6">
                Sign in to your account
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      aria-invalid="false"
                      placeholder="you@greenspace.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      aria-invalid="false"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Remember Me & Create Account */}
                <div className="flex items-center justify-between">
                  <label htmlFor="remember" className="inline-flex items-center select-none cursor-pointer">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <Link href="/register" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
                    Create account
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>

                {/* Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />
                  <span className="px-3 text-xs uppercase tracking-wider text-gray-500">or</span>
                  <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {socialProviders.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 rounded-lg py-2.5 transition-colors bg-white"
                    >
                      <span className="sr-only">{provider.label}</span>
                      <span className="text-gray-700">{provider.icon()}</span>
                      <span className="text-sm font-medium">
                        {provider.id === "google" ? "Google" : provider.id === "apple" ? "Apple" : "Facebook"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/register"
                    className="w-full px-4 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors text-center"
                  >
                    Create Account
                  </Link>
                  <Link
                    href="/"
                    className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors text-center"
                  >
                    Back to Site
                  </Link>
                </div>

                {/* Terms */}
                <p className="text-center text-xs text-gray-500 mt-2">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </section>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-emerald-100/60">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">© 2025 PlantSmart. All rights reserved.</p>
          <nav className="flex items-center space-x-6 mt-4 sm:mt-0 text-sm">
            <Link href="/" className="text-emerald-700 hover:text-emerald-800 font-medium">
              Return to main site
            </Link>
            <Link href="#privacy" className="text-gray-500 hover:text-gray-700">
              Privacy
            </Link>
            <Link href="#terms" className="text-gray-500 hover:text-gray-700">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
