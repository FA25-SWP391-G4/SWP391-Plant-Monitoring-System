"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export default function PricingPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    const savedPlans = localStorage.getItem("pricingPlans");
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    } else {
      const defaultPlans: PricingPlan[] = [
        {
          name: "Starter",
          price: 9,
          description: "Perfect for beginners",
          features: [
            "Up to 5 plants",
            "Basic care reminders",
            "Plant identification",
            "Email support",
          ],
        },
        {
          name: "Pro",
          price: 19,
          description: "For serious plant lovers",
          features: [
            "Unlimited plants",
            "Advanced care schedules",
            "Disease detection",
            "Priority support",
            "Custom care plans",
          ],
          popular: true,
        },
        {
          name: "Expert",
          price: 39,
          description: "For professional growers",
          features: [
            "Everything in Pro",
            "AI-powered insights",
            "Growth tracking",
            "Expert consultation",
            "API access",
            "Team collaboration",
          ],
        },
      ];
      setPlans(defaultPlans);
    }
  }, []);

  const handlePriceChange = (index: number, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      const updatedPlans = [...plans];
      updatedPlans[index].price = price;
      setPlans(updatedPlans);
    }
  };

  const handleSave = () => {
    localStorage.setItem("pricingPlans", JSON.stringify(plans));
    toast({
      title: "Pricing Updated",
      description: "Your pricing changes have been saved successfully.",
    });
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage pricing and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Management</CardTitle>
          <CardDescription>Update pricing for each plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className="p-4 border border-border rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={`price-${index}`}>Monthly Price (USD)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    min="0"
                    step="1"
                    value={plan.price}
                    onChange={(e) =>
                      handlePriceChange(index, e.target.value)
                    }
                    className="max-w-[120px]"
                  />
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Total Users</span>
            <span className="font-semibold">1,234</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Active Plants</span>
            <span className="font-semibold">15,678</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">System Status</span>
            <span className="font-semibold text-primary">Operational</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
