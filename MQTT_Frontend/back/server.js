const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.API_PORT || 3001;

// Configuración MQTT
const brokerUrl = process.env.MQTT_BROKER;
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

// Middleware
app.use(cors());
app.use(express.json());

// Estado en memoria (en producción usar base de datos)
let systemState = {
  temperature: 22.5,
  humidity: 45,
  doorStatus: 'closed',
  maintenanceMode: false,
  fanStatus: false,
  pirMotion: false,
  lastUpdate: new Date().toISOString()
};

// Historial de eventos (en producción usar base de datos)
let events = [];
let temperatureHistory = [];
let humidityHistory = [];

// Conectar al broker MQTT
const client = mqtt.connect(brokerUrl, {
  username: username,
  password: password,
});

client.on('connect', () => {
  console.log('✅ Conectado exitosamente al broker HiveMQ');
  
  // Suscribirse a todos los topics
  const topics = [
    '/fiusac/datacenter/temperature',
    '/fiusac/datacenter/humidity',
    '/fiusac/datacenter/access',
    '/fiusac/datacenter/alerts',
    '/fiusac/datacenter/pir',
    '/fiusac/datacenter/maintenance',
    '/fiusac/datacenter/status',
    '/fiusac/datacenter/fan'
  ];
  
  topics.forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Error al suscribirse a ${topic}:`, err);
      } else {
        console.log(`📡 Suscrito a: ${topic}`);
      }
    });
  });
});

// Manejar mensajes MQTT recibidos
client.on('message', (topic, message) => {
  const msg = message.toString();
  console.log(`📨 Mensaje recibido en ${topic}: ${msg}`);
  
  try {
    switch(topic) {
      case '/fiusac/datacenter/temperature':
        const temp = parseFloat(msg);
        systemState.temperature = temp;
        temperatureHistory.push({
          value: temp,
          timestamp: new Date().toISOString()
        });
        // Mantener solo últimas 1000 lecturas
        if (temperatureHistory.length > 1000) {
          temperatureHistory.shift();
        }
        break;
        
      case '/fiusac/datacenter/humidity':
        const hum = parseFloat(msg);
        systemState.humidity = hum;
        humidityHistory.push({
          value: hum,
          timestamp: new Date().toISOString()
        });
        if (humidityHistory.length > 1000) {
          humidityHistory.shift();
        }
        break;
        
      case '/fiusac/datacenter/access':
        const accessData = JSON.parse(msg);
        systemState.doorStatus = accessData.status;
        events.push({
          id: Date.now(),
          type: 'Acceso',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('es-GT'),
          temp: systemState.temperature,
          description: accessData.description || 'Evento de acceso',
          timestamp: new Date().toISOString()
        });
        break;
        
      case '/fiusac/datacenter/pir':
        systemState.pirMotion = msg === 'MOTION_DETECTED';
        if (systemState.pirMotion) {
          events.push({
            id: Date.now(),
            type: 'Intrusión',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('es-GT'),
            temp: systemState.temperature,
            description: 'Movimiento detectado - PIR',
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case '/fiusac/datacenter/alerts':
        const alertData = JSON.parse(msg);
        events.push({
          id: Date.now(),
          type: alertData.type,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('es-GT'),
          temp: systemState.temperature,
          description: alertData.message,
          timestamp: new Date().toISOString()
        });
        break;
        
      case '/fiusac/datacenter/maintenance':
        systemState.maintenanceMode = msg === 'ON';
        break;
        
      case '/fiusac/datacenter/fan':
        systemState.fanStatus = msg === 'ON';
        break;
        
      case '/fiusac/datacenter/status':
        // Actualizar estado general del sistema
        const statusData = JSON.parse(msg);
        systemState = { ...systemState, ...statusData };
        break;
    }
    
    systemState.lastUpdate = new Date().toISOString();
    
  } catch (error) {
    console.error('❌ Error procesando mensaje MQTT:', error);
  }
});

client.on('error', (err) => {
  console.error('❌ Error MQTT:', err);
});

// ============================================
// ENDPOINTS DE CONSULTA
// ============================================

// Obtener temperatura
app.get('/api/temperature', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredData = temperatureHistory;
  
  if (startDate || endDate) {
    filteredData = temperatureHistory.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      if (startDate && readingDate < new Date(startDate)) return false;
      if (endDate && readingDate > new Date(endDate)) return false;
      return true;
    });
  }
  
  res.json({
    current: systemState.temperature,
    history: filteredData,
    count: filteredData.length
  });
});

// Obtener humedad
app.get('/api/humidity', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredData = humidityHistory;
  
  if (startDate || endDate) {
    filteredData = humidityHistory.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      if (startDate && readingDate < new Date(startDate)) return false;
      if (endDate && readingDate > new Date(endDate)) return false;
      return true;
    });
  }
  
  res.json({
    current: systemState.humidity,
    history: filteredData,
    count: filteredData.length
  });
});

// Obtener todos los eventos
app.get('/api/events', (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  
  let filteredEvents = events;
  
  if (startDate || endDate) {
    filteredEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      if (startDate && eventDate < new Date(startDate)) return false;
      if (endDate && eventDate > new Date(endDate)) return false;
      return true;
    });
  }
  
  // Ordenar por más reciente
  filteredEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    events: filteredEvents.slice(0, parseInt(limit)),
    total: filteredEvents.length
  });
});

// Filtrar eventos por tipo
app.get('/api/events/:type', (req, res) => {
  const { type } = req.params;
  const { limit = 50 } = req.query;
  
  const filteredEvents = events
    .filter(event => event.type.toLowerCase() === type.toLowerCase())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));
  
  res.json({
    type: type,
    events: filteredEvents,
    count: filteredEvents.length
  });
});

// Obtener estadísticas del día
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Filtrar eventos de hoy
  const todayEvents = events.filter(e => e.date === today);
  
  // Filtrar lecturas de temperatura de hoy
  const todayTemps = temperatureHistory.filter(t => 
    t.timestamp.startsWith(today)
  );
  
  const todayHums = humidityHistory.filter(h => 
    h.timestamp.startsWith(today)
  );
  
  // Calcular estadísticas
  const temps = todayTemps.map(t => t.value);
  const hums = todayHums.map(h => h.value);
  
  const stats = {
    date: today,
    maxTemp: temps.length > 0 ? Math.max(...temps) : null,
    minTemp: temps.length > 0 ? Math.min(...temps) : null,
    avgTemp: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) : null,
    maxHumidity: hums.length > 0 ? Math.max(...hums) : null,
    minHumidity: hums.length > 0 ? Math.min(...hums) : null,
    avgHumidity: hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(2) : null,
    totalAlarms: todayEvents.filter(e => e.type !== 'Acceso').length,
    totalAccess: todayEvents.filter(e => e.type === 'Acceso').length,
    totalEvents: todayEvents.length,
    eventsByType: {
      'Acceso': todayEvents.filter(e => e.type === 'Acceso').length,
      'Temperatura Alta': todayEvents.filter(e => e.type === 'Temperatura Alta').length,
      'Humedad Alta': todayEvents.filter(e => e.type === 'Humedad Alta').length,
      'Intrusión': todayEvents.filter(e => e.type === 'Intrusión').length
    }
  };
  
  res.json(stats);
});

// Obtener estado actual del sistema
app.get('/api/status', (req, res) => {
  res.json({
    ...systemState,
    mqtt_connected: client.connected
  });
});

// ============================================
// ENDPOINTS DE CONTROL
// ============================================

// Abrir puerta
app.post('/api/door/open', (req, res) => {
  const { user } = req.body;
  
  client.publish('/fiusac/datacenter/access', JSON.stringify({
    action: 'OPEN',
    user: user || 'Sistema',
    timestamp: new Date().toISOString()
  }), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Error al publicar comando de apertura:', err);
      return res.status(500).json({ 
        error: 'Error al enviar comando de apertura' 
      });
    }
    
    console.log('🚪 Comando OPEN enviado');
    
    res.json({ 
      success: true,
      action: 'open',
      message: 'Comando de apertura enviado exitosamente',
      timestamp: new Date().toISOString()
    });
  });
});

// Cerrar puerta
app.post('/api/door/close', (req, res) => {
  const { user } = req.body;
  
  client.publish('/fiusac/datacenter/access', JSON.stringify({
    action: 'CLOSE',
    user: user || 'Sistema',
    timestamp: new Date().toISOString()
  }), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Error al publicar comando de cierre:', err);
      return res.status(500).json({ 
        error: 'Error al enviar comando de cierre' 
      });
    }
    
    console.log('🚪 Comando CLOSE enviado');
    
    res.json({ 
      success: true,
      action: 'close',
      message: 'Comando de cierre enviado exitosamente',
      timestamp: new Date().toISOString()
    });
  });
});

// Toggle modo mantenimiento
app.post('/api/maintenance/toggle', (req, res) => {
  const { user, enable } = req.body;
  
  const action = enable ? 'ON' : 'OFF';
  
  client.publish('/fiusac/datacenter/maintenance', action, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Error al cambiar modo mantenimiento:', err);
      return res.status(500).json({ 
        error: 'Error al cambiar modo mantenimiento' 
      });
    }
    
    console.log(`🔧 Modo mantenimiento: ${action} por ${user || 'Sistema'}`);
    
    // Registrar evento
    events.push({
      id: Date.now(),
      type: 'Mantenimiento',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-GT'),
      temp: systemState.temperature,
      description: `Modo mantenimiento ${enable ? 'activado' : 'desactivado'} por ${user || 'Sistema'}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true,
      maintenanceMode: enable,
      user: user || 'Sistema',
      message: `Modo mantenimiento ${enable ? 'activado' : 'desactivado'}`,
      timestamp: new Date().toISOString()
    });
  });
});

// Toggle ventilador
app.post('/api/fan/toggle', (req, res) => {
  const { enable } = req.body;
  
  const action = enable ? 'ON' : 'OFF';
  
  client.publish('/fiusac/datacenter/fan', action, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Error al controlar ventilador:', err);
      return res.status(500).json({ 
        error: 'Error al controlar ventilador' 
      });
    }
    
    console.log(`💨 Ventilador: ${action}`);
    
    res.json({ 
      success: true,
      fanStatus: enable,
      message: `Ventilador ${enable ? 'encendido' : 'apagado'}`,
      timestamp: new Date().toISOString()
    });
  });
});

// ============================================
// ENDPOINT DE SALUD
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    mqtt_connected: client.connected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(`📡 Conectando al broker MQTT: ${brokerUrl}`);
});

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n⏹️  Cerrando servidor...');
  client.end();
  process.exit(0);
});