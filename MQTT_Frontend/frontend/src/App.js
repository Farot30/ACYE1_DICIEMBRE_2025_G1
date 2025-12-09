import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Server, Activity, AlertTriangle, CheckCircle, Eye, EyeOff,
  Thermometer, Droplets, DoorOpen, DoorClosed, Bell, TrendingUp, BarChart3,
  Calendar, Clock, Filter, ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import './App.css';
import ControlPanel from './ControlPanel';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Filtros para la tabla
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Credenciales institucionales
  const CREDENTIALS = {
    username: 'fiusac_datacenter',
    password: 'SecurePass2024!'
  };

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Datos simulados en tiempo real
  const realtimeData = {
    temperature: 22.5,
    humidity: 45,
    doorStatus: 'closed',
    systemStatus: 'normal',
    activeAlerts: 2
  };

  // Datos históricos para gráficas (últimos 3 días)
  const historicalData = [
    { date: '2024-12-06', temp: 21.5, humidity: 42 },
    { date: '2024-12-06', temp: 22.0, humidity: 44 },
    { date: '2024-12-06', temp: 22.5, humidity: 45 },
    { date: '2024-12-07', temp: 23.0, humidity: 46 },
    { date: '2024-12-07', temp: 22.8, humidity: 45 },
    { date: '2024-12-07', temp: 22.3, humidity: 43 },
    { date: '2024-12-08', temp: 22.5, humidity: 45 },
    { date: '2024-12-08', temp: 22.7, humidity: 46 },
  ];

  // Eventos por tipo para gráfica de barras
  const eventsByType = [
    { type: 'Temperatura Alta', count: 5 },
    { type: 'Humedad Alta', count: 3 },
    { type: 'Intrusión', count: 1 },
    { type: 'Acceso', count: 12 }
  ];

  // Últimos eventos
  const events = [
    { id: 1, type: 'Acceso', date: '2024-12-08', time: '10:30:15', temp: 22.5, description: 'Acceso autorizado - Juan Pérez' },
    { id: 2, type: 'Temperatura Alta', date: '2024-12-08', time: '09:15:22', temp: 28.3, description: 'Temperatura excedió límite superior' },
    { id: 3, type: 'Acceso', date: '2024-12-08', time: '08:45:10', temp: 22.1, description: 'Acceso autorizado - María García' },
    { id: 4, type: 'Humedad Alta', date: '2024-12-07', time: '16:20:30', temp: 23.0, description: 'Humedad superior al 60%' },
    { id: 5, type: 'Acceso', date: '2024-12-07', time: '14:10:05', temp: 22.8, description: 'Acceso autorizado - Pedro López' },
    { id: 6, type: 'Intrusión', date: '2024-12-07', time: '02:35:18', temp: 21.5, description: 'Intento de acceso no autorizado' },
    { id: 7, type: 'Acceso', date: '2024-12-06', time: '17:55:40', temp: 22.5, description: 'Acceso autorizado - Ana Martínez' },
    { id: 8, type: 'Temperatura Alta', date: '2024-12-06', time: '15:20:12', temp: 27.8, description: 'Temperatura excedió límite superior' },
  ];

  // Estadísticas del día
  const dailyStats = {
    maxTemp: 28.3,
    minTemp: 21.5,
    totalAlarms: 8,
    totalAccess: 12,
    avgDoorOpenTime: '2.5 min'
  };

  const handleLogin = () => {
    setIsLoading(true);
    setLoginError('');

    setTimeout(() => {
      if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Credenciales inválidas. Acceso denegado.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setActiveSection(1);
  };

  const filteredEvents = events.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (filterDate && event.date !== filterDate) return false;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-background-pattern"></div>

        <div className="login-card-wrapper">
          <div className="login-glow"></div>
          
          <div className="login-card">
            <div className="login-header">
              <div className="login-icon-wrapper">
                <Shield size={32} color="#60a5fa" />
              </div>
              <h1 className="login-title">DataCenter Monitoring</h1>
              <p className="login-subtitle">Sistema de Monitoreo y Control</p>
              <div className="login-security-badge">
                <Lock size={12} />
                <span>Acceso Seguro - FIUSAC</span>
              </div>
            </div>

            <div className="login-form">
              <div className="form-group">
                <label className="form-label">Usuario Institucional</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input"
                  placeholder="fiusac_datacenter"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="form-input"
                    placeholder="••••••••"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <button onClick={handleLogin} disabled={isLoading} className="login-button">
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </div>

            <div className="login-footer">
              <p className="footer-text">Acceso restringido a personal autorizado</p>
              <p className="footer-text-muted">© 2024 FIUSAC - Todos los derechos reservados</p>
            </div>

            <div className="credentials-box">
              <p className="credentials-title">Credenciales de prueba:</p>
              <p className="credentials-text">Usuario: fiusac_datacenter</p>
              <p className="credentials-text">Contraseña: SecurePass2024!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <button onClick={handleLogout} className="logout-button">
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
            className={`tab-button ${activeSection === 1 ? 'active' : ''}`}
            onClick={() => setActiveSection(1)}
          >
            <Activity size={18} />
            <span>Estado en Tiempo Real</span>
          </button>
          <button 
            className={`tab-button ${activeSection === 2 ? 'active' : ''}`}
            onClick={() => setActiveSection(2)}
          >
            <TrendingUp size={18} />
            <span>Gráficas Históricas</span>
          </button>
          <button 
            className={`tab-button ${activeSection === 3 ? 'active' : ''}`}
            onClick={() => setActiveSection(3)}
          >
            <BarChart3 size={18} />
            <span>Estadísticas</span>
          </button>
          <button 
            className={`tab-button ${activeSection === 4 ? 'active' : ''}`}
            onClick={() => setActiveSection(4)}
          >
            <Settings size={18} />
            <span>Panel de Control</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Sección 1: Estado Actual en Tiempo Real */}
        {activeSection === 1 && (
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
        )}

        {/* Sección 2: Gráficas Históricas */}
        {activeSection === 2 && (
          <div className="section-content-wrapper">
            <div className="section-header-main">
              <h2 className="section-title-main">Gráficas Históricas</h2>
              <span className="date-range">Últimos 3 días</span>
            </div>

            {/* Gráfica de líneas */}
            <div className="chart-card">
              <h3 className="chart-title">Temperatura y Humedad</h3>
              <div className="line-chart">
                {historicalData.map((data, index) => (
                  <div key={index} className="chart-bar-group">
                    <div className="chart-bar temp-bar" style={{height: `${(data.temp / 30) * 100}%`}}>
                      <span className="bar-label">{data.temp}°</span>
                    </div>
                    <div className="chart-bar humidity-bar" style={{height: `${(data.humidity / 60) * 100}%`}}>
                      <span className="bar-label">{data.humidity}%</span>
                    </div>
                    <span className="chart-date">{data.date.slice(5)}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color temp"></span>
                  <span>Temperatura</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color humidity"></span>
                  <span>Humedad</span>
                </div>
              </div>
            </div>

            {/* Gráfica de barras - Eventos */}
            <div className="chart-card">
              <h3 className="chart-title">Cantidad de Eventos por Tipo</h3>
              <div className="bar-chart-horizontal">
                {eventsByType.map((event, index) => (
                  <div key={index} className="bar-item">
                    <span className="bar-label-left">{event.type}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{width: `${(event.count / 15) * 100}%`}}
                      >
                        <span className="bar-value">{event.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla de eventos */}
            <div className="table-card">
              <div className="table-header">
                <h3 className="chart-title">Últimos Eventos Registrados</h3>
                <button 
                  className="filter-button"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filtros
                  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showFilters && (
                <div className="filters-panel">
                  <div className="filter-group">
                    <label>Tipo de Evento:</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                      <option value="all">Todos</option>
                      <option value="Acceso">Acceso</option>
                      <option value="Temperatura Alta">Temperatura Alta</option>
                      <option value="Humedad Alta">Humedad Alta</option>
                      <option value="Intrusión">Intrusión</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Fecha:</label>
                    <input 
                      type="date" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setFilterType('all');
                      setFilterDate('');
                    }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}

              <div className="table-wrapper">
                <table className="events-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Temperatura</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <span className={`event-type-badge ${event.type.toLowerCase().replace(' ', '-')}`}>
                            {event.type}
                          </span>
                        </td>
                        <td>{event.date}</td>
                        <td>{event.time}</td>
                        <td>{event.temp}°C</td>
                        <td>{event.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sección 3: Estadísticas */}
        {activeSection === 3 && (
          <div className="section-content-wrapper">
            <div className="section-header-main">
              <h2 className="section-title-main">Estadísticas del Día</h2>
              <span className="date-badge">
                <Calendar size={16} />
                {currentTime.toLocaleDateString('es-GT')}
              </span>
            </div>

            <div className="stats-grid-detailed">
              <div className="stat-card-detailed">
                <div className="stat-icon-wrapper red">
                  <TrendingUp size={28} />
                </div>
                <div className="stat-details">
                  <span className="stat-label-detailed">Temperatura Máxima</span>
                  <span className="stat-value-detailed">{dailyStats.maxTemp}°C</span>
                  <span className="stat-sublabel">Registrada a las 09:15 AM</span>
                </div>
              </div>

              <div className="stat-card-detailed">
                <div className="stat-icon-wrapper blue">
                  <Thermometer size={28} />
                </div>
                <div className="stat-details">
                  <span className="stat-label-detailed">Temperatura Mínima</span>
                  <span className="stat-value-detailed">{dailyStats.minTemp}°C</span>
                  <span className="stat-sublabel">Registrada a las 06:30 AM</span>
                </div>
              </div>

              <div className="stat-card-detailed">
                <div className="stat-icon-wrapper yellow">
                  <Bell size={28} />
                </div>
                <div className="stat-details">
                  <span className="stat-label-detailed">Total de Alarmas</span>
                  <span className="stat-value-detailed">{dailyStats.totalAlarms}</span>
                  <span className="stat-sublabel">Activadas en el día</span>
                </div>
              </div>

              <div className="stat-card-detailed">
                <div className="stat-icon-wrapper green">
                  <DoorOpen size={28} />
                </div>
                <div className="stat-details">
                  <span className="stat-label-detailed">Accesos del Día</span>
                  <span className="stat-value-detailed">{dailyStats.totalAccess}</span>
                  <span className="stat-sublabel">Personal autorizado</span>
                </div>
              </div>

              <div className="stat-card-detailed">
                <div className="stat-icon-wrapper purple">
                  <Clock size={28} />
                </div>
                <div className="stat-details">
                  <span className="stat-label-detailed">Tiempo Promedio Puerta Abierta</span>
                  <span className="stat-value-detailed">{dailyStats.avgDoorOpenTime}</span>
                  <span className="stat-sublabel">Calculado sobre {dailyStats.totalAccess} accesos</span>
                </div>
              </div>
            </div>

            {/* Resumen semanal */}
            <div className="summary-card">
              <h3 className="summary-title">Resumen Semanal</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Promedio de Temperatura</span>
                  <span className="summary-value">22.8°C</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Promedio de Humedad</span>
                  <span className="summary-value">44.5%</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Accesos Semana</span>
                  <span className="summary-value">84</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Eficiencia del Sistema</span>
                  <span className="summary-value">98.5%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección 4: Panel de Control */}
        {activeSection === 4 && <ControlPanel />}
      </div>
    </div>
  );
}

export default App;