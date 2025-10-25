"use client"

import { Button } from "@/components/ui/button"
import { Leaf, Droplets, Sun, Heart, Smartphone, Brain, Wifi, Menu, X, Star } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const features = [
  {
    id: "auto-watering",
    icon: Droplets,
    title: "Smart Watering",
    description:
      "Automated watering system that delivers the perfect amount of water based on soil moisture, plant type, and environmental conditions.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "light-monitoring",
    icon: Sun,
    title: "Light Optimization",
    description:
      "Advanced light sensors monitor and optimize lighting conditions, ensuring your plants receive the ideal spectrum and intensity.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "health-alerts",
    icon: Heart,
    title: "Health Alerts",
    description:
      "Instant notifications about plant health issues, diseases, or care requirements sent directly to your smartphone.",
    color: "from-red-500 to-pink-500",
  },
  {
    id: "mobile-app",
    icon: Smartphone,
    title: "Mobile Dashboard",
    description:
      "Complete plant management from your phone with real-time monitoring, care schedules, and growth tracking.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "ai-recommendations",
    icon: Brain,
    title: "AI Plant Doctor",
    description:
      "Machine learning algorithms analyze your plant data to provide personalized care recommendations and predict potential issues.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "smart-sensors",
    icon: Wifi,
    title: "IoT Sensors",
    description:
      "Network of wireless sensors monitoring temperature, humidity, soil pH, and nutrients for comprehensive plant care.",
    color: "from-gray-500 to-slate-500",
  },
]

const testimonials = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    location: "San Francisco, CA",
    avatar: "👩🏻‍💼",
    rating: 5,
    text: "PlantSmart completely transformed my plant care routine. I used to kill every plant I touched, but now my apartment is a thriving jungle! The AI recommendations are incredibly accurate.",
    plants: "12 plants thriving",
  },
  {
    id: "marcus-rodriguez",
    name: "Marcus Rodriguez",
    location: "Austin, TX",
    avatar: "👨🏽‍🎨",
    rating: 5,
    text: "As a busy entrepreneur, I never had time for proper plant care. The automated watering system is a game-changer. My plants have never looked better, and I get peace of mind.",
    plants: "8 plants saved",
  },
  {
    id: "emily-watson",
    name: "Emily Watson",
    location: "Portland, OR",
    avatar: "👩🏼‍🌾",
    rating: 5,
    text: "The health alerts saved my fiddle leaf fig from a pest infestation I never would have caught early. The mobile app makes monitoring so convenient and actually fun!",
    plants: "15 plants monitored",
  },
  {
    id: "david-kim",
    name: "David Kim",
    location: "Seattle, WA",
    avatar: "👨🏻‍💻",
    rating: 5,
    text: "I love the data-driven approach to plant care. The sensors provide detailed insights that help me understand exactly what each plant needs. It's like having a botanist in my pocket.",
    plants: "20 plants optimized",
  },
  {
    id: "lisa-martinez",
    name: "Lisa Martinez",
    location: "Miami, FL",
    avatar: "👩🏽‍🏫",
    rating: 5,
    text: "My students are amazed by my classroom garden now. PlantSmart helps me maintain dozens of plants effortlessly, and it's become a great teaching tool for technology and biology.",
    plants: "25+ plants teaching",
  },
  {
    id: "james-thompson",
    name: "James Thompson",
    location: "Denver, CO",
    avatar: "👨🏻‍🔬",
    rating: 5,
    text: "The light optimization feature is brilliant. My plants are getting exactly the right spectrum and intensity. I've seen dramatic improvements in growth and flowering since switching.",
    plants: "18 plants flourishing",
  },
]

const floatingIcons = [
  { icon: Droplets, color: "text-blue-500", position: { top: "20%", left: "10%" } },
  { icon: Sun, color: "text-yellow-500", position: { top: "30%", right: "15%" } },
  { icon: Heart, color: "text-red-500", position: { top: "60%", left: "8%" } },
  { icon: Smartphone, color: "text-emerald-500", position: { top: "70%", right: "10%" } },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Benefits", href: "#benefits" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#contact" },
  ]

  const scrollToSection = (href: string) => {
    if (!mounted) return

    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-lg">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              <Leaf className="h-8 w-8 text-emerald-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">PlantSmart</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <ul className="flex items-center space-x-8">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-700 hover:text-emerald-600 font-medium transition-all duration-300 relative group"
                    >
                      <span>{link.name}</span>
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center space-x-4 ml-8">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-all duration-300 hover:scale-105"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100 backdrop-blur-md">
              <ul className="space-y-4 pt-4">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="block w-full text-left text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-all duration-300 py-2 px-3 rounded-lg"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col space-y-3 mt-6">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full text-center text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden flex items-center pt-20">
        {floatingIcons.map((item, index) => (
          <div
            key={index}
            className={`absolute hidden lg:block ${item.color} opacity-10 animate-float`}
            style={{
              ...item.position,
              animationDelay: `${index * 0.2}s`,
            }}
          >
            <item.icon className="h-12 w-12" />
          </div>
        ))}

        <div className="container mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6 transition-transform duration-300 hover:scale-105">
                <span>🌱 Smart Plant Care Revolution</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                <span>Never Kill</span>
                <br />
                <span className="text-emerald-600">Another Plant</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your home into a thriving garden with AI-powered plant monitoring. Get real-time alerts,
                automated watering, and expert care recommendations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-2xl">
                    Start Free Trial
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-emerald-600 hover:text-emerald-600 transition-all duration-300 transform hover:scale-105 bg-transparent shadow-lg hover:shadow-xl"
                >
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center mt-8 space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <span>✓ 14-day free trial</span>
                </div>
                <div className="flex items-center">
                  <span>✓ No credit card required</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg animate-float backdrop-blur-md">
                  <div className="text-6xl mb-4 text-center">🌿</div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Monstera Deliciosa</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Moisture</span>
                      <span className="text-emerald-600 font-semibold">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Light</span>
                      <span className="text-yellow-600 font-semibold">Perfect</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Health</span>
                      <span className="text-green-600 font-semibold">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6 transition-transform duration-300 hover:scale-105">
              <span> Advanced Features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              <span>Everything You Need for</span>
              <br />
              <span className="text-emerald-600">Perfect Plant Care</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive smart plant management system combines cutting-edge technology with intuitive design to
              make plant care effortless and enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 cursor-pointer"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                <div className="flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700 transition-all duration-300 cursor-pointer">
                  <span>Learn more</span>
                  <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-all duration-300`}
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-12 shadow-lg hover:shadow-2xl transition-all duration-300">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Experience Smart Plant Care?</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join over 10,000 happy plant parents who have revolutionized their gardening with our intelligent
                system.
              </p>
              <Link href="/register">
                <Button className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all duration-300 shadow-2xl hover:shadow-2xl hover:scale-105">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-emerald-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6 transition-transform duration-300 hover:scale-105">
              <span>💚 Customer Stories</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              <span>Loved by Plant Parents</span>
              <br />
              <span className="text-emerald-600">Everywhere</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how PlantSmart has transformed the lives of thousands of plant enthusiasts around the world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{testimonial.text}</p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">{testimonial.plants}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
                <Leaf className="h-8 w-8 text-emerald-500 mr-2" />
                <span className="text-2xl font-bold">PlantSmart</span>
              </div>
              <p className="text-gray-400">AI-powered plant care for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PlantSmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
