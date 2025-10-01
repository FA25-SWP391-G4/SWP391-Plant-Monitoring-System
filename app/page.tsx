import { Button } from "@/components/ui/button"
import { Leaf, Droplets, Sun, Heart, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/30">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">PlantSmart</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Benefits
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm font-medium bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Smart Plant Care Revolution</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight text-balance">
              Never Kill Another Plant
            </h2>

            <p className="text-xl text-muted-foreground leading-relaxed">
              AI-powered plant monitoring that tells you exactly when to water, fertilize, and care for your plants.
              Keep your green friends thriving with personalized insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base font-medium bg-primary hover:bg-primary/90 h-14 px-8 gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base font-medium h-14 px-8 bg-transparent">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Plants Monitored</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Survival Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <div className="relative">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-border/40 p-6 space-y-6">
              {/* Plant Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Monstera Deliciosa</h3>
                  <p className="text-sm text-muted-foreground">Living Room • Added 3 months ago</p>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground">Light</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">85%</div>
                  <div className="w-full bg-border/40 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>

                <div className="bg-background/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-muted-foreground">Water</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">62%</div>
                  <div className="w-full bg-border/40 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "62%" }} />
                  </div>
                </div>

                <div className="bg-background/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Health</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">92%</div>
                  <div className="w-full bg-border/40 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-primary/5 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Today's Recommendations</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Water in 2 days</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Move closer to window for better light</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Fertilize next week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
          </div>
        </div>
      </main>
    </div>
  )
}
