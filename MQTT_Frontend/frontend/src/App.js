import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import RealtimeSection from './sections/RealtimeSection';
import ChartsSection from './sections/ChartsSection';
import StatisticsSection from './sections/StatisticsSection';
import ControlPanel from './sections/ControlPanel';
import apiService from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemData, setSystemData] = useState({
    temperature: 0,
    humidity: 0,
    doorStatus: 'closed',
    maintenanceMode: false,
    fanStatus: false,
    activeAlerts: 0,
    systemStatus: 'normal'
  });

  // Datos para las gráficas (valores por defecto hasta que lleguen del backend)
  const [historicalData, setHistoricalData] = useState([
    { date: '2024-12-07', temp: 22, humidity: 45 },
    { date: '2024-12-08', temp: 23, humidity: 46 },
    { date: '2024-12-09', temp: 21, humidity: 44 }
  ]);

  const [eventsByType, setEventsByType] = useState([
    { type: 'Acceso', count: 0 },
    { type: 'Temperatura Alta', count: 0 },
    { type: 'Humedad Alta', count: 0 },
    { type: 'Intrusión', count: 0 }
  ]);

  const [events, setEvents] = useState([]);

  const [dailyStats, setDailyStats] = useState({
    maxTemp: 0,
    minTemp: 0,
    totalAlarms: 0,
    totalAccess: 0,
    avgDoorOpenTime: '0m 0s'
  });

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
      fetchSystemStatus();
      const interval = setInterval(fetchSystemStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Cargar datos desde el backend
  const loadInitialData = async () => {
    try {
      // Intentar cargar eventos
      const eventsData = await apiService.getEvents(null, null, 50);
      setEvents(eventsData.events || []);

      // Intentar cargar estadísticas
      const statsData = await apiService.getStats();
      if (statsData) {
        setDailyStats({
          maxTemp: statsData.maxTemp || 0,
          minTemp: statsData.minTemp || 0,
          totalAlarms: statsData.totalAlarms || 0,
          totalAccess: statsData.totalAccess || 0,
          avgDoorOpenTime: statsData.avgDoorOpenTime || '0m 0s'
        });
      }

      // Intentar cargar datos históricos
      const tempData = await apiService.getTemperature();
      const humidityData = await apiService.getHumidity();
      
      if (tempData.history && humidityData.history) {
        const combined = tempData.history.map((temp, index) => ({
          date: temp.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
          temp: temp.value || 0,
          humidity: humidityData.history[index]?.value || 0
        }));
        setHistoricalData(combined.slice(-7));
      }

      // Calcular eventos por tipo
      if (eventsData.events && eventsData.events.length > 0) {
        const eventTypes = ['Acceso', 'Temperatura Alta', 'Humedad Alta', 'Intrusión'];
        const eventCounts = eventTypes.map(type => ({
          type,
          count: eventsData.events.filter(e => e.type === type).length
        }));
        setEventsByType(eventCounts);
      }

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      // Mantener valores por defecto si falla
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const data = await apiService.getStatus();
      setSystemData({
        temperature: data.temperature || 0,
        humidity: data.humidity || 0,
        doorStatus: data.doorStatus || 'closed',
        maintenanceMode: data.maintenanceMode || false,
        fanStatus: data.fanStatus || false,
        activeAlerts: 2,
        systemStatus: 'normal'
      });
    } catch (error) {
      console.error('Error al obtener estado del sistema:', error);
    }
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <Router>
      <Routes>
        {/* Ruta de Login */}
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />

        {/* Rutas protegidas del Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? (
              <DashboardLayout 
                username={username}
                currentTime={currentTime}
                onLogout={handleLogout}
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard/realtime" replace />} />
                  <Route 
                    path="/realtime" 
                    element={<RealtimeSection realtimeData={systemData} />} 
                  />
                  <Route 
                    path="/charts" 
                    element={
                      <ChartsSection 
                        historicalData={historicalData}
                        eventsByType={eventsByType}
                        events={events}
                      />
                    } 
                  />
                  <Route 
                    path="/statistics" 
                    element={
                      <StatisticsSection 
                        currentTime={currentTime}
                        dailyStats={dailyStats}
                      />
                    } 
                  />
                  <Route 
                    path="/control" 
                    element={<ControlPanel />} 
                  />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Ruta por defecto */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;