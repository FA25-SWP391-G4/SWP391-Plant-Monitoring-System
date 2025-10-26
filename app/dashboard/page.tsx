"use client"

import { useUser } from "@/app/context/user-context"  
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/user-dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
