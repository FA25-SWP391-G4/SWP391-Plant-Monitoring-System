"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "normal" | "premium"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  subscriptionStatus: "active" | "expired" | "none"
  subscriptionEndDate?: string
  createdAt: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  upgradeToPremiun: (endDate: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading user from localStorage or API
    const storedUser = localStorage.getItem("plantsmart_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const upgradeToPremiun = (endDate: string) => {
    if (user) {
      const updatedUser = {
        ...user,
        role: "premium" as UserRole,
        subscriptionStatus: "active" as const,
        subscriptionEndDate: endDate,
      }
      setUser(updatedUser)
      localStorage.setItem("plantsmart_user", JSON.stringify(updatedUser))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("plantsmart_user")
  }

  return (
    <UserContext.Provider value={{ user, isLoading, setUser, upgradeToPremiun, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
