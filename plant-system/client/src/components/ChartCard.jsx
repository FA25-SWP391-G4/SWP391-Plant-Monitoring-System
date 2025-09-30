import WidgetCard from "./WidgetCard";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

export default function ChartCard({ title, labels, datasets, right }) {
  const data = { labels, datasets: datasets.map(ds => ({ ...ds, borderWidth:2, fill:false })) };
  return (
    <WidgetCard title={title} right={right}>
      <div style={{height:340}}>
        <Line data={data} options={{ responsive:true, maintainAspectRatio:false }} />
      </div>
    </WidgetCard>
  );
}
