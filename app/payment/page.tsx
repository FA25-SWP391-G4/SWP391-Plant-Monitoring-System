"use client"

import { useState } from "react"
import { useUser } from "@/app/context/user-context"
import { useRouter } from "next/navigation"
import { Leaf, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentPage() {
  const { user, upgradeToPremiun } = useUser()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState("monthly")
  const [paymentMethod, setPaymentMethod] = useState("vnpay")
  const [isProcessing, setIsProcessing] = useState(false)

  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      price: 99000,
      duration: "1 month",
      savings: 0,
    },
    {
      id: "quarterly",
      name: "Quarterly",
      price: 249000,
      duration: "3 months",
      savings: 48000,
    },
    {
      id: "yearly",
      name: "Yearly",
      price: 899000,
      duration: "12 months",
      savings: 289000,
    },
  ]

  const features = [
    "Manage Multiple Plant Zones",
    "View Detailed Plant Monitoring Reports",
    "Configure Advanced Sensor Thresholds",
    "Search Plant Monitoring Reports",
    "Customize Dashboard",
    "Interact with AI Chatbot",
    "Priority Support",
    "Export Reports (PDF/CSV)",
  ]

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      const selectedPlanData = plans.find((p) => p.id === selectedPlan)
      if (selectedPlanData) {
        const endDate = new Date()
        if (selectedPlan === "monthly") endDate.setMonth(endDate.getMonth() + 1)
        else if (selectedPlan === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
        else endDate.setFullYear(endDate.getFullYear() + 1)

        upgradeToPremiun(endDate.toISOString())
        router.push("/user-dashboard")
      }
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PlantSmart</span>
          </Link>

          <Link href="/user-dashboard">
            <Button variant="outline" className="border-emerald-200 hover:border-emerald-400 bg-transparent">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600">Unlock advanced features for better plant care</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Plans */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Selection */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Select Your Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedPlan === plan.id
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-3">
                        <span className="text-3xl font-bold text-emerald-600">{(plan.price / 1000).toFixed(0)}K</span>
                        <span className="text-gray-600 ml-2">VND</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{plan.duration}</p>
                      {plan.savings > 0 && (
                        <div className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full inline-block">
                          Save {(plan.savings / 1000).toFixed(0)}K VND
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "vnpay", name: "VNPay", icon: "💳" },
                    { id: "visa", name: "Visa / Credit Card", icon: "💰" },
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 flex items-center gap-3 ${
                        paymentMethod === method.id
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium text-gray-900">{method.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethod === "visa" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === "vnpay" && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
                    <p className="text-gray-700 font-medium mb-2">VNPay Payment</p>
                    <p className="text-sm text-gray-600">
                      You will be redirected to VNPay to complete your payment securely.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-semibold"
                >
                  {isProcessing ? "Processing..." : "Complete Payment"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Plan:</span>
                    <span className="font-semibold text-gray-900">
                      {plans.find((p) => p.id === selectedPlan)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Duration:</span>
                    <span className="font-semibold text-gray-900">
                      {plans.find((p) => p.id === selectedPlan)?.duration}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {(plans.find((p) => p.id === selectedPlan)?.price || 0) / 1000}K VND
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Premium Features:</h4>
                  <ul className="space-y-2">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
