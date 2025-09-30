import { useEffect, useState } from "react";
import { Row, Col, Form, Button, Table, Card } from "react-bootstrap";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import reportsApi from "../api/reportsApi";
import axiosClient from "../api/axiosClient";

export default function SearchReports() {
  const [zones, setZones] = useState([]);
  const [query, setQuery] = useState({
    zoneId: "",
    from: dayjs().subtract(3, "day").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
    keyword: "",
  });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axiosClient.get("/zones").then(res=>{
      const zs = res.data||[];
      setZones(zs);
      if (zs.length) setQuery(q=>({...q, zoneId: zs[0].id}));
    });
  }, []);

  const search = async () => {
    const { data } = await reportsApi.search(query);
    setRows(data || []);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Search");
    XLSX.writeFile(wb, `search_${query.zoneId}_${query.from}_${query.to}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reports Search - Zone ${query.zoneId}`, 14, 16);
    const body = rows.map(r=>[r.ts, r.metric, r.value, r.zoneName]);
    doc.autoTable({ head: [["Timestamp","Metric","Value","Zone"]], body, startY: 22 });
    doc.save(`search_${query.zoneId}_${query.from}_${query.to}.pdf`);
  };

  return (
    <div className="container py-3">
      <h3>Search Plant Monitoring Reports</h3>
      <Card className="p-3 mb-3">
        <Row className="g-2">
          <Col md={3}>
            <Form.Select value={query.zoneId} onChange={e=>setQuery({...query, zoneId:e.target.value})}>
              {zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}
            </Form.Select>
          </Col>
          <Col md={2}><Form.Control type="date" value={query.from} onChange={e=>setQuery({...query, from:e.target.value})}/></Col>
          <Col md={2}><Form.Control type="date" value={query.to} onChange={e=>setQuery({...query, to:e.target.value})}/></Col>
          <Col md={3}><Form.Control placeholder="keyword (vd: low water)" value={query.keyword} onChange={e=>setQuery({...query, keyword:e.target.value})}/></Col>
          <Col md={2} className="d-flex gap-2">
            <Button onClick={search}>Search</Button>
            <Button variant="outline-secondary" onClick={exportExcel} disabled={!rows.length}>Excel</Button>
            <Button variant="outline-secondary" onClick={exportPDF} disabled={!rows.length}>PDF</Button>
          </Col>
        </Row>
      </Card>

      <Table bordered hover size="sm">
        <thead><tr><th>Timestamp</th><th>Metric</th><th>Value</th><th>Zone</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{r.ts}</td>
              <td>{r.metric}</td>
              <td>{r.value}</td>
              <td>{r.zoneName}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} className="text-muted">Không có dữ liệu</td></tr>}
        </tbody>
      </Table>
    </div>
  );
}
