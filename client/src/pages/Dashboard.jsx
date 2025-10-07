import { useEffect, useState } from "react";
import WidgetCard from "../components/WidgetCard";
import ChartCard from "../components/ChartCard";
import Loading from "../components/Loading";
import axiosClient from "../api/axiosClient";

export default function Dashboard(){
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(()=> {
    (async ()=>{
      try{
        const latestRes = await axiosClient.get("/api/sensors/latest"); // adjust if your API differs
        const seriesRes = await axiosClient.get("/api/reports/timeseries", { params:{ metrics:"soil,temp,humid,light", limit:50 }});
        setLatest(latestRes.data);
        setSeries(seriesRes.data||[]);
      }catch(err){ console.error(err); }
      setLoading(false);
    })();
  },[]);

  if(loading) return <Loading />;

  const labels = series.map(r=> new Date(r.ts).toLocaleTimeString());
  const datasets = [
    { label:"Soil Moisture", data: series.map(r=>r.soil) },
    { label:"Temperature °C", data: series.map(r=>r.temp) },
    { label:"Humidity %", data: series.map(r=>r.humid) },
    { label:"Light (lux)", data: series.map(r=>r.light) },
  ];

  return (
    <div className="sf-grid sf-grid-3">
      <WidgetCard title="Soil Moisture" subtitle="current" right={<span className="sf-badge">sensor</span>}>
        <div style={{fontSize:28,fontWeight:700}}>{latest?.soil ?? "--"}%</div>
        <div className="sf-muted">Target: 35–55%</div>
      </WidgetCard>

      <WidgetCard title="Temperature" subtitle="current" right={<span className="sf-badge">°C</span>}>
        <div style={{fontSize:28,fontWeight:700}}>{latest?.temp ?? "--"}°C</div>
        <div className="sf-muted">Comfort: 22–28°C</div>
      </WidgetCard>

      <WidgetCard title="Humidity" subtitle="current" right={<span className="sf-badge">%RH</span>}>
        <div style={{fontSize:28,fontWeight:700}}>{latest?.humid ?? "--"}%</div>
        <div className="sf-muted">Comfort: 50–70%</div>
      </WidgetCard>

      <ChartCard title="Last readings" labels={labels} datasets={datasets} />
    </div>
  );
}
