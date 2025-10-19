"use client"

type SubmenuItem = {
  id: string;
  label: string;
  href?: string;
};

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  hasSubmenu: boolean;
  href?: string;
  badge?: string;
  submenu?: SubmenuItem[];
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

import { menuStructure } from "@/app/data/menuStructure";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Leaf,
  Users,
  Activity,
  Bell,
  Search,
  MoreVertical,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Menu,
  ChevronDown,
  LayoutDashboard,
  Bot,
  ShoppingCart,
  Calendar,
  UserCircle,
  CheckSquare,
  FileText,
  Table,
  FileStack,
  MessageSquare,
  Headphones,
  Mail,
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Customers",
    value: "3,782",
    change: "+11.01%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Orders",
    value: "5,359",
    change: "-9.05%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    title: "Plants Monitored",
    value: "48,392",
    change: "+8.2%",
    trend: "up",
    icon: Leaf,
  },
  {
    title: "System Health",
    value: "99.8%",
    change: "+0.2%",
    trend: "up",
    icon: Activity,
  },
]

const recentUsers = [
  { id: 1, name: "Sarah Chen", email: "sarah@example.com", plants: 12, status: "active", joined: "2 days ago" },
  { id: 2, name: "Marcus Rodriguez", email: "marcus@example.com", plants: 8, status: "active", joined: "3 days ago" },
  { id: 3, name: "Emily Watson", email: "emily@example.com", plants: 15, status: "active", joined: "5 days ago" },
  { id: 4, name: "David Kim", email: "david@example.com", plants: 20, status: "active", joined: "1 week ago" },
  { id: 5, name: "Lisa Martinez", email: "lisa@example.com", plants: 25, status: "active", joined: "1 week ago" },
]

const recentAlerts = [
  {
    id: 1,
    plant: "Monstera Deliciosa",
    user: "Sarah Chen",
    type: "Low Moisture",
    severity: "warning",
    time: "5 min ago",
  },
  {
    id: 2,
    plant: "Fiddle Leaf Fig",
    user: "Marcus Rodriguez",
    type: "Pest Detection",
    severity: "critical",
    time: "15 min ago",
  },
  {
    id: 3,
    plant: "Snake Plant",
    user: "Emily Watson",
    type: "Low Light",
    severity: "info",
    time: "1 hour ago",
  },
  {
    id: 4,
    plant: "Pothos",
    user: "David Kim",
    type: "Temperature Alert",
    severity: "warning",
    time: "2 hours ago",
  },
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["dashboard"])
  const [darkMode, setDarkMode] = useState(false)

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]))
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              <Menu className="size-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search or type command..."
                className="w-full pl-10 pr-16 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              {darkMode ? (
                <Sun className="size-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="size-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
              <Bell className="size-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="size-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform duration-300">
                M
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Musharof</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
              </div>
              <ChevronDown className="size-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out overflow-y-auto`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Leaf className="size-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PlantSmart</span>
            </Link>
          </div>

          <nav className="p-4">
            {menuStructure.map((section) => (
              <div key={section.section} className="mb-6">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                  {section.section}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.id}>
                      {item.href && !item.hasSubmenu ? (
                        <Link
                          href={item.href}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            activeTab === item.id
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => {
                            setActiveTab(item.id)
                            setSidebarOpen(false)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="size-5" />
                            <span className="font-medium text-sm">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            if (item.hasSubmenu) {
                              toggleMenu(item.id)
                            } else {
                              setActiveTab(item.id)
                              setSidebarOpen(false)
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            activeTab === item.id || expandedMenus.includes(item.id)
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="size-5" />
                            <span className="font-medium text-sm">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.hasSubmenu && (
                            <ChevronDown
                              className={`size-4 transition-transform duration-200 ${
                                expandedMenus.includes(item.id) ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                      )}
                      {item.hasSubmenu && expandedMenus.includes(item.id) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu?.map((subitem) => (
                            <div key={subitem.id}>
                              {subitem.href ? (
                                <Link
                                  href={subitem.href}
                                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    activeTab === subitem.id
                                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }`}
                                  onClick={() => {
                                    setActiveTab(subitem.id)
                                    setSidebarOpen(false)
                                  }}
                                >
                                  {subitem.label}
                                </Link>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveTab(subitem.id)
                                    setSidebarOpen(false)
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    activeTab === subitem.id
                                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  {subitem.label}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back! Here's what's happening with PlantSmart today.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    className="p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                        <stat.icon className="size-6 text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        <TrendingUp className={`size-4 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                        {stat.change}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Sales</h2>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300">
                    <MoreVertical className="size-5 text-gray-500" />
                  </button>
                </div>
                <div className="h-64 flex items-center justify-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg">
                  <div className="text-center">
                    <Activity className="size-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">Chart visualization area</p>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Users</h2>
                    <Button
                      variant="ghost"
                      className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {recentUsers.slice(0, 4).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-600">{user.plants} plants</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{user.joined}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Alerts */}
                <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Alerts</h2>
                    <Button
                      variant="ghost"
                      className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer"
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            alert.severity === "critical"
                              ? "bg-red-50 dark:bg-red-900/20"
                              : alert.severity === "warning"
                                ? "bg-yellow-50 dark:bg-yellow-900/20"
                                : "bg-blue-50 dark:bg-blue-900/20"
                          }`}
                        >
                          {alert.severity === "critical" ? (
                            <AlertTriangle className="size-5 text-red-600" />
                          ) : alert.severity === "warning" ? (
                            <AlertTriangle className="size-5 text-yellow-600" />
                          ) : (
                            <CheckCircle className="size-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{alert.type}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {alert.plant} - {alert.user}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{alert.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
                  <p className="text-gray-600 dark:text-gray-400">Manage all PlantSmart users and their accounts.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 shadow-theme-md hover:shadow-theme-lg hover:scale-105">
                  <Users className="size-5 mr-2" />
                  Add User
                </Button>
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">User</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Plants</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform duration-300">
                                {user.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                              {user.plants} plants
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full text-sm font-medium">
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.joined}</td>
                          <td className="py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                            >
                              <MoreVertical className="size-4 text-gray-500 dark:text-gray-400" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "plants" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Plant Monitoring</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Overview of all plants being monitored across the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-5xl mb-4">🌿</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">48,392</div>
                    <div className="text-gray-600 dark:text-gray-400">Total Plants</div>
                  </div>
                </Card>
                <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-5xl mb-4">💚</div>
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400 mb-2">45,821</div>
                    <div className="text-gray-600 dark:text-gray-400">Healthy Plants</div>
                  </div>
                </Card>
                <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <div className="text-2xl font-bold text-warning-600 dark:text-warning-400 mb-2">2,571</div>
                    <div className="text-gray-600 dark:text-gray-400">Need Attention</div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Alerts</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor and manage all system alerts and notifications.
                </p>
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            alert.severity === "critical"
                              ? "bg-error-50 dark:bg-error-900/20"
                              : alert.severity === "warning"
                                ? "bg-warning-50 dark:bg-warning-900/20"
                                : "bg-blue-50 dark:bg-blue-900/20"
                          }`}
                        >
                          {alert.severity === "critical" ? (
                            <AlertTriangle className="size-6 text-error-600 dark:text-error-400" />
                          ) : alert.severity === "warning" ? (
                            <AlertTriangle className="size-6 text-warning-600 dark:text-warning-400" />
                          ) : (
                            <CheckCircle className="size-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-lg">{alert.type}</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {alert.plant} - {alert.user}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">{alert.time}</div>
                        </div>
                      </div>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 hover:scale-105 shadow-theme-sm">
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">Configure and manage system-wide settings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        System Name
                      </label>
                      <input
                        type="text"
                        defaultValue="PlantSmart"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        defaultValue="admin@plantsmart.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
                      <input type="checkbox" defaultChecked className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">SMS Alerts</span>
                      <input type="checkbox" defaultChecked className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
                      <input type="checkbox" defaultChecked className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 shadow-theme-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Save Changes</h3>
                    <p className="text-gray-600 dark:text-gray-400">Update your system settings</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 shadow-theme-md hover:shadow-theme-lg hover:scale-105 px-8">
                    Save Settings
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Invoices</h1>
                  <p className="text-gray-600 dark:text-gray-400">View and manage all invoices.</p>
                </div>
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Invoice ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Amount</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Date</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for invoices data */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                        <td className="py-4 px-4">#12345</td>
                        <td className="py-4 px-4">$150.00</td>
                        <td className="py-4 px-4">2023-10-01</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full text-sm font-medium">
                            Paid
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                          >
                            <MoreVertical className="size-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "file-manager" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">File Manager</h1>
                  <p className="text-gray-600 dark:text-gray-400">Manage all files and documents.</p>
                </div>
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">File Name</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Size</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">
                          Date Modified
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for file manager data */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                        <td className="py-4 px-4">document.pdf</td>
                        <td className="py-4 px-4">2MB</td>
                        <td className="py-4 px-4">2023-10-01</td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                          >
                            <MoreVertical className="size-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pricing Tables</h1>
                  <p className="text-gray-600 dark:text-gray-400">View and manage pricing tables.</p>
                </div>
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800 shadow-theme-sm border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Plan</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Price</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Features</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for pricing data */}
                      <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                        <td className="py-4 px-4">Basic Plan</td>
                        <td className="py-4 px-4">$9.99</td>
                        <td className="py-4 px-4">
                          <ul className="list-disc pl-6">
                            <li>Up to 10 plants</li>
                            <li>Basic monitoring features</li>
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>    

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
