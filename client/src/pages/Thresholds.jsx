import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import thresholdsApi from "../api/thresholdsApi";
import axiosClient from "../api/axiosClient";

const defaultRules = [
  { id: "R1", expr: "soil < 30 && temp > 28 && humid < 50", action: "PUMP_ON", note: "Nóng & khô -> bật bơm" },
  { id: "R2", expr: "soil > 55 || humid > 85", action: "PUMP_OFF", note: "Đã đủ ẩm -> tắt bơm" },
];

export default function Thresholds() {
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState("");
  const [rules, setRules] = useState(defaultRules);

  useEffect(() => {
    axiosClient.get("/zones").then(res=>{
      setZones(res.data||[]);
      if (res.data?.length) setZoneId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!zoneId) return;
    thresholdsApi.get(zoneId).then(({data})=>{
      setRules(data?.rules?.length ? data.rules : defaultRules);
    }).catch(()=>setRules(defaultRules));
  }, [zoneId]);

  const updateRule = (idx, field, val) => {
    const next = [...rules];
    next[idx] = { ...next[idx], [field]: val };
    setRules(next);
  };

  const addRule = () => setRules([...rules, { id: `R${rules.length+1}`, expr: "", action: "PUMP_ON", note: "" }]);
  const removeRule = (idx) => setRules(rules.filter((_,i)=>i!==idx));

  const save = async () => {
    await thresholdsApi.save(zoneId, { rules });
    alert("Đã lưu ngưỡng/rules cho zone!");
  };

  return (
    <div className="container py-3">
      <h3>Configure Advanced Sensor Thresholds</h3>
      <Row className="g-2 mb-3">
        <Col md={4}>
          <Form.Select value={zoneId} onChange={(e)=>setZoneId(e.target.value)}>
            {zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}
          </Form.Select>
        </Col>
        <Col md={8} className="text-end">
          <Button onClick={addRule} className="me-2">Thêm rule</Button>
          <Button variant="success" onClick={save}>Lưu</Button>
        </Col>
      </Row>

      {rules.map((r, idx)=>(
        <Card key={r.id} className="mb-2 p-3">
          <Row className="g-2 align-items-center">
            <Col md={1}><Badge bg="dark">{r.id}</Badge></Col>
            <Col md={6}>
              <Form.Control value={r.expr} onChange={e=>updateRule(idx, "expr", e.target.value)}
                placeholder='Ví dụ: soil < 30 && temp > 28 && humid < 50' />
              <Form.Text className="text-muted">
                Biến có sẵn: <code>soil</code>, <code>temp</code>, <code>humid</code>, <code>light</code>, <code>air</code>.
              </Form.Text>
            </Col>
            <Col md={2}>
              <Form.Select value={r.action} onChange={e=>updateRule(idx,"action",e.target.value)}>
                <option value="PUMP_ON">PUMP_ON</option>
                <option value="PUMP_OFF">PUMP_OFF</option>
                <option value="ALERT_LOW_WATER">ALERT_LOW_WATER</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control value={r.note} onChange={e=>updateRule(idx,"note",e.target.value)} placeholder="Ghi chú"/>
            </Col>
            <Col md={1} className="text-end">
              <Button variant="outline-danger" size="sm" onClick={()=>removeRule(idx)}>Xóa</Button>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
}
