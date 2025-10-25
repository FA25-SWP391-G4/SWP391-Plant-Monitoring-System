"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export function LogoutConfirmation() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    // Simulate logout process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("User logged out")

    // Redirect to login page
    router.push("/login")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-3 bg-destructive/10 rounded-full">
            <LogOut className="w-6 h-6 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-xl">Sign Out</CardTitle>
        <CardDescription className="text-muted-foreground">
          Are you sure you want to sign out of your PlantSmart account?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleLogout}
            className="w-full h-11 text-base font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                Signing Out...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Yes, Sign Out
              </div>
            )}
          </Button>

          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full h-11 text-base font-medium bg-transparent"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Your plant care data will be saved and available when you sign back in
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
