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

  // Datos para las gráficas - empezar con array vacío
  const [historicalData, setHistoricalData] = useState([]);

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

  const [threeDaysSummary, setThreeDaysSummary] = useState({
    avgTemp: 0,
    avgHumidity: 0,
    totalAccess: 0,
    systemEfficiency: 0
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
      console.log('🔄 Cargando datos iniciales...');
      
      // Variable para almacenar eventos formateados
      let formattedEvents = [];
      
      // **CAMBIAR LÍMITE AQUÍ** - Cambia 50 por el número que quieras (ej: 100, 200)
      const eventsData = await apiService.getEvents(null, null, 100);
      console.log('📥 Eventos recibidos:', eventsData);
      
      // El backend devuelve el array directamente, no dentro de .events
      if (Array.isArray(eventsData) && eventsData.length > 0) {
        // Formatear eventos para el frontend
        formattedEvents = eventsData.map(event => ({
          id: event._id,
          type: event.type === 'door' ? 'Acceso' : 
                event.type === 'motion' ? 'Intrusión' : 
                event.type === 'fan' ? 'Ventilador' : 
                event.type === 'maintenance' ? 'Mantenimiento' : event.type,
          date: new Date(event.timestamp).toISOString().split('T')[0],
          time: new Date(event.timestamp).toLocaleTimeString('es-GT'),
          temp: 0,
          description: event.message || 'Sin descripción',
          timestamp: event.timestamp
        }));
      }

      // Cargar estadísticas (para el estado actual del sistema)
      const statsData = await apiService.getStats();
      console.log('📊 Stats recibidas:', statsData);
      
      if (statsData) {
        // Actualizar estado del sistema con datos reales
        setSystemData(prev => ({
          ...prev,
          doorStatus: statsData.doorStatus === 'OPEN' ? 'open' : 'closed',
          fanStatus: statsData.fanStatus === 'ON',
          maintenanceMode: statsData.maintenanceMode
        }));
      }

      // Cargar datos históricos de temperatura y humedad
      const tempData = await apiService.getTemperature();
      const humidityData = await apiService.getHumidity();
      
      console.log('🌡️ Temperatura recibida:', tempData);
      console.log('💧 Humedad recibida:', humidityData);
      
      // **GENERAR EVENTOS DE ALERTAS BASADOS EN UMBRALES**
      const TEMP_THRESHOLD = 28;  // °C - Ajusta este valor
      const HUMIDITY_THRESHOLD = 70; // % - Ajusta este valor
      
      // Eventos de temperatura alta
      if (Array.isArray(tempData) && tempData.length > 0) {
        tempData.forEach(reading => {
          if (reading.value > TEMP_THRESHOLD) {
            formattedEvents.push({
              id: `temp-${reading._id}`,
              type: 'Temperatura Alta',
              date: new Date(reading.timestamp).toISOString().split('T')[0],
              time: new Date(reading.timestamp).toLocaleTimeString('es-GT'),
              temp: Math.round(reading.value),
              description: `Temperatura crítica detectada: ${Math.round(reading.value)}°C (umbral: ${TEMP_THRESHOLD}°C)`,
              timestamp: reading.timestamp
            });
          }
        });
      }
      
      // Eventos de humedad alta
      if (Array.isArray(humidityData) && humidityData.length > 0) {
        humidityData.forEach(reading => {
          if (reading.value > HUMIDITY_THRESHOLD) {
            formattedEvents.push({
              id: `hum-${reading._id}`,
              type: 'Humedad Alta',
              date: new Date(reading.timestamp).toISOString().split('T')[0],
              time: new Date(reading.timestamp).toLocaleTimeString('es-GT'),
              temp: 0,
              description: `Humedad elevada detectada: ${Math.round(reading.value)}% (umbral: ${HUMIDITY_THRESHOLD}%)`,
              timestamp: reading.timestamp
            });
          }
        });
      }
      
      // Ordenar todos los eventos por timestamp (más reciente primero)
      formattedEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Limitar a los últimos 100 eventos
      formattedEvents = formattedEvents.slice(0, 100);
      
      setEvents(formattedEvents);
      
      // Calcular eventos por tipo
      const eventCounts = [
        { type: 'Acceso', count: formattedEvents.filter(e => e.type === 'Acceso').length },
        { type: 'Temperatura Alta', count: formattedEvents.filter(e => e.type === 'Temperatura Alta').length },
        { type: 'Humedad Alta', count: formattedEvents.filter(e => e.type === 'Humedad Alta').length },
        { type: 'Intrusión', count: formattedEvents.filter(e => e.type === 'Intrusión').length }
      ];
      setEventsByType(eventCounts);
      
      console.log('📊 Eventos por tipo:', eventCounts);

      // **NUEVO ENFOQUE: Procesar listas separadas y combinar solo donde coincidan**
      if (Array.isArray(tempData) && tempData.length > 0 && Array.isArray(humidityData) && humidityData.length > 0) {
        
        // Ordenar ambas listas por timestamp (más antiguo primero)
        const sortedTemps = tempData
          .map(r => ({
            timestamp: new Date(r.timestamp).getTime(),
            value: Math.round(r.value),
            date: new Date(r.timestamp).toISOString().split('T')[0],
            time: new Date(r.timestamp).toLocaleTimeString('es-GT')
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        const sortedHumidity = humidityData
          .map(r => ({
            timestamp: new Date(r.timestamp).getTime(),
            value: Math.round(r.value),
            date: new Date(r.timestamp).toISOString().split('T')[0],
            time: new Date(r.timestamp).toLocaleTimeString('es-GT')
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('📊 Temperaturas ordenadas:', sortedTemps.length);
        console.log('📊 Humedades ordenadas:', sortedHumidity.length);
        
        // **FILTRAR POR LOS ÚLTIMOS 3 DÍAS**
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoTimestamp = threeDaysAgo.getTime();
        
        console.log('📅 Filtrando datos desde:', threeDaysAgo.toISOString());
        
        // Filtrar temperaturas de los últimos 3 días
        const recentTemps = sortedTemps.filter(t => t.timestamp >= threeDaysAgoTimestamp);
        const recentHumidity = sortedHumidity.filter(h => h.timestamp >= threeDaysAgoTimestamp);
        
        console.log('📊 Temperaturas últimos 3 días:', recentTemps.length);
        console.log('📊 Humedades últimos 3 días:', recentHumidity.length);
        
        // Combinar datos donde los timestamps coincidan exactamente (o casi)
        const combined = [];
        const TOLERANCE_MS = 2000; // 2 segundos de tolerancia
        
        recentTemps.forEach(tempReading => {
          // Buscar la humedad más cercana en tiempo
          const matchingHumidity = recentHumidity.find(humReading => 
            Math.abs(humReading.timestamp - tempReading.timestamp) <= TOLERANCE_MS
          );
          
          if (matchingHumidity) {
            combined.push({
              timestamp: tempReading.timestamp,
              date: tempReading.date,
              time: tempReading.time,
              temp: tempReading.value,
              humidity: matchingHumidity.value
            });
          }
        });
        
        // Ya no limitamos a 30 puntos - mostramos TODOS los de los últimos 3 días
        console.log('📊 Datos combinados (últimos 3 días):', combined.length, 'puntos');
        console.log('📊 Muestra de datos:', combined.slice(0, 3));
        
        setHistoricalData(combined);
        
        // Actualizar temperatura y humedad en tiempo real (última lectura)
        if (tempData.length > 0) {
          setSystemData(prev => ({
            ...prev,
            temperature: Math.round(tempData[0].value) || 0
          }));
        }
        
        if (humidityData.length > 0) {
          setSystemData(prev => ({
            ...prev,
            humidity: Math.round(humidityData[0].value) || 0
          }));
        }
        
        // Calcular estadísticas del día
        const temps = tempData.map(r => r.value);
        const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
        const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
        
        setDailyStats({
          maxTemp: Math.round(maxTemp),
          minTemp: Math.round(minTemp),
          totalAlarms: formattedEvents.filter(e => 
            e.type === 'Temperatura Alta' || e.type === 'Humedad Alta'
          ).length,
          totalAccess: formattedEvents.filter(e => e.type === 'Acceso').length,
          avgDoorOpenTime: '0m 0s'
        });

        // **CALCULAR RESUMEN DE LOS ÚLTIMOS 3 DÍAS**
        // Usar los datos ya filtrados (recentTemps y recentHumidity)
        const avgTemp3Days = recentTemps.length > 0 
          ? recentTemps.reduce((sum, t) => sum + t.value, 0) / recentTemps.length 
          : 0;
        
        const avgHumidity3Days = recentHumidity.length > 0 
          ? recentHumidity.reduce((sum, h) => sum + h.value, 0) / recentHumidity.length 
          : 0;
        
        // Filtrar eventos de los últimos 3 días
        const eventsLast3Days = formattedEvents.filter(e => {
          const eventTimestamp = new Date(e.timestamp).getTime();
          return eventTimestamp >= threeDaysAgoTimestamp;
        });
        
        const totalAccessLast3Days = eventsLast3Days.filter(e => e.type === 'Acceso').length;
        
        // Calcular eficiencia del sistema (ejemplo: basado en lecturas exitosas)
        const totalReadingsExpected = 3 * 24 * 60 * 6; // 3 días * 24h * 60min * 6 lecturas/min
        const totalReadingsReceived = recentTemps.length + recentHumidity.length;
        const systemEfficiency = totalReadingsExpected > 0 
          ? Math.min((totalReadingsReceived / totalReadingsExpected) * 100, 100)
          : 0;
        
        setThreeDaysSummary({
          avgTemp: Math.round(avgTemp3Days * 10) / 10, // 1 decimal
          avgHumidity: Math.round(avgHumidity3Days * 10) / 10, // 1 decimal
          totalAccess: totalAccessLast3Days,
          systemEfficiency: Math.round(systemEfficiency * 10) / 10 // 1 decimal
        });
        
        console.log('📊 Resumen 3 días calculado:', {
          avgTemp: avgTemp3Days,
          avgHumidity: avgHumidity3Days,
          totalAccess: totalAccessLast3Days,
          efficiency: systemEfficiency
        });
      } else {
        console.log('⚠️ No hay datos suficientes de temperatura o humedad');
      }

      console.log('✅ Datos cargados exitosamente');

    } catch (error) {
      console.error('❌ Error al cargar datos iniciales:', error);
      // Mantener valores por defecto si falla
    }
  };

  

  const fetchSystemStatus = async () => {
    try {
      // Obtener últimas lecturas de temperatura y humedad
      const tempData = await apiService.getTemperature();
      const humidityData = await apiService.getHumidity();
      const statsData = await apiService.getStats();
      
      setSystemData(prev => ({
        ...prev,
        temperature: (Array.isArray(tempData) && tempData.length > 0) 
          ? Math.round(tempData[0].value) 
          : prev.temperature,
        humidity: (Array.isArray(humidityData) && humidityData.length > 0) 
          ? Math.round(humidityData[0].value) 
          : prev.humidity,
        doorStatus: statsData?.doorStatus === 'OPEN' ? 'open' : 'closed',
        fanStatus: statsData?.fanStatus === 'ON',
        maintenanceMode: statsData?.maintenanceMode || false,
        activeAlerts: 0,
        systemStatus: 'normal'
      }));
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
                        threeDaysSummary={threeDaysSummary}
                      />
                    } 
                  />
                  <Route 
                    path="/control" 
                    element={<ControlPanel username={username} />} 
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