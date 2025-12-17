import React from 'react';
import { 
  Thermometer, Droplets, DoorOpen, DoorClosed, Shield, 
  Bell, AlertTriangle, CheckCircle, Fan, Lock 
} from 'lucide-react';
import '../styles/RealtimeSection.css';

function RealtimeSection({ realtimeData }) {
  // Generar alertas dinámicamente basadas en el estado real
  const generateAlerts = () => {
    const alerts = [];
    const TEMP_THRESHOLD = 28;
    const HUMIDITY_THRESHOLD = 70;

    // Alerta de temperatura alta
    if (realtimeData.temperature > TEMP_THRESHOLD) {
      alerts.push({
        id: 'temp-high',
        type: 'alert',
        icon: <Thermometer size={20} />,
        title: `Temperatura crítica: ${realtimeData.temperature}°C`,
        time: 'Ahora',
        severity: 'alert'
      });
    }

    // Alerta de humedad alta
    if (realtimeData.humidity > HUMIDITY_THRESHOLD) {
      alerts.push({
        id: 'hum-high',
        type: 'alert',
        icon: <Droplets size={20} />,
        title: `Humedad elevada: ${realtimeData.humidity}%`,
        time: 'Ahora',
        severity: 'warning'
      });
    }

    // Alerta de puerta abierta
    if (realtimeData.doorStatus === 'open') {
      alerts.push({
        id: 'door-open',
        type: 'warning',
        icon: <DoorOpen size={20} />,
        title: 'Puerta del datacenter abierta',
        time: 'Ahora',
        severity: 'warning'
      });
    }

    // Alerta de modo mantenimiento
    if (realtimeData.maintenanceMode) {
      alerts.push({
        id: 'maintenance',
        type: 'info',
        icon: <Shield size={20} />,
        title: 'Modo mantenimiento activo',
        time: 'Ahora',
        severity: 'info'
      });
    }

    // Alerta de ventilador encendido
    if (realtimeData.fanStatus) {
      alerts.push({
        id: 'fan-on',
        type: 'info',
        icon: <Fan size={20} />,
        title: 'Sistema de ventilación activo',
        time: 'Ahora',
        severity: 'info'
      });
    }

    // Alerta de sistema en alarma
    if (realtimeData.systemStatus === 'alarm') {
      alerts.push({
        id: 'system-alarm',
        type: 'alert',
        icon: <AlertTriangle size={20} />,
        title: 'Sistema en estado de alarma',
        time: 'Ahora',
        severity: 'alert'
      });
    }

    // Si no hay alertas, mostrar mensaje de sistema normal
    if (alerts.length === 0) {
      alerts.push({
        id: 'all-normal',
        type: 'success',
        icon: <CheckCircle size={20} />,
        title: 'Todos los sistemas operando normalmente',
        time: 'Ahora',
        severity: 'success'
      });
    }

    return alerts;
  };

  const activeAlerts = generateAlerts();

  return (
    <div className="section-content-wrapper">
      <div className="section-header-main">
        <h2 className="section-title-main">Estado Actual en Tiempo Real</h2>
        <span className="live-indicator">
          <span className="live-dot"></span>
          EN VIVO
        </span>
      </div>

      {/* Métricas principales */}
      <div className="realtime-grid">
        <div className="realtime-card">
          <div className="realtime-icon temp">
            <Thermometer size={32} />
          </div>
          <div className="realtime-info">
            <span className="realtime-label">Temperatura</span>
            <span className="realtime-value">{realtimeData.temperature}°C</span>
            <span className={`realtime-status ${realtimeData.temperature > 28 ? 'alert' : 'normal'}`}>
              {realtimeData.temperature > 28 ? 'Crítica' : 'Normal'}
            </span>
          </div>
        </div>

        <div className="realtime-card">
          <div className="realtime-icon humidity">
            <Droplets size={32} />
          </div>
          <div className="realtime-info">
            <span className="realtime-label">Humedad</span>
            <span className="realtime-value">{realtimeData.humidity}%</span>
            <span className={`realtime-status ${realtimeData.humidity > 70 ? 'warning' : 'normal'}`}>
              {realtimeData.humidity > 70 ? 'Elevada' : 'Normal'}
            </span>
          </div>
        </div>

        <div className="realtime-card">
          <div className="realtime-icon door">
            {realtimeData.doorStatus === 'closed' ? <DoorClosed size={32} /> : <DoorOpen size={32} />}
          </div>
          <div className="realtime-info">
            <span className="realtime-label">Estado de Puerta</span>
            <span className="realtime-value">
              {realtimeData.doorStatus === 'closed' ? 'Cerrada' : 'Abierta'}
            </span>
            <span className={`realtime-status ${realtimeData.doorStatus === 'closed' ? 'normal' : 'warning'}`}>
              {realtimeData.doorStatus === 'closed' ? 'Seguro' : 'Atención'}
            </span>
          </div>
        </div>

        <div className="realtime-card">
          <div className="realtime-icon system">
            <Shield size={32} />
          </div>
          <div className="realtime-info">
            <span className="realtime-label">Estado del Sistema</span>
            <span className="realtime-value">
              {realtimeData.systemStatus === 'normal' ? 'Normal' : 
               realtimeData.systemStatus === 'maintenance' ? 'Mantenimiento' : 'Alarma'}
            </span>
            <span className={`realtime-status ${
              realtimeData.systemStatus === 'normal' ? 'normal' : 
              realtimeData.systemStatus === 'maintenance' ? 'warning' : 'alert'
            }`}>
              {realtimeData.systemStatus === 'normal' ? 'Operativo' : 
               realtimeData.systemStatus === 'maintenance' ? 'En Mant.' : 'Revisión'}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas activas */}
      <div className="alerts-section">
        <div className="alerts-header">
          <Bell size={20} />
          <h3>Alertas Activas ({activeAlerts.length})</h3>
        </div>
        <div className="alerts-list">
          {activeAlerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity}`}>
              {alert.icon}
              <div className="alert-content">
                <span className="alert-title">{alert.title}</span>
                <span className="alert-time">{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RealtimeSection;