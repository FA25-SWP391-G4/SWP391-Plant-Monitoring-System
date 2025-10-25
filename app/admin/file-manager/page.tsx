"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Leaf,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  ImageIcon,
  Video,
  Music,
  Package,
  FileText,
  Download,
  Folder,
  MoreVertical,
  Upload,
  Eye,
  Trash2,
} from "lucide-react"
import Link from "next/link"

export default function FileManagerPage() {
  const [darkMode, setDarkMode] = useState(false)

  const mediaTypes = [
    { name: "Images", icon: ImageIcon, files: 245, used: "17% Used", size: "26.40 GB", color: "emerald" },
    { name: "Videos", icon: Video, files: 245, used: "22% Used", size: "26.40 GB", color: "pink" },
    { name: "Audios", icon: Music, files: 850, used: "18.90 GB", size: "18.90 GB", color: "blue" },
    { name: "Apps", icon: Package, files: 1200, used: "45% Used", size: "85.30 GB", color: "orange" },
    { name: "Documents", icon: FileText, files: 78, used: "10% Used", size: "5.40 GB", color: "yellow" },
    { name: "Downloads", icon: Download, files: 245, used: "26.40 GB", size: "26.40 GB", color: "purple" },
  ]

  const folders = [
    { name: "Images", files: 365, size: "26.40 GB" },
    { name: "Documents", files: 130, size: "26.40 GB" },
    { name: "Apps", files: 180, size: "26.40 GB" },
    { name: "Downloads", files: 365, size: "26.40 GB" },
  ]

  const recentFiles = [
    { name: "Video_961954.mp4", category: "Video", size: "89 MB", date: "12 Jan, 2027" },
    { name: "Tmail.jpg", category: "Image", size: "5.4 MB", date: "10 Feb, 2027" },
    { name: "Document.pdf", category: "Document", size: "1.2 MB", date: "6 Mar, 2027" },
    { name: "Video_961954_0218.mp4", category: "Video", size: "689 MB", date: "27 Apr, 2027" },
    { name: "Mountain.png", category: "Image", size: "5.4 MB", date: "10 Feb, 2027" },
    { name: "CV.pdf", category: "Document", size: "12 MB", date: "17 Jan, 2027" },
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
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Upload className="size-4 mr-2" />
              Upload File
            </Button>
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
            <span>File Manager</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">File Manager</h1>
        </div>

        <div className="space-y-8">
          {/* All Media */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaTypes.map((type, index) => (
                <Card
                  key={index}
                  className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-${type.color}-50 dark:bg-${type.color}-900/20`}>
                        <type.icon className={`size-6 text-${type.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{type.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {type.files} files • {type.size}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* All Folders */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Folders</h2>
                <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">View All →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {folders.map((folder, index) => (
                  <Card
                    key={index}
                    className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Folder className="size-12 text-yellow-500" />
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="size-5 text-gray-500" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{folder.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {folder.files} Files • {folder.size}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Storage Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Storage Details</h2>
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative size-48">
                    <svg className="size-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">Total 160 GB</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">160</div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">585 GB Free space left</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300">Downloads</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-orange-500" />
                      <span className="text-gray-700 dark:text-gray-300">Apps</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-yellow-500" />
                      <span className="text-gray-700 dark:text-gray-300">Documents</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-emerald-500" />
                      <span className="text-gray-700 dark:text-gray-300">Media</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Files */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Files</h2>
              <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">View All →</button>
            </div>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">File Name</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Size</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Date Modified</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.map((file, index) => (
                      <tr
                        key={index}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <FileText className="size-5 text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm">
                            {file.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{file.size}</td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{file.date}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all">
                              <Eye className="size-4 text-gray-500" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all">
                              <Trash2 className="size-4 text-gray-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
