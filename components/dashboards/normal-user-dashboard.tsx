"use client"

import { useState } from "react"
import { useUser } from "@/app/context/user-context"
import {
  Leaf,
  Droplets,
  Settings,
  Zap,
  Bell,
  BarChart3,
  Lock,
  User,
  Grape as Upgrade,
  ChevronRight,
  Gauge,
  Clock,
  AlertCircle,
  CheckCircle,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NormalUserDashboard() {
  const { user, logout } = useUser()
  const [activeTab, setActiveTab] = useState("overview")
  const [autoWateringEnabled, setAutoWateringEnabled] = useState(false)
  const [wateringSchedule, setWateringSchedule] = useState("every-2-days")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const plants = [
    {
      id: 1,
      name: "Monstera Deliciosa",
      type: "Swiss Cheese Plant",
      moisture: 72,
      light: 85,
      health: 92,
      lastWatered: "2 days ago",
      nextWatering: "in 2 days",
    },
    {
      id: 2,
      name: "Pothos",
      type: "Devil's Ivy",
      moisture: 65,
      light: 70,
      health: 88,
      lastWatered: "3 days ago",
      nextWatering: "in 1 day",
    },
    {
      id: 3,
      name: "Snake Plant",
      type: "Sansevieria",
      moisture: 45,
      light: 60,
      health: 95,
      lastWatered: "1 week ago",
      nextWatering: "in 5 days",
    },
  ]

  const wateringHistory = [
    { date: "Today", time: "08:30 AM", amount: "250ml", type: "auto" },
    { date: "Yesterday", time: "06:45 PM", amount: "180ml", type: "manual" },
    { date: "Yesterday", time: "08:30 AM", amount: "250ml", type: "auto" },
  ]

  const notifications = [
    {
      id: 1,
      title: "Watering Complete",
      message: "Your plant was watered successfully (250ml)",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      title: "Low Moisture Alert",
      message: "Soil moisture is below threshold (25%)",
      time: "5 hours ago",
      type: "warning",
    },
    { id: 3, title: "System Online", message: "All sensors are functioning normally", time: "1 day ago", type: "info" },
  ]

  const features = [
    {
      id: "monitoring",
      icon: BarChart3,
      title: "Plant Monitoring",
      description: "View real-time sensor data and plant health status",
      action: "View Dashboard",
      color: "from-emerald-500 to-teal-500",
      status: "Active",
    },
    {
      id: "manual-watering",
      icon: Droplets,
      title: "Manual Watering",
      description: "Instantly water your plants with one tap",
      action: "Water Now",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "auto-schedule",
      icon: Clock,
      title: "Auto-Watering Schedule",
      description: "Configure automatic watering times and intervals",
      action: "Configure",
      color: "from-violet-500 to-purple-500",
    },
    {
      id: "auto-mode",
      icon: Zap,
      title: "Auto-Watering Mode",
      description: "Toggle intelligent automatic watering system",
      action: "Toggle",
      color: "from-amber-500 to-orange-500",
      status: "Enabled",
    },
    {
      id: "history",
      icon: BarChart3,
      title: "Watering History",
      description: "View complete history of all watering activities",
      action: "View History",
      color: "from-indigo-500 to-blue-500",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Manage real-time alerts and reminders",
      action: "Manage",
      color: "from-pink-500 to-rose-500",
    },
  ]

  const settings = [
    {
      id: "profile",
      icon: User,
      title: "Manage Profile",
      description: "Update your personal information and preferences",
      action: "Edit Profile",
      color: "from-slate-500 to-gray-500",
    },
    {
      id: "change-password",
      icon: Lock,
      title: "Change Password",
      description: "Update your account password for security",
      action: "Change",
      color: "from-cyan-500 to-teal-500",
    },
    {
      id: "reset-password",
      icon: AlertCircle,
      title: "Reset Password",
      description: "Reset your password via email verification",
      action: "Reset",
      color: "from-red-500 to-rose-500",
    },
    {
      id: "settings",
      icon: Settings,
      title: "Settings",
      description: "Configure app preferences and system settings",
      action: "Configure",
      color: "from-neutral-500 to-stone-500",
    },
  ]
interface Feature {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  status?: string;
  action?: string;
}
  const FeatureCard = ({ feature, index }: { feature: Feature; index?: number }) => (
    <div
      key={feature.id}
      className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}
        >
          <feature.icon className="w-6 h-6 text-white" />
        </div>
        {feature.status && (
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${feature.status === "Active" || feature.status === "Enabled" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
          >
            {feature.status}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
      <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 group-hover:gap-3 transition-all">
        <span>{feature.action}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">PlantSmart</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Smart Plant Care System</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">Free Account</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">Free Account</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            <span>Welcome back, </span>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {user?.name?.split(" ")[0]}
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600">Manage your plant care with ease</p>
        </div>

        {/* Upgrade Banner */}
        <div className="mb-8 sm:mb-12 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Upgrade className="w-6 h-6 text-yellow-300" />
                <h3 className="text-xl sm:text-2xl font-bold text-white">Upgrade to Premium</h3>
              </div>
              <p className="text-sm sm:text-base text-emerald-50 mb-4 leading-relaxed">
                Unlock advanced features: Multi-zone management, AI chatbot assistant, detailed analytics, and priority
                support
              </p>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-emerald-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Unlimited zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Priority Support</span>
                </div>
              </div>
            </div>
            <Link href="/payment">
              <button className="whitespace-nowrap px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 text-emerald-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
                <Upgrade className="w-5 h-5" />
                <span>Upgrade Now</span>
              </button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {[
            { icon: Droplets, label: "Today's Watering", value: "250ml", color: "from-blue-500 to-cyan-500" },
            { icon: Gauge, label: "Soil Moisture", value: "67%", color: "from-emerald-500 to-teal-500" },
            { icon: Clock, label: "Next Watering", value: "2h 15m", color: "from-violet-500 to-purple-500" },
            { icon: BarChart3, label: "System Status", value: "Active", color: "from-amber-500 to-orange-500" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "features", label: "Features" },
            { id: "history", label: "History" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Your Plants</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {plants.map((plant) => (
                  <Card
                    key={plant.id}
                    className="hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-1"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{plant.name}</CardTitle>
                      <p className="text-sm text-gray-500">{plant.type}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {[
                          { label: "Moisture", value: plant.moisture, color: "from-blue-400 to-cyan-500" },
                          { label: "Light", value: plant.light, color: "from-yellow-400 to-orange-500" },
                          { label: "Health", value: plant.health, color: "from-green-400 to-emerald-500" },
                        ].map((metric) => (
                          <div key={metric.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">{metric.label}</span>
                              <span className="font-semibold text-emerald-600">{metric.value}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`bg-gradient-to-r ${metric.color} h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${metric.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-gray-100 text-sm text-gray-600">
                        <p>Last watered: {plant.lastWatered}</p>
                        <p>Next watering: {plant.nextWatering}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Plant Care Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {features.map((feature, idx) => (
                  <FeatureCard key={feature.id} feature={feature} index={idx} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Account Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {settings.map((setting, idx) => (
                  <FeatureCard key={setting.id} feature={setting} index={idx} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6 sm:space-y-8">
            <Card className="border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Watering</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wateringHistory.map((record, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${record.type === "auto" ? "bg-emerald-100" : "bg-blue-100"}`}
                        >
                          <Droplets
                            className={`w-5 h-5 ${record.type === "auto" ? "text-emerald-600" : "text-blue-600"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.date}</p>
                          <p className="text-sm text-gray-600">{record.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{record.amount}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${record.type === "auto" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          {record.type === "auto" ? "Auto" : "Manual"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border-l-4 transition-all duration-300 hover:shadow-md ${
                      notif.type === "warning"
                        ? "bg-yellow-50 border-yellow-400"
                        : notif.type === "success"
                          ? "bg-green-50 border-green-400"
                          : "bg-blue-50 border-blue-400"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-900 font-medium">{notif.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Manage Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Update Profile</Button>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Change Password</Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upgrade className="w-5 h-5 text-emerald-600" />
                  Upgrade to Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Unlock advanced features including multiple plant zones, detailed reports, AI chatbot, and more!
                </p>
                <Link href="/payment">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Upgrade Now</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
