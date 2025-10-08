import { Leaf, Play, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <header className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-emerald-100/50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              PlantSmart
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Benefits
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Pricing
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 font-semibold">U</span>
              </div>
              <span>Welcome back!</span>
            </div>
            <Link href="/logout">
              <Button
                variant="outline"
                className="border-2 border-gray-200 hover:border-red-200 hover:text-red-600 bg-white/50"
              >
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-sm font-medium">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Smart Plant Care Revolution</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Never Kill
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Another Plant
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Transform your home into a thriving garden with AI-powered plant monitoring. Get real-time alerts,
                automated watering, and expert care recommendations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-emerald-200 hover:border-emerald-300 px-8 py-4 text-lg font-semibold rounded-xl bg-white/50"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                No credit card required
              </div>
            </div>
          </div>

          {/* Right Column - Plant Dashboard Mockup */}
          <div className="relative">
            <div className="relative z-10">
              <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Plant Monitor</h3>
                      <p className="text-emerald-100 text-sm">Real-time care tracking</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Monstera Deliciosa</h4>
                      <p className="text-gray-500">Swiss Cheese Plant</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-gray-900 mb-1">85%</div>
                        <div className="text-sm text-gray-600 mb-2">Light</div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full"
                            style={{ width: "85%" }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-gray-900 mb-1">72%</div>
                        <div className="text-sm text-gray-600 mb-2">Water</div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full"
                            style={{ width: "72%" }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-gray-900 mb-1">92%</div>
                        <div className="text-sm text-gray-600 mb-2">Health</div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full"
                            style={{ width: "92%" }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm font-medium text-emerald-700">Excellent</span>
                      </div>
                      <p className="text-sm text-emerald-600">Your plant is thriving! Next watering in 3 days.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
