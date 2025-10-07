import { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Button, Card } from "react-bootstrap";
import dayjs from "dayjs";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import reportsApi from "../api/reportsApi";
import axiosClient from "../api/axiosClient";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

export default function Reports() {
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState("");
  const [from, setFrom] = useState(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [series, setSeries] = useState([]); // [{ts, soil, temp, humid, light}]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient.get("/zones").then(res=>{
      setZones(res.data||[]);
      if (res.data?.length) setZoneId(res.data[0].id);
    });
  }, []);

  const load = async () => {
    if (!zoneId) return;
    setLoading(true);
    const { data } = await reportsApi.timeseries(zoneId, from, to, ["soil","temp","humid","light"].join(","));
    setSeries(data || []);
    setLoading(false);
  };

  useEffect(()=>{ if(zoneId) load(); /* eslint-disable */}, [zoneId]);

  const chartData = useMemo(()=>{
    const labels = series.map(r=>dayjs(r.ts).format("MM/DD HH:mm"));
    return {
      labels,
      datasets: [
        { label: "Soil Moisture", data: series.map(r=>r.soil), borderWidth: 2, fill: false },
        { label: "Temperature (°C)", data: series.map(r=>r.temp), borderWidth: 2, fill: false },
        { label: "Humidity (%)", data: series.map(r=>r.humid), borderWidth: 2, fill: false },
        { label: "Light (lux)", data: series.map(r=>r.light), borderWidth: 2, fill: false },
      ],
    };
  }, [series]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(series);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `report_zone_${zoneId}_${from}_${to}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Plant Monitoring Report - Zone ${zoneId}`, 14, 16);
    const rows = series.map(r=>[r.ts, r.soil, r.temp, r.humid, r.light]);
    doc.autoTable({ head: [["Timestamp","Soil","Temp","Humid","Light"]], body: rows, startY: 22 });
    doc.save(`report_zone_${zoneId}_${from}_${to}.pdf`);
  };

  return (
    <div className="container py-3">
      <h3>Detailed Plant Monitoring Report</h3>
      <Card className="p-3 mb-3">
        <Row className="g-2">
          <Col md={3}>
            <Form.Select value={zoneId} onChange={(e)=>setZoneId(e.target.value)}>
              {zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}
            </Form.Select>
          </Col>
          <Col md={3}><Form.Control type="date" value={from} onChange={e=>setFrom(e.target.value)} /></Col>
          <Col md={3}><Form.Control type="date" value={to} onChange={e=>setTo(e.target.value)} /></Col>
          <Col md={3} className="d-flex gap-2">
            <Button onClick={load} disabled={loading}>Load</Button>
            <Button variant="outline-secondary" onClick={exportExcel} disabled={!series.length}>Excel</Button>
            <Button variant="outline-secondary" onClick={exportPDF} disabled={!series.length}>PDF</Button>
          </Col>
        </Row>
      </Card>

      <Card className="p-3">
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} height={420}/>
      </Card>
    </div>
  );
}
