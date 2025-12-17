import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Server, Lock, Clock, Activity, TrendingUp, 
  BarChart3, Settings 
} from 'lucide-react';
import '../styles/Dashboard.css';

function DashboardLayout({ username, currentTime, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === `/dashboard${path}`;
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Server size={24} />
            </div>
            <div>
              <h1 className="header-title">DataCenter Monitoring</h1>
              <p className="header-subtitle">Sistema de Control FIUSAC</p>
            </div>
          </div>
          <div className="header-right">
            <div className="time-display">
              <Clock size={16} />
              <span>{currentTime.toLocaleTimeString('es-GT')}</span>
            </div>
            <div className="user-info">
              <p className="user-name">{username}</p>
              <p className="user-role">Administrador</p>
            </div>
            <button onClick={onLogout} className="logout-button">
              <Lock size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <div className="tabs-wrapper">
          <button 
            className={`tab-button ${isActive('/realtime') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/realtime')}
          >
            <Activity size={18} />
            <span>Estado en Tiempo Real</span>
          </button>
          <button 
            className={`tab-button ${isActive('/charts') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/charts')}
          >
            <TrendingUp size={18} />
            <span>Gráficas Históricas</span>
          </button>
          <button 
            className={`tab-button ${isActive('/statistics') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/statistics')}
          >
            <BarChart3 size={18} />
            <span>Estadísticas</span>
          </button>
          <button 
            className={`tab-button ${isActive('/control') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/control')}
          >
            <Settings size={18} />
            <span>Panel de Control</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;