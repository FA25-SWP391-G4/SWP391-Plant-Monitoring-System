import { useEffect, useState } from "react";
import { Tabs, Tab, Button, Form, Row, Col, Table, Badge } from "react-bootstrap";
import zonesApi from "../api/zonesApi";
import axiosClient from "../api/axiosClient";

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [devices, setDevices] = useState([]); // tất cả device chưa gán
  const [pumps, setPumps] = useState([]);

  const loadAll = async () => {
    const { data } = await zonesApi.list();
    setZones(data || []);
    if (data?.length && !active) setActive(String(data[0].id));
    const d = await axiosClient.get("/devices/unassigned");
    setDevices(d.data || []);
    const p = await axiosClient.get("/devices/pumps");
    setPumps(p.data || []);
  };

  useEffect(() => { loadAll(); /* eslint-disable */ }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await zonesApi.create(form);
    setForm({ name: "", description: "" });
    await loadAll();
  };

  const onDelete = async (zoneId) => {
    if (!window.confirm("Xóa khu vườn này?")) return;
    await zonesApi.remove(zoneId);
    await loadAll();
  };

  const assignDevice = async (zoneId, deviceId) => {
    await zonesApi.assignDevice(zoneId, deviceId);
    await loadAll();
  };

  const unassignDevice = async (zoneId, deviceId) => {
    await zonesApi.unassignDevice(zoneId, deviceId);
    await loadAll();
  };

  const assignPump = async (zoneId, pumpId) => {
    await zonesApi.assignPump(zoneId, pumpId);
    await loadAll();
  };

  return (
    <div className="container py-3">
      <h3 className="mb-3">Manage Multiple Plant Zones</h3>

      <Row className="g-3 mb-3">
        <Col md={6}>
          <Form onSubmit={onCreate} className="border p-3 rounded">
            <h6>Tạo khu vườn</h6>
            <Form.Group className="mb-2">
              <Form.Label>Tên</Form.Label>
              <Form.Control value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/>
            </Form.Group>
            <Button type="submit">Thêm</Button>
          </Form>
        </Col>
        <Col md={6}>
          <div className="border p-3 rounded">
            <h6>Thiết bị chưa gán</h6>
            <Table size="sm" bordered hover>
              <thead><tr><th>Device</th><th>Loại</th><th>Gán vào</th></tr></thead>
              <tbody>
                {devices.map(d=>(
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td><Badge bg="secondary">{d.type}</Badge></td>
                    <td>
                      {zones.map(z=>(
                        <Button key={z.id} size="sm" className="me-1" onClick={()=>assignDevice(z.id, d.id)}>Zone {z.name}</Button>
                      ))}
                    </td>
                  </tr>
                ))}
                {!devices.length && <tr><td colSpan={3} className="text-muted">Không còn thiết bị trống</td></tr>}
              </tbody>
            </Table>
            <h6 className="mt-3">Chọn bơm cho Zone</h6>
            <Row className="g-2">
              {zones.map(z=>(
                <Col sm={6} key={z.id}>
                  <Form.Select onChange={(e)=>assignPump(z.id, e.target.value)}>
                    <option value="">-- Gán bơm cho {z.name} --</option>
                    {pumps.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </Form.Select>
                </Col>
              ))}
            </Row>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={active} onSelect={(k)=>setActive(k)} className="mb-3">
        {zones.map(z=>(
          <Tab key={z.id} eventKey={String(z.id)} title={z.name}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div><strong>Mô tả:</strong> {z.description || "-"}</div>
              <Button variant="outline-danger" size="sm" onClick={()=>onDelete(z.id)}>Xóa zone</Button>
            </div>
            <h6>Thiết bị trong zone</h6>
            <Table bordered size="sm">
              <thead><tr><th>Tên</th><th>Loại</th><th>Hành động</th></tr></thead>
              <tbody>
                {(z.devices||[]).map(d=>(
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td><Badge bg="info">{d.type}</Badge></td>
                    <td><Button size="sm" variant="outline-secondary" onClick={()=>unassignDevice(z.id, d.id)}>Bỏ gán</Button></td>
                  </tr>
                ))}
                {!z.devices?.length && <tr><td colSpan={3} className="text-muted">Chưa có thiết bị</td></tr>}
              </tbody>
            </Table>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
