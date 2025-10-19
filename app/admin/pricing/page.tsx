"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Leaf, Bell, Search, Moon, Sun, ChevronDown } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly")

  const pricingPlans1 = [
    {
      name: "Starter",
      price: billingCycle === "monthly" ? 5.0 : 50.0,
      originalPrice: billingCycle === "monthly" ? 12.0 : 120.0,
      description: "For solo designers & freelancers",
      features: [
        "5 websites",
        "500 MB Storage",
        "Unlimited Sub-Domain",
        "3 Custom Domain",
        "Free SSL Certificate",
        "Unlimited Traffic",
      ],
      highlighted: false,
    },
    {
      name: "Medium",
      price: billingCycle === "monthly" ? 10.99 : 109.9,
      originalPrice: billingCycle === "monthly" ? 30.0 : 300.0,
      description: "For working on commercial projects",
      features: [
        "10 websites",
        "1 GB Storage",
        "Unlimited Sub-Domain",
        "5 Custom Domain",
        "Free SSL Certificate",
        "Unlimited Traffic",
      ],
      highlighted: true,
    },
    {
      name: "Large",
      price: billingCycle === "monthly" ? 15.0 : 150.0,
      originalPrice: billingCycle === "monthly" ? 59.0 : 590.0,
      description: "For teams larger than 5 members",
      features: [
        "15 websites",
        "10 GB Storage",
        "Unlimited Sub-Domain",
        "10 Custom Domain",
        "Free SSL Certificate",
        "Unlimited Traffic",
      ],
      highlighted: false,
    },
  ]

  const pricingPlans2 = [
    {
      name: "Personal",
      price: 59.0,
      period: "Lifetime",
      description: "For solo designers & freelancers",
      features: [
        "5 websites",
        "500 MB Storage",
        "Unlimited Sub-Domain",
        "4 Custom Domain",
        "Free SSL Certificate",
        "Unlimited Traffic",
      ],
      icon: "👤",
    },
    {
      name: "Professional",
      price: 199.0,
      period: "Lifetime",
      description: "For working on commercial projects",
      features: [
        "10 websites",
        "1 GB Storage",
        "Unlimited Sub-Domain",
        "5 Custom Domain",
        "Free SSL Certificate",
        "Unlimited Traffic",
      ],
      icon: "💼",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: 599.0,
      period: "Lifetime",
      description: "For teams larger than 5 members",
      features: [
        "15 websites",
        "10GB Storage",
        "Unlimited Sub-Domain",
        "10 Custom Domain",
        "Free SSL Certificate",
        "Unlimited Traffic",
      ],
      icon: "⭐",
    },
  ]

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="size-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Leaf className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PlantSmart</span>
          </Link>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search or type command..."
                className="w-full pl-10 pr-16 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              {darkMode ? <Sun className="size-5 text-gray-300" /> : <Moon className="size-5 text-gray-600" />}
            </button>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
              <Bell className="size-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="size-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                M
              </div>
              <ChevronDown className="size-4 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/admin" className="hover:text-emerald-600">
              Home
            </Link>
            <span>/</span>
            <span>Pricing Tables</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pricing Tables</h1>
        </div>

        <div className="space-y-12">
          {/* Pricing Table 1 */}
          <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Flexible Plans Tailored to Fit
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Your Unique Needs!</p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annually")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingCycle === "annually"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Annually
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingPlans1.map((plan, index) => (
                <Card
                  key={index}
                  className={`p-6 transition-all duration-300 hover:scale-105 ${
                    plan.highlighted
                      ? "bg-gray-900 dark:bg-gray-700 text-white border-2 border-emerald-500"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <h3
                    className={`text-xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}
                      >
                        ${plan.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-sm ${plan.highlighted ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    <div
                      className={`text-sm line-through ${plan.highlighted ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      ${plan.originalPrice.toFixed(2)}
                    </div>
                  </div>
                  <p
                    className={`text-sm mb-6 ${plan.highlighted ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className={`size-5 ${plan.highlighted ? "text-emerald-400" : "text-emerald-600"}`} />
                        <span
                          className={`text-sm ${plan.highlighted ? "text-gray-200" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white"
                    } transition-all duration-300`}
                  >
                    Choose Starter
                  </Button>
                </Card>
              ))}
            </div>
          </Card>

          {/* Pricing Table 2 */}
          <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Pricing Table 2</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingPlans2.map((plan, index) => (
                <Card
                  key={index}
                  className={`p-6 transition-all duration-300 hover:scale-105 ${
                    plan.highlighted
                      ? "border-2 border-emerald-500 bg-white dark:bg-gray-800"
                      : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{plan.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/ {plan.period}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="size-5 text-emerald-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800"
                    } text-white transition-all duration-300`}
                  >
                    Choose Plan
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
