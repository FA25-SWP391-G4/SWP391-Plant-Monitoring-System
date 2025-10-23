import { Sprout, Droplets, Activity, Shield } from "lucide-react";

const features = [
  {
    icon: <Sprout className="h-6 w-6 text-green-600" />,
    title: "Real-time Monitor",
    desc: "Soil moisture, temp, humidity — live telemetry from your garden.",
  },
  {
    icon: <Droplets className="h-6 w-6 text-green-600" />,
    title: "Auto Watering",
    desc: "Smart schedules and thresholds to save up to 30% water.",
  },
  {
    icon: <Activity className="h-6 w-6 text-green-600" />,
    title: "Insights",
    desc: "Trends, alerts and care suggestions for each plant.",
  },
  {
    icon: <Shield className="h-6 w-6 text-green-600" />,
    title: "Secure",
    desc: "Role-based access and encrypted device channels.",
  },
];

export default function FeatureGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f, i) => (
        <div key={i} className="rounded-2xl border p-6 hover:shadow-sm transition bg-background/60 backdrop-blur">
          <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-green-600/10 p-3">
            {f.icon}
          </div>
          <div className="font-semibold">{f.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
