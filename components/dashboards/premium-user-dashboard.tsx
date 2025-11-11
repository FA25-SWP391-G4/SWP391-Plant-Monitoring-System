"use client"

import { useState } from "react"
import { useUser } from "@/app/context/user-context"
import {
  Leaf,
  Settings,
  LogOut,
  Zap,
  BarChart3,
  Lock,
  User,
  Bone as Zones,
  Brain,
  TrendingUp,
  Download,
  Menu,
  Home,
  Sliders,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PremiumUserDashboard() {
  const { user, logout } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["premium-features"])
  const [selectedZone, setSelectedZone] = useState("zone-1")

  const zones = [
    {
      id: "zone-1",
      name: "Living Room",
      plants: 3,
      avgHealth: 92,
      temperature: 22,
      humidity: 65,
    },
    {
      id: "zone-2",
      name: "Bedroom",
      plants: 2,
      avgHealth: 88,
      temperature: 20,
      humidity: 55,
    },
    {
      id: "zone-3",
      name: "Office",
      plants: 4,
      avgHealth: 85,
      temperature: 23,
      humidity: 60,
    },
  ]

  const plants = [
    {
      id: 1,
      name: "Monstera Deliciosa",
      type: "Swiss Cheese Plant",
      zone: "zone-1",
      moisture: 72,
      light: 85,
      health: 92,
      ph: 6.5,
      nitrogen: 45,
      potassium: 38,
    },
    {
      id: 2,
      name: "Pothos",
      type: "Devil's Ivy",
      zone: "zone-1",
      moisture: 65,
      light: 70,
      health: 88,
      ph: 6.2,
      nitrogen: 42,
      potassium: 35,
    },
    {
      id: 3,
      name: "Snake Plant",
      type: "Sansevieria",
      zone: "zone-2",
      moisture: 45,
      light: 60,
      health: 95,
      ph: 7.0,
      nitrogen: 38,
      potassium: 40,
    },
  ]

  const reports = [
    {
      id: 1,
      title: "Monthly Plant Health Report",
      date: "2025-01-20",
      plants: 9,
      avgHealth: 88,
    },
    {
      id: 2,
      title: "Zone Performance Analysis",
      date: "2025-01-15",
      zones: 3,
      efficiency: 92,
    },
    {
      id: 3,
      title: "Sensor Data Summary",
      date: "2025-01-10",
      readings: 1250,
      anomalies: 3,
    },
  ]

  const menuStructure = [
    {
      section: "CORE FEATURES",
      items: [
        { id: "overview", label: "Overview", icon: Home, hasSubmenu: false },
        { id: "monitoring", label: "Plant Monitoring", icon: BarChart3, hasSubmenu: false },
        { id: "watering", label: "Watering Control", icon: Zap, hasSubmenu: false },
        { id: "history", label: "Watering History", icon: TrendingUp, hasSubmenu: false },
        { id: "notifications", label: "Notifications", icon: MessageSquare, hasSubmenu: false },
      ],
    },
    {
      section: "PREMIUM FEATURES",
      items: [
        { id: "zones", label: "Plant Zones", icon: Zones, hasSubmenu: false },
        { id: "reports", label: "Detailed Reports", icon: BarChart3, hasSubmenu: false },
        { id: "sensors", label: "Sensor Config", icon: Sliders, hasSubmenu: false },
        { id: "customize", label: "Customize Dashboard", icon: Settings, hasSubmenu: false },
        { id: "chatbot", label: "AI Chatbot", icon: Brain, hasSubmenu: false },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        { id: "profile", label: "Manage Profile", icon: User, hasSubmenu: false },
        { id: "password", label: "Change Password", icon: Lock, hasSubmenu: false },
      ],
    },
  ]

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PlantSmart</h1>
                <p className="text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold">
                  Premium User
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-semibold">{user?.name?.charAt(0)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed top-[73px] bottom-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out overflow-y-auto`}
        >
          <nav className="p-4">
            {menuStructure.map((section) => (
              <div key={section.section} className="mb-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                  {section.section}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                        activeTab === item.id
                          ? "bg-emerald-50 text-emerald-600 shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-6 py-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Zones", value: zones.length, color: "from-emerald-500 to-teal-500" },
                  { label: "Total Plants", value: plants.length, color: "from-blue-500 to-cyan-500" },
                  { label: "Avg Health", value: "90%", color: "from-green-500 to-emerald-500" },
                  { label: "Premium Status", value: "Active", color: "from-purple-500 to-pink-500" },
                ].map((stat, idx) => (
                  <Card
                    key={idx}
                    className="border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="pt-6">
                      <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg mb-3 w-fit`}>
                        <div className="w-6 h-6 bg-white/20 rounded" />
                      </div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Plant Monitoring Tab */}
          {activeTab === "monitoring" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">Plant Monitoring</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plants.map((plant) => (
                  <Card
                    key={plant.id}
                    className="hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{plant.name}</CardTitle>
                      <p className="text-sm text-gray-500">{plant.type}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Plant Zones Tab */}
          {activeTab === "zones" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">Plant Zones</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {zones.map((zone) => (
                  <Card
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`cursor-pointer transition-all duration-300 border-2 ${
                      selectedZone === zone.id
                        ? "border-emerald-600 bg-emerald-50/50 shadow-lg"
                        : "border-gray-200 bg-white/90 hover:border-emerald-300"
                    }`}
                  >
                    <CardHeader>
                      <CardTitle>{zone.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Plants", value: zone.plants, color: "from-emerald-50 to-teal-50" },
                          { label: "Avg Health", value: `${zone.avgHealth}%`, color: "from-blue-50 to-cyan-50" },
                          { label: "Temp", value: `${zone.temperature}°C`, color: "from-orange-50 to-yellow-50" },
                          { label: "Humidity", value: `${zone.humidity}%`, color: "from-purple-50 to-pink-50" },
                        ].map((stat, idx) => (
                          <div key={idx} className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                            <p className="text-xs text-gray-600">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Detailed Reports</h2>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            <p className="text-sm text-gray-500">{report.date}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            View Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sensor Configuration Tab */}
          {activeTab === "sensors" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">Sensor Configuration</h2>
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Configure Advanced Sensor Thresholds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: "Moisture Threshold", min: 30, max: 80, unit: "%" },
                    { label: "Light Intensity", min: 200, max: 1000, unit: "lux" },
                    { label: "Temperature Range", min: 15, max: 30, unit: "°C" },
                    { label: "Humidity Level", min: 40, max: 80, unit: "%" },
                    { label: "pH Level", min: 5.5, max: 7.5, unit: "pH" },
                  ].map((sensor) => (
                    <div key={sensor.label} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">{sensor.label}</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="number"
                          defaultValue={sensor.min}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-gray-600">to</span>
                        <input
                          type="number"
                          defaultValue={sensor.max}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-gray-600 w-12">{sensor.unit}</span>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Save Thresholds</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Customize Dashboard Tab */}
          {activeTab === "customize" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">Customize Dashboard</h2>
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Choose which widgets to display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: "zones", name: "Zone Overview", enabled: true },
                    { id: "charts", name: "Analytics Charts", enabled: true },
                    { id: "reports", name: "Recent Reports", enabled: true },
                    { id: "calendar", name: "Schedule Calendar", enabled: false },
                    { id: "stats", name: "Quick Stats", enabled: true },
                    { id: "trends", name: "Trend Analysis", enabled: false },
                  ].map((widget) => (
                    <div
                      key={widget.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        widget.enabled ? "bg-emerald-50 border-emerald-500" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{widget.name}</span>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${widget.enabled ? "bg-emerald-600" : "bg-gray-300"}`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${widget.enabled ? "ml-6" : "ml-0.5"}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Save Preferences</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Chatbot Tab */}
          {activeTab === "chatbot" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">AI Plant Doctor</h2>
              <Card className="border-0 bg-white/90 backdrop-blur-sm h-96 flex flex-col">
                <CardContent className="flex-1 flex flex-col pt-6">
                  <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 mb-4 overflow-y-auto">
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 max-w-xs">
                        <p className="text-sm text-gray-700">
                          Hello! I'm your AI Plant Doctor. How can I help you with your plants today?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask me about your plants..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Send</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">Manage Profile</h2>
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Update Profile</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Change Password</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
