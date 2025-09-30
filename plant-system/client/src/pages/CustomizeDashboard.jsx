import { useEffect, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Card, Button } from "react-bootstrap";
import dashboardApi from "../api/dashboardApi";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultLayout = [
  { i: "w1", x:0, y:0, w:4, h:6 },
  { i: "w2", x:4, y:0, w:4, h:6 },
  { i: "w3", x:8, y:0, w:4, h:6 },
];

export default function CustomizeDashboard() {
  const [layout, setLayout] = useState(defaultLayout);

  useEffect(()=>{
    dashboardApi.getLayout().then(({data})=>{
      if (data?.layout?.length) setLayout(data.layout);
    }).catch(()=>{});
  }, []);

  const save = async () => {
    await dashboardApi.saveLayout(layout);
    alert("Đã lưu bố cục dashboard!");
  };

  const addWidget = () => {
    const idx = layout.length + 1;
    setLayout([...layout, { i:`w${idx}`, x:0, y:Infinity, w:4, h:6 }]);
  };

  const removeWidget = (id) => setLayout(layout.filter(l=>l.i!==id));

  return (
    <div className="container py-3">
      <h3>Customize Dashboard</h3>
      <div className="mb-2 d-flex gap-2">
        <Button onClick={addWidget}>Thêm widget</Button>
        <Button variant="success" onClick={save}>Lưu bố cục</Button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 }}
        rowHeight={24}
        onLayoutChange={(l)=>setLayout(l)}
      >
        {layout.map(w=>(
          <div key={w.i}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Widget {w.i.toUpperCase()}</span>
                <Button size="sm" variant="outline-danger" onClick={()=>removeWidget(w.i)}>X</Button>
              </Card.Header>
              <Card.Body>
                <div className="text-muted">Placeholder nội dung (chart/schedule/alerts)</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
