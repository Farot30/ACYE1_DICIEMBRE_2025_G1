import React from 'react';
import { 
  Thermometer, Droplets, DoorOpen, DoorClosed, Shield, 
  Bell, AlertTriangle, CheckCircle 
} from 'lucide-react';
import '../styles/RealtimeSection.css';

function RealtimeSection({ realtimeData }) {
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
            <span className="realtime-status normal">Normal</span>
          </div>
        </div>

        <div className="realtime-card">
          <div className="realtime-icon humidity">
            <Droplets size={32} />
          </div>
          <div className="realtime-info">
            <span className="realtime-label">Humedad</span>
            <span className="realtime-value">{realtimeData.humidity}%</span>
            <span className="realtime-status normal">Normal</span>
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
              {realtimeData.systemStatus === 'normal' ? 'Normal' : 'Alarma'}
            </span>
            <span className={`realtime-status ${realtimeData.systemStatus === 'normal' ? 'normal' : 'alert'}`}>
              {realtimeData.systemStatus === 'normal' ? 'Operativo' : 'Revisión'}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas activas */}
      <div className="alerts-section">
        <div className="alerts-header">
          <Bell size={20} />
          <h3>Alertas Activas ({realtimeData.activeAlerts})</h3>
        </div>
        <div className="alerts-list">
          <div className="alert-item warning">
            <AlertTriangle size={20} />
            <div className="alert-content">
              <span className="alert-title">Temperatura elevándose</span>
              <span className="alert-time">Hace 5 minutos</span>
            </div>
          </div>
          <div className="alert-item info">
            <CheckCircle size={20} />
            <div className="alert-content">
              <span className="alert-title">Mantenimiento programado mañana</span>
              <span className="alert-time">08:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealtimeSection;