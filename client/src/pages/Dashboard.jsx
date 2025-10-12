import { useEffect, useState } from "react";
import WidgetCard from "../components/WidgetCard";
import ChartCard from "../components/ChartCard";
import PlantStatusCard from "../components/PlantStatusCard_New";
import { CardSkeleton } from "../components/Loading";
import axiosClient from "../api/axiosClient";
import { FiDroplet, FiThermometer, FiSun, FiWind, FiTrendingUp, FiAlertTriangle } from "react-icons/fi";
import './Dashboard.css';

export default function Dashboard(){
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState(null);
  const [series, setSeries] = useState([]);
  const [plants, setPlants] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(()=> {
    (async ()=>{
      try{
        const latestRes = await axiosClient.get("/api/sensors/latest");
        const seriesRes = await axiosClient.get("/api/reports/timeseries", { 
          params:{ metrics:"soil,temp,humid,light", limit:50 }
        });
        
        setLatest(latestRes.data);
        setSeries(seriesRes.data||[]);
        
        // Mock plant data - replace with real API calls
        setPlants([
          {
            id: 1,
            name: "Monstera Deliciosa",
            status: "excellent",
            moisture: 85,
            light: "perfect",
            health: "excellent",
            lastWatered: "2 hours ago"
          },
          {
            id: 2,
            name: "Snake Plant",
            status: "good",
            moisture: 65,
            light: "good",
            health: "good",
            lastWatered: "1 day ago"
          },
          {
            id: 3,
            name: "Fiddle Leaf Fig",
            status: "warning",
            moisture: 30,
            light: "low",
            health: "needs attention",
            lastWatered: "3 days ago"
          }
        ]);
        
        setAlerts([
          { id: 1, type: "warning", message: "Fiddle Leaf Fig needs watering", time: "5 mins ago" },
          { id: 2, type: "info", message: "Perfect growing conditions detected", time: "1 hour ago" }
        ]);
        
      }catch(err){ 
        console.error(err); 
      }
      setLoading(false);
    })();
  },[]);

  if(loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </div>
      </div>
    );
  }

  const labels = series.map(r=> new Date(r.ts).toLocaleTimeString());
  const datasets = [
    { 
      label:"Soil Moisture", 
      data: series.map(r=>r.soil),
      borderColor: 'var(--primary-green)',
      backgroundColor: 'var(--primary-green-bg)'
    },
    { 
      label:"Temperature °C", 
      data: series.map(r=>r.temp),
      borderColor: 'var(--warning)',
      backgroundColor: 'var(--warning-bg)'
    },
    { 
      label:"Humidity %", 
      data: series.map(r=>r.humid),
      borderColor: 'var(--info)',
      backgroundColor: 'var(--info-bg)'
    },
    { 
      label:"Light (lux)", 
      data: series.map(r=>r.light),
      borderColor: 'var(--warning)',
      backgroundColor: 'var(--warning-bg)'
    },
  ];

  const getStatusColor = (value, min, max) => {
    if (value >= min && value <= max) return 'var(--success)';
    if (value < min * 0.7 || value > max * 1.3) return 'var(--error)';
    return 'var(--warning)';
  };

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="header-text">
          <h1>Plant Dashboard</h1>
          <p>Monitor your plants' health and environmental conditions</p>
        </div>
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-number">{plants.length}</span>
            <span className="stat-label">Plants</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{alerts.length}</span>
            <span className="stat-label">Alerts</span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Recent Alerts</h3>
          <div className="alerts-grid">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card alert-${alert.type}`}>
                <FiAlertTriangle className="alert-icon" />
                <div className="alert-content">
                  <p>{alert.message}</p>
                  <span className="alert-time">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environmental Metrics */}
      <div className="metrics-section">
        <h3>Environmental Conditions</h3>
        <div className="metrics-grid">
          <WidgetCard 
            title="Soil Moisture" 
            subtitle="current reading" 
            icon={<FiDroplet />}
            right={<span className="sf-badge">Live</span>}
          >
            <div className="metric-value">
              <span 
                className="value-large"
                style={{ color: getStatusColor(latest?.soil || 0, 35, 55) }}
              >
                {latest?.soil ?? "--"}%
              </span>
              <div className="metric-bar">
                <div 
                  className="metric-fill" 
                  style={{ 
                    width: `${latest?.soil || 0}%`,
                    backgroundColor: getStatusColor(latest?.soil || 0, 35, 55)
                  }}
                ></div>
              </div>
            </div>
            <div className="sf-muted">Target: 35–55%</div>
          </WidgetCard>

          <WidgetCard 
            title="Temperature" 
            subtitle="current reading" 
            icon={<FiThermometer />}
            right={<span className="sf-badge">°C</span>}
          >
            <div className="metric-value">
              <span 
                className="value-large"
                style={{ color: getStatusColor(latest?.temp || 0, 22, 28) }}
              >
                {latest?.temp ?? "--"}°C
              </span>
              <div className="metric-trend">
                <FiTrendingUp className="trend-icon" />
                <span>+2°C from yesterday</span>
              </div>
            </div>
            <div className="sf-muted">Comfort: 22–28°C</div>
          </WidgetCard>

          <WidgetCard 
            title="Humidity" 
            subtitle="current reading" 
            icon={<FiWind />}
            right={<span className="sf-badge">%RH</span>}
          >
            <div className="metric-value">
              <span 
                className="value-large"
                style={{ color: getStatusColor(latest?.humid || 0, 50, 70) }}
              >
                {latest?.humid ?? "--"}%
              </span>
              <div className="metric-bar">
                <div 
                  className="metric-fill" 
                  style={{ 
                    width: `${latest?.humid || 0}%`,
                    backgroundColor: getStatusColor(latest?.humid || 0, 50, 70)
                  }}
                ></div>
              </div>
            </div>
            <div className="sf-muted">Comfort: 50–70%</div>
          </WidgetCard>

          <WidgetCard 
            title="Light Level" 
            subtitle="current reading" 
            icon={<FiSun />}
            right={<span className="sf-badge">lux</span>}
          >
            <div className="metric-value">
              <span className="value-large">
                {latest?.light ?? "--"}
              </span>
              <div className="light-indicator">
                <div className={`light-dot ${latest?.light > 1000 ? 'bright' : latest?.light > 500 ? 'medium' : 'dim'}`}></div>
                <span>{latest?.light > 1000 ? 'Bright' : latest?.light > 500 ? 'Medium' : 'Dim'}</span>
              </div>
            </div>
            <div className="sf-muted">Optimal for growth</div>
          </WidgetCard>
        </div>
      </div>

      {/* Plant Status Cards */}
      <div className="plants-section">
        <h3>Your Plants</h3>
        <div className="plants-grid">
          {plants.map(plant => (
            <PlantStatusCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <ChartCard 
          title="Environmental Trends" 
          subtitle="Last 24 hours"
          labels={labels} 
          datasets={datasets} 
        />
      </div>
    </div>
  );
}
