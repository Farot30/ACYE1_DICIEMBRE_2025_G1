import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, DoorClosed, Wrench, Fan, Power, 
  Send, CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import apiService from '../services/api';
import '../styles/ControlPanel.css';

function ControlPanel() {
  const [doorStatus, setDoorStatus] = useState('closed');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [fanStatus, setFanStatus] = useState(false);
  const [loading, setLoading] = useState({
    door: false,
    maintenance: false,
    fan: false
  });
  const [notifications, setNotifications] = useState([]);

  // Cargar estado inicial del sistema
  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = await apiService.getStatus();
      setDoorStatus(status.doorStatus);
      setMaintenanceMode(status.maintenanceMode);
      setFanStatus(status.fanStatus);
    } catch (error) {
      console.error('Error cargando estado del sistema:', error);
      addNotification('error', 'Error al cargar estado del sistema');
    }
  };

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleDoorToggle = async () => {
    setLoading(prev => ({ ...prev, door: true }));
    
    try {
      const newStatus = doorStatus === 'closed' ? 'open' : 'closed';
      
      if (newStatus === 'open') {
        await apiService.openDoor('Usuario Web');
      } else {
        await apiService.closeDoor('Usuario Web');
      }
      
      setDoorStatus(newStatus);
      addNotification('success', `Puerta ${newStatus === 'open' ? 'abierta' : 'cerrada'} exitosamente`);
    } catch (error) {
      addNotification('error', `Error al controlar puerta: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, door: false }));
    }
  };

  const handleMaintenanceToggle = async () => {
    setLoading(prev => ({ ...prev, maintenance: true }));
    
    try {
      const newMode = !maintenanceMode;
      await apiService.toggleMaintenance(newMode, 'Usuario Web');
      
      setMaintenanceMode(newMode);
      addNotification('success', `Modo mantenimiento ${newMode ? 'activado' : 'desactivado'}`);
    } catch (error) {
      addNotification('error', `Error al cambiar modo de mantenimiento: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, maintenance: false }));
    }
  };

  const handleFanToggle = async () => {
    setLoading(prev => ({ ...prev, fan: true }));
    
    try {
      const newStatus = !fanStatus;
      await apiService.toggleFan(newStatus);
      
      setFanStatus(newStatus);
      addNotification('success', `Ventilador ${newStatus ? 'activado' : 'desactivado'}`);
    } catch (error) {
      addNotification('error', `Error al controlar ventilador: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, fan: false }));
    }
  };

  return (
    <div className="control-panel-container">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="control-panel-header">
        <div className="header-icon-control">
          <Power size={28} />
        </div>
        <div>
          <h2 className="control-panel-title">Panel de Control</h2>
          <p className="control-panel-subtitle">Comandos MQTT en tiempo real</p>
        </div>
      </div>

      {/* Control Cards */}
      <div className="control-cards-grid">
        {/* Door Control */}
        <div className="control-card">
          <div className="control-card-header">
            <div className={`control-icon ${doorStatus === 'open' ? 'active' : ''}`}>
              {doorStatus === 'closed' ? (
                <DoorClosed size={32} />
              ) : (
                <DoorOpen size={32} />
              )}
            </div>
            <div className="control-info">
              <h3 className="control-title">Control de Puerta</h3>
              <p className="control-description">
                Estado actual: <span className={`status-text ${doorStatus}`}>
                  {doorStatus === 'closed' ? 'Cerrada' : 'Abierta'}
                </span>
              </p>
            </div>
          </div>

          <div className="control-card-body">
            <div className="status-indicator-large">
              <div className={`pulse-ring ${doorStatus === 'open' ? 'active' : ''}`}></div>
              <div className={`status-dot ${doorStatus === 'open' ? 'active' : ''}`}></div>
            </div>

            <button
              onClick={handleDoorToggle}
              disabled={loading.door}
              className={`control-button ${doorStatus === 'open' ? 'close' : 'open'}`}
            >
              {loading.door ? (
                <>
                  <Loader size={20} className="spinner-icon" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>{doorStatus === 'closed' ? 'Abrir Puerta' : 'Cerrar Puerta'}</span>
                </>
              )}
            </button>

            <div className="mqtt-info">
              <span className="mqtt-label">Topic MQTT:</span>
              <code className="mqtt-command">
                /fiusac/datacenter/access
              </code>
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="control-card">
          <div className="control-card-header">
            <div className={`control-icon maintenance ${maintenanceMode ? 'active' : ''}`}>
              <Wrench size={32} />
            </div>
            <div className="control-info">
              <h3 className="control-title">Modo Mantenimiento</h3>
              <p className="control-description">
                Estado actual: <span className={`status-text ${maintenanceMode ? 'active' : 'inactive'}`}>
                  {maintenanceMode ? 'Activado' : 'Desactivado'}
                </span>
              </p>
            </div>
          </div>

          <div className="control-card-body">
            <div className="status-indicator-large">
              <div className={`pulse-ring ${maintenanceMode ? 'active maintenance' : ''}`}></div>
              <div className={`status-dot ${maintenanceMode ? 'active maintenance' : ''}`}></div>
            </div>

            <button
              onClick={handleMaintenanceToggle}
              disabled={loading.maintenance}
              className={`control-button ${maintenanceMode ? 'deactivate' : 'activate'} maintenance`}
            >
              {loading.maintenance ? (
                <>
                  <Loader size={20} className="spinner-icon" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Power size={20} />
                  <span>{maintenanceMode ? 'Desactivar' : 'Activar'} Mantenimiento</span>
                </>
              )}
            </button>

            <div className="mqtt-info">
              <span className="mqtt-label">Topic MQTT:</span>
              <code className="mqtt-command">
                /fiusac/datacenter/maintenance
              </code>
            </div>
          </div>

          {maintenanceMode && (
            <div className="maintenance-alert">
              <AlertCircle size={16} />
              <span>Sistema en modo mantenimiento. Las alarmas están pausadas.</span>
            </div>
          )}
        </div>

        {/* Fan Control */}
        <div className="control-card">
          <div className="control-card-header">
            <div className={`control-icon fan ${fanStatus ? 'active spinning' : ''}`}>
              <Fan size={32} />
            </div>
            <div className="control-info">
              <h3 className="control-title">Control de Ventilador</h3>
              <p className="control-description">
                Estado actual: <span className={`status-text ${fanStatus ? 'active' : 'inactive'}`}>
                  {fanStatus ? 'Encendido' : 'Apagado'}
                </span>
              </p>
            </div>
          </div>

          <div className="control-card-body">
            <div className="status-indicator-large">
              <div className={`pulse-ring ${fanStatus ? 'active fan' : ''}`}></div>
              <div className={`status-dot ${fanStatus ? 'active fan' : ''}`}></div>
            </div>

            <button
              onClick={handleFanToggle}
              disabled={loading.fan}
              className={`control-button ${fanStatus ? 'deactivate' : 'activate'} fan`}
            >
              {loading.fan ? (
                <>
                  <Loader size={20} className="spinner-icon" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Power size={20} />
                  <span>{fanStatus ? 'Apagar' : 'Encender'} Ventilador</span>
                </>
              )}
            </button>

            <div className="mqtt-info">
              <span className="mqtt-label">Topic MQTT:</span>
              <code className="mqtt-command">
                /fiusac/datacenter/fan
              </code>
            </div>
          </div>

          {fanStatus && (
            <div className="fan-info">
              <CheckCircle size={16} />
              <span>Ventilador operando a velocidad óptima</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="status-summary">
        <h3 className="summary-title-control">Resumen de Estado del Sistema</h3>
        <div className="summary-grid-control">
          <div className="summary-item-control">
            <div className="summary-icon door">
              {doorStatus === 'closed' ? <DoorClosed size={20} /> : <DoorOpen size={20} />}
            </div>
            <div>
              <span className="summary-label-control">Puerta</span>
              <span className="summary-value-control">{doorStatus === 'closed' ? 'Cerrada' : 'Abierta'}</span>
            </div>
          </div>

          <div className="summary-item-control">
            <div className="summary-icon maintenance">
              <Wrench size={20} />
            </div>
            <div>
              <span className="summary-label-control">Mantenimiento</span>
              <span className="summary-value-control">{maintenanceMode ? 'Activado' : 'Desactivado'}</span>
            </div>
          </div>

          <div className="summary-item-control">
            <div className="summary-icon fan">
              <Fan size={20} />
            </div>
            <div>
              <span className="summary-label-control">Ventilador</span>
              <span className="summary-value-control">{fanStatus ? 'Encendido' : 'Apagado'}</span>
            </div>
          </div>

          <div className="summary-item-control">
            <div className="summary-icon system">
              <Power size={20} />
            </div>
            <div>
              <span className="summary-label-control">Sistema</span>
              <span className="summary-value-control">Operativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* MQTT Connection Info */}
      <div className="mqtt-connection-info">
        <div className="mqtt-status">
          <div className="mqtt-indicator connected"></div>
          <span>Conectado al servidor MQTT vía API</span>
        </div>
        <div className="mqtt-details">
          <span className="mqtt-detail-item">
            <strong>API:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:3001'}
          </span>
          <span className="mqtt-detail-item">
            <strong>Broker:</strong> HiveMQ Cloud
          </span>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;