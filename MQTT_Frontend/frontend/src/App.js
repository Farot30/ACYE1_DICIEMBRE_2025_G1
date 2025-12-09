import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Server, Activity, AlertTriangle, Eye, EyeOff,
  TrendingUp, BarChart3, Clock, Settings
} from 'lucide-react';
import './App.css';
import ControlPanel from './ControlPanel';
import RealtimeSection from './RealtimeSection';
import ChartsSection from './ChartsSection';
import StatisticsSection from './StatisticsSection';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Credenciales institucionales
  const CREDENTIALS = {
    username: 'fiusac_datacenter',
    password: 'SecurePass2025'
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

  // Datos históricos para gráficas (Últimos 3 días)
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
              <p className="credentials-text">Contraseña: SecurePass2025</p>
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
          <RealtimeSection realtimeData={realtimeData} />
        )}

        {/* Sección 2: Gráficas Históricas */}
        {activeSection === 2 && (
          <ChartsSection 
            historicalData={historicalData}
            eventsByType={eventsByType}
            events={events}
          />
        )}

        {/* Sección 3: Estadísticas */}
        {activeSection === 3 && (
          <StatisticsSection 
            dailyStats={dailyStats}
            currentTime={currentTime}
          />
        )}

        {/* Sección 4: Panel de Control */}
        {activeSection === 4 && <ControlPanel />}
      </div>
    </div>
  );
}

export default App;