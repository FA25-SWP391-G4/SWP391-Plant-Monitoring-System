import { useState } from "react";
import { Card, Button, Row, Col, Badge } from "react-bootstrap";
import billingApi from "../api/billingApi";

export default function Upgrade(){
  const [loading, setLoading] = useState(false);

  const goCheckout = async (provider) => {
    setLoading(true);
    try {
      const { data } = await billingApi.createCheckout(provider); 
      // BE trả { redirectUrl } (VNPay/Stripe/PayPal)
      window.location.href = data.redirectUrl;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-3">
      <h3>Nâng cấp Premium</h3>
      <Row className="g-3">
        <Col md={6}>
          <Card className="p-3">
            <h5>Premium <Badge bg="warning">Khuyến nghị</Badge></h5>
            <ul>
              <li>Quản lý đa khu vườn (UC13)</li>
              <li>Báo cáo chi tiết + Export (UC14, UC16)</li>
              <li>Ngưỡng tưới nâng cao (UC15)</li>
              <li>Tùy chỉnh dashboard (UC17)</li>
              <li>Chatbot AI + lịch sử (khi BE bật)</li>
            </ul>
            <div className="d-flex gap-2">
              <Button disabled={loading} onClick={()=>goCheckout("vnpay")}>Thanh toán qua VNPay</Button>
              <Button disabled={loading} variant="outline-secondary" onClick={()=>goCheckout("stripe")}>Stripe</Button>
              <Button disabled={loading} variant="outline-secondary" onClick={()=>goCheckout("paypal")}>PayPal</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
