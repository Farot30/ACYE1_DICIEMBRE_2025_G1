const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.API_PORT || 3001;

//CONEXIÓN A MONGODB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/datacenter');
mongoose.connection.once('open', () => console.log('MongoDB conectado'));

//MODELOS MONGODB
const ReadingSchema = new mongoose.Schema({
  type: String,      // 'temperature' | 'humidity'
  value: Number,
  timestamp: { type: Date, default: Date.now }
});
const Reading = mongoose.model('Reading', ReadingSchema);

const EventSchema = new mongoose.Schema({
  type: String,      // 'door', 'fan', 'maintenance', 'motion', 'alert', 'intrusion', 'lighting', 'system'
  message: String,
  user: String,
  timestamp: { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', EventSchema);

const AlarmSchema = new mongoose.Schema({
  type: String,      // 'temperature' | 'humidity' | 'intrusion'
  value: Number,
  status: String,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number
});
const Alarm = mongoose.model('Alarm', AlarmSchema);

const FanActivationSchema = new mongoose.Schema({
  mode: String,      // 'automatic' | 'manual'
  temperature: Number,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number
});
const FanActivation = mongoose.model('FanActivation', FanActivationSchema);

// NUEVO MODELO: Door Opening (5.4)
const DoorOpeningSchema = new mongoose.Schema({
  action: String,    // 'OPEN' | 'CLOSED'
  duration: Number,  // Tiempo que estuvo abierta (en segundos)
  timestamp: { type: Date, default: Date.now },
  user: String       // Quién realizó la acción
});
const DoorOpening = mongoose.model('DoorOpening', DoorOpeningSchema);

// NUEVO MODELO: Lighting Event (5.6)
const LightingEventSchema = new mongoose.Schema({
  action: String,    // 'ON' | 'OFF'
  timestamp: { type: Date, default: Date.now }
});
const LightingEvent = mongoose.model('LightingEvent', LightingEventSchema);

//====================>MQTT<=================================================
const client = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: false
});

const TOPICS = {
  temperature: '/fiusac/datacenter/temperature',
  humidity:    '/fiusac/datacenter/humidity',
  pir:         '/fiusac/datacenter/pir',
  temp_alarm:  '/fiusac/datacenter/temp_alarm',
  hum_alarm:   '/fiusac/datacenter/hum_alarm',
  alerts:      '/fiusac/datacenter/alerts',
  intrusion:   '/fiusac/datacenter/intrusion',
  lighting:    '/fiusac/datacenter/lighting',
  event:       '/fiusac/datacenter/event',
  door_time:   '/fiusac/datacenter/door_time',
  temp_alarm_off: '/fiusac/datacenter/temp_alarm_off',
  hum_alarm_off: '/fiusac/datacenter/hum_alarm_off',
  
  // COMANDOS (para publicar hacia Raspberry)
  access_command: '/fiusac/datacenter/command/access',
  fan_command:    '/fiusac/datacenter/command/fan',
  maintenance_command: '/fiusac/datacenter/command/maintenance',
  
  // ESTADOS (para suscribirse desde Raspberry)
  access_status: '/fiusac/datacenter/status/access',
  fan_status:    '/fiusac/datacenter/status/fan',
  maintenance_status: '/fiusac/datacenter/status/maintenance'
};

let currentStatus = {
  door: 'CLOSED',
  fan: 'OFF',
  maintenance: false,
  temperature: null,
  humidity: null,
  temperature_alarm: false,
  humidity_alarm: false,
  fan_mode: 'manual', // 'manual' o 'automatic'
  intrusion_alarm: false,
  lighting_on: false,
  last_motion: null,
  door_open_duration: 0,
  system_status: 'NORMAL' // 'NORMAL', 'MAINTENANCE', 'ALARM'
};

client.on('connect', () => {
  console.log('Conectado a HiveMQ');
  
  // Suscribirse SOLO a topics de SENSORES y ESTADOS
  // NO suscribirse a topics de COMANDO (esos los publicamos nosotros)
  const topicsToSubscribe = [
    TOPICS.temperature,
    TOPICS.humidity,
    TOPICS.pir,
    TOPICS.temp_alarm,
    TOPICS.hum_alarm,
    TOPICS.alerts,
    TOPICS.intrusion,
    TOPICS.lighting,
    TOPICS.event,
    TOPICS.door_time,
    TOPICS.access_status,    // ← NUEVO: estados de puerta
    TOPICS.fan_status,       // ← NUEVO: estados de ventilador
    TOPICS.maintenance_status // ← NUEVO: estados de mantenimiento
  ];
  
  client.subscribe(topicsToSubscribe);
  console.log(`Suscrito a ${topicsToSubscribe.length} topics`);
  console.log('Topics suscritos:', topicsToSubscribe);
});

client.on('message', async (topic, message) => {
  const msg = message.toString().trim();
  const now = new Date();

  console.log(`[MQTT RECIBIDO] ${topic} → ${msg}`);

  try {
    if (topic === TOPICS.temperature) {
      console.log(`Guardando temperatura: ${msg}`);
      const tempValue = parseFloat(msg);
      await Reading.create({ type: 'temperature', value: tempValue });
      currentStatus.temperature = tempValue;  
    }

    if (topic === TOPICS.humidity) {
      console.log(`Guardando humedad: ${msg}`);
      const humValue = parseFloat(msg);
      await Reading.create({ type: 'humidity', value: humValue });
      currentStatus.humidity = humValue; 
    }

    // NUEVO: Manejar alarma de intrusión (5.5)
    if (topic === TOPICS.intrusion) {
      if (msg === 'ACTIVE') {
        currentStatus.intrusion_alarm = true;
        currentStatus.system_status = 'ALARM';
        
        await Alarm.create({
          type: 'intrusion',
          value: 1, // Valor binario para intrusión
          status: 'active',
          startTime: now
        });
        
        await Event.create({
          type: 'intrusion',
          message: 'ALERTA CRITICA: Intrusión detectada con puerta cerrada',
          user: 'System'
        });
        
        console.log('Alarma de intrusión activada');
        
      } else if (msg === 'RESOLVED') {
        currentStatus.intrusion_alarm = false;
        // Solo cambiar a NORMAL si no hay otras alarmas
        if (!currentStatus.temperature_alarm && !currentStatus.humidity_alarm) {
          currentStatus.system_status = 'NORMAL';
        }
        
        const activeAlarm = await Alarm.findOne({ 
          type: 'intrusion', 
          status: 'active' 
        }).sort({ startTime: -1 });
        
        if (activeAlarm) {
          activeAlarm.status = 'resolved';
          activeAlarm.endTime = now;
          activeAlarm.duration = Math.floor((now - activeAlarm.startTime) / 1000);
          await activeAlarm.save();
        }
        
        await Event.create({
          type: 'intrusion',
          message: 'Alarma de intrusión resuelta',
          user: 'System'
        });
      }
      updateSystemStatus()
    }

    // NUEVO: Manejar iluminación automática (5.6)
    if (topic === TOPICS.lighting) {
      if (msg === 'ON') {
        currentStatus.lighting_on = true;
        
        await LightingEvent.create({
          action: 'ON',
          timestamp: now
        });
        
        await Event.create({
          type: 'lighting',
          message: 'Iluminación automática activada',
          user: 'System'
        });
        
        console.log('Iluminación automática activada');
        
      } else if (msg === 'OFF') {
        currentStatus.lighting_on = false;
        
        await LightingEvent.create({
          action: 'OFF',
          timestamp: now
        });
        
        console.log('Iluminación automática desactivada');
      }
    }

    // NUEVO: Manejar eventos generales (5.5)
    if (topic === TOPICS.event) {
      let eventType = 'system';
      
      if (msg.includes('PERSONAL TECNICO') || msg.includes('Trabajando')) {
        eventType = 'motion';
      } else if (msg.includes('MODO MANTENIMIENTO')) {
        eventType = 'maintenance';
      }
      
      await Event.create({
        type: eventType,
        message: msg,
        user: 'System',
        timestamp: now
      });
    }

    // NUEVO: Manejar tiempo de puerta abierta (5.4)
    if (topic === TOPICS.door_time) {
      const duration = parseFloat(msg);
      currentStatus.door_open_duration = duration;
      
      // Guardar en DoorOpening si la duración es mayor a 0
      if (duration > 0) {
        await DoorOpening.create({
          action: 'OPEN',
          duration: duration,
          timestamp: now,
          user: 'System'
        });
        
        console.log(`Puerta estuvo abierta por ${duration} segundos`);
      }
    }

    // Estados de puerta desde Raspberry
    if (topic === TOPICS.access_status) {
      const msgUpper = msg.toUpperCase();
      
      if (msgUpper === "OPEN" || msgUpper === "ON") {
        currentStatus.door = "OPEN";
        console.log('[ESTADO] Puerta: OPEN (desde Raspberry)');
        
        // Solo crear evento si fue automático (para comandos manuales ya creamos evento)
        // O puedes decidir siempre crear evento:
        await Event.create({
          type: 'door',
          message: 'Puerta ABIERTA',
          user: 'Raspberry'
        });
        
      } else if (msgUpper === "CLOSED" || msgUpper === "OFF") {
        currentStatus.door = "CLOSED";
        console.log('[ESTADO] Puerta: CLOSED (desde Raspberry)');
        
        await Event.create({
          type: 'door',
          message: 'Puerta CERRADA',
          user: 'Raspberry'
        });
      }
    }

    // Estados de ventilador desde Raspberry
    if (topic === TOPICS.fan_status) {
      const fanState = msg.toUpperCase();
      const previousState = currentStatus.fan;
      currentStatus.fan = fanState;
      
      console.log(`[ESTADO] Ventilador: ${fanState} (desde Raspberry)`);
      
      // Solo procesar cambios de estado
      if (fanState === 'ON' && previousState !== 'ON') {
        // Determinar si es automático (temperatura ≥24) o manual
        const isAutomatic = currentStatus.temperature >= 24.0;
        currentStatus.fan_mode = isAutomatic ? 'automatic' : 'manual';
        
        await FanActivation.create({
          mode: currentStatus.fan_mode,
          temperature: currentStatus.temperature,
          startTime: now
        });
        
        // Crear evento (para estados automáticos, manuales ya tienen evento)
        await Event.create({
          type: 'fan',
          message: `Ventilador ${isAutomatic ? 'activado automáticamente' : 'activado'}`,
          user: isAutomatic ? 'System' : 'Raspberry'
        });
        
      } else if (fanState === 'OFF' && previousState === 'ON') {
        // Desactivación
        const lastActivation = await FanActivation.findOne({ 
          endTime: null 
        }).sort({ startTime: -1 });
        
        if (lastActivation) {
          lastActivation.endTime = now;
          lastActivation.duration = Math.floor((now - lastActivation.startTime) / 1000);
          await lastActivation.save();
        }
        
        await Event.create({
          type: 'fan',
          message: 'Ventilador desactivado',
          user: 'Raspberry'
        });
      }
    }

    // Estados de mantenimiento desde Raspberry
    if (topic === TOPICS.maintenance_status) {
      const isMaintenance = msg.toUpperCase() === 'ON';
      currentStatus.maintenance = isMaintenance;
      
      console.log(`[ESTADO] Mantenimiento: ${isMaintenance ? 'ON' : 'OFF'} (desde Raspberry)`);
      
      await Event.create({
        type: 'maintenance',
        message: `Modo mantenimiento ${isMaintenance ? 'activado:' : 'desactivado'}`,
        user: 'fiusac_datacenter'
      });
      
      // Actualizar estado del sistema
      updateSystemStatus();
    }

    if (topic === TOPICS.pir) {
      await Event.create({ type: 'motion', message: 'Movimiento detectado' });
      currentStatus.last_motion = now;  // <-- AGREGAR ESTO
      console.log('Movimiento detectado y registrado');
    }

    
    // Handler unificado para temp_alarm
    if (topic === TOPICS.temp_alarm) {
      if (msg === 'OFF' || msg === 'DESACTIVADO') {
        // Desactivar alarma
        currentStatus.temperature_alarm = false;
        
        // Buscar y cerrar alarma activa
        const activeAlarm = await Alarm.findOne({ 
          type: 'temperature', 
          status: 'active' 
        }).sort({ startTime: -1 });
        
        if (activeAlarm) {
          activeAlarm.status = 'resolved';
          activeAlarm.endTime = now;
          activeAlarm.duration = Math.floor((now - activeAlarm.startTime) / 1000);
          await activeAlarm.save();
        }
        
        await Event.create({
          type: 'alert',
          message: 'Alarma de temperatura desactivada',
          user: 'System'
        });
        
      } else {
        // Activar alarma (msg es el valor numérico)
        currentStatus.temperature_alarm = true;
        const tempValue = parseFloat(msg);
        currentStatus.temperature = tempValue;
        
        await Alarm.create({
          type: 'temperature',
          value: tempValue,
          status: 'active',
          startTime: now
        });
        
        await Event.create({
          type: 'alert',
          message: `ALERTA: Temperatura crítica ${tempValue}°C`,
          user: 'System'
        });
      }
      updateSystemStatus()
    }


    // NUEVO: Manejar alarmas de humedad
    // Handler similar para hum_alarm
    if (topic === TOPICS.hum_alarm) {
      if (msg === 'OFF' || msg === 'DESACTIVADO') {
        // Desactivar alarma
        currentStatus.humidity_alarm = false;
        
        const activeAlarm = await Alarm.findOne({ 
          type: 'humidity', 
          status: 'active' 
        }).sort({ startTime: -1 });
        
        if (activeAlarm) {
          activeAlarm.status = 'resolved';
          activeAlarm.endTime = now;
          activeAlarm.duration = Math.floor((now - activeAlarm.startTime) / 1000);
          await activeAlarm.save();
        }
        
      } else {
        // Activar alarma
        currentStatus.humidity_alarm = true;
        const humValue = parseFloat(msg);
        currentStatus.humidity = humValue;
        
        await Alarm.create({
          type: 'humidity',
          value: humValue,
          status: 'active',
          startTime: now
        });
      }
      updateSystemStatus()
    }

    function updateSystemStatus() {
      if (currentStatus.intrusion_alarm || 
          currentStatus.temperature_alarm || 
          currentStatus.humidity_alarm) {
        currentStatus.system_status = 'ALARM';
      } else if (currentStatus.maintenance) {
        currentStatus.system_status = 'MAINTENANCE';
      } else {
        currentStatus.system_status = 'NORMAL';
      }
    }
  

    // ACTUALIZAR: Handler para alarmas - actualizar system_status
    if (topic === TOPICS.temp_alarm || topic === TOPICS.hum_alarm) {
      currentStatus.system_status = 'ALARM';
      updateSystemStatus()
    }
    
    if (topic === TOPICS.temp_alarm_off || topic === TOPICS.hum_alarm_off) {
      // Solo cambiar a NORMAL si no hay otras alarmas
      if (!currentStatus.temperature_alarm && !currentStatus.humidity_alarm && !currentStatus.intrusion_alarm) {
        currentStatus.system_status = currentStatus.maintenance ? 'MAINTENANCE' : 'NORMAL';
      }
    }

    // NUEVO: Alertas generales
    if (topic === TOPICS.alerts) {
      let alertType = 'alert';
      
      // Clasificar alertas basado en contenido
      if (msg.includes('Temperatura')) alertType = 'temperature_alert';
      else if (msg.includes('Humedad')) alertType = 'humidity_alert';
      else if (msg.includes('Intrusión')) alertType = 'intrusion_alert';
      
      await Event.create({
        type: alertType,
        message: msg,
        user: 'System',
        timestamp: now
      });
    }

  } catch (e) {
    console.error('Error procesando mensaje MQTT:', e);
  }
});

// MIDDLEWARE
app.use(cors());
app.use(express.json());

//RUTAS QUE DEBO DE PASARLE A OTTO

//GETs - Lecturas (OJO: Extraer datos de MongoDB)
app.get('/api/temperature', async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { type: 'temperature' };
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  const data = await Reading.find(query).sort({ timestamp: -1 });
  res.json(data);
});

app.get('/api/humidity', async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { type: 'humidity' };
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  const data = await Reading.find(query).sort({ timestamp: -1 });
  res.json(data);
});

app.get('/api/events', async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  const query = {};
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  const data = await Event.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));
  res.json(data);
});

app.get('/api/events/:type', async (req, res) => {
  const data = await Event.find({ type: req.params.type })
    .sort({ timestamp: -1 })
    .limit(req.query.limit || 50);
  res.json(data);
});

app.get('/api/stats', (req, res) => {
  res.json({
    doorStatus: currentStatus.door,
    fanStatus: currentStatus.fan,
    maintenanceMode: currentStatus.maintenance,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => res.json({ status: 'OK' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', mqtt: client.connected }));

// GET: Obtener estado completo del sistema (ACTUALIZADA)
app.get('/api/system/status', (req, res) => {
  res.json({
    door: currentStatus.door,
    fan: currentStatus.fan,
    maintenance: currentStatus.maintenance,
    temperature: currentStatus.temperature,
    humidity: currentStatus.humidity,
    temperature_alarm: currentStatus.temperature_alarm,
    humidity_alarm: currentStatus.humidity_alarm,
    intrusion_alarm: currentStatus.intrusion_alarm,
    lighting_on: currentStatus.lighting_on,
    fan_mode: currentStatus.fan_mode,
    door_open_duration: currentStatus.door_open_duration,
    system_status: currentStatus.system_status,
    timestamp: new Date().toISOString()
  });
});

// GET: Obtener alarmas activas
app.get('/api/alarms/active', async (req, res) => {
  try {
    const activeAlarms = await Alarm.find({ status: 'active' }).sort({ startTime: -1 });
    res.json(activeAlarms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener historial de alarmas
app.get('/api/alarms/history', async (req, res) => {
  const { type, startDate, endDate, limit = 50 } = req.query;
  const query = { status: 'resolved' };
  
  if (type) query.type = type;
  if (startDate) query.startTime = { ...query.startTime, $gte: new Date(startDate) };
  if (endDate) query.startTime = { ...query.startTime, $lte: new Date(endDate) };
  
  try {
    const alarms = await Alarm.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit));
    res.json(alarms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener activaciones del ventilador
app.get('/api/fan/activations', async (req, res) => {
  const { mode, startDate, endDate, limit = 50 } = req.query;
  const query = {};
  
  if (mode) query.mode = mode;
  if (startDate) query.startTime = { ...query.startTime, $gte: new Date(startDate) };
  if (endDate) query.startTime = { ...query.startTime, $lte: new Date(endDate) };
  
  try {
    const activations = await FanActivation.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit));
    res.json(activations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Forzar apagado de alarma (emergencia)
app.post('/api/alarms/force-reset', async (req, res) => {
  const { type, user = 'Admin' } = req.body;
  
  try {
    // Publicar comando MQTT para apagar alarma en Raspberry
    if (type === 'temperature') {
      client.publish(TOPICS.temp_alarm, 'OFF', { qos: 1 });  // ← CORREGIDO!
      currentStatus.temperature_alarm = false;
    } else if (type === 'humidity') {
      client.publish(TOPICS.hum_alarm, 'OFF', { qos: 1 });   // ← CORREGIDO!
      currentStatus.humidity_alarm = false;
    } else if (type === 'intrusion') {
      client.publish(TOPICS.intrusion, 'RESOLVED', { qos: 1 });
      currentStatus.intrusion_alarm = false;
    }
    
    updateSystemStatus(); 

    await Event.create({
      type: 'alert',
      message: `Alarma ${type} desactivada manualmente por ${user}`,
      user
    });
    
    res.json({ success: true, message: `Alarma ${type} desactivada manualmente` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Métricas del día
app.get('/api/metrics/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const temperatureReadings = await Reading.find({
      type: 'temperature',
      timestamp: { $gte: today, $lt: tomorrow }
    }).sort({ timestamp: 1 });
    
    const humidityReadings = await Reading.find({
      type: 'humidity',
      timestamp: { $gte: today, $lt: tomorrow }
    }).sort({ timestamp: 1 });
    
    const todayAlarms = await Alarm.find({
      startTime: { $gte: today, $lt: tomorrow }
    });
    
    const metrics = {
      temperature: {
        count: temperatureReadings.length,
        max: temperatureReadings.length > 0 ? Math.max(...temperatureReadings.map(r => r.value)) : null,
        min: temperatureReadings.length > 0 ? Math.min(...temperatureReadings.map(r => r.value)) : null,
        avg: temperatureReadings.length > 0 ? 
          temperatureReadings.reduce((sum, r) => sum + r.value, 0) / temperatureReadings.length : null
      },
      humidity: {
        count: humidityReadings.length,
        max: humidityReadings.length > 0 ? Math.max(...humidityReadings.map(r => r.value)) : null,
        min: humidityReadings.length > 0 ? Math.min(...humidityReadings.map(r => r.value)) : null,
        avg: humidityReadings.length > 0 ? 
          humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length : null
      },
      alarms: {
        temperature: todayAlarms.filter(a => a.type === 'temperature').length,
        humidity: todayAlarms.filter(a => a.type === 'humidity').length,
        total: todayAlarms.length
      }
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================== NUEVAS RUTAS API (5.4-5.8) ======================

// GET: Obtener estado completo extendido
app.get('/api/system/status/extended', (req, res) => {
  res.json({
    door: currentStatus.door,
    fan: currentStatus.fan,
    maintenance: currentStatus.maintenance,
    temperature: currentStatus.temperature,
    humidity: currentStatus.humidity,
    temperature_alarm: currentStatus.temperature_alarm,
    humidity_alarm: currentStatus.humidity_alarm,
    intrusion_alarm: currentStatus.intrusion_alarm,
    lighting_on: currentStatus.lighting_on,
    fan_mode: currentStatus.fan_mode,
    door_open_duration: currentStatus.door_open_duration,
    system_status: currentStatus.system_status,
    last_motion: currentStatus.last_motion,
    timestamp: new Date().toISOString()
  });
});

// GET: Obtener historial de aperturas de puerta (5.4)
app.get('/api/door/history', async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  const query = {};
  
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  
  try {
    const history = await DoorOpening.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener estadísticas de puerta (5.4)
app.get('/api/door/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayOpenings = await DoorOpening.find({
      timestamp: { $gte: today, $lt: tomorrow },
      action: 'OPEN'
    });
    
    const stats = {
      total_openings_today: todayOpenings.length,
      avg_duration_today: todayOpenings.length > 0 ? 
        todayOpenings.reduce((sum, o) => sum + o.duration, 0) / todayOpenings.length : 0,
      max_duration_today: todayOpenings.length > 0 ? 
        Math.max(...todayOpenings.map(o => o.duration)) : 0,
      total_duration_today: todayOpenings.reduce((sum, o) => sum + o.duration, 0)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener historial de iluminación (5.6)
app.get('/api/lighting/history', async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  const query = {};
  
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  
  try {
    const history = await LightingEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener eventos de movimiento (5.5)
app.get('/api/motion/events', async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  const query = { type: 'motion' };
  
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  
  try {
    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener eventos de intrusión (5.5)
app.get('/api/intrusion/events', async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  const query = { type: 'intrusion' };
  
  if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
  if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
  
  try {
    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Desactivar alarma de intrusión manualmente
app.post('/api/intrusion/force-reset', async (req, res) => {
  const { user = 'Admin' } = req.body;
  
  try {
    // Publicar comando MQTT para apagar alarma en Raspberry
    client.publish(TOPICS.intrusion, 'RESOLVED', { qos: 1 });
    currentStatus.intrusion_alarm = false;
    
    // Actualizar system_status si no hay otras alarmas
    if (!currentStatus.temperature_alarm && !currentStatus.humidity_alarm) {
      currentStatus.system_status = currentStatus.maintenance ? 'MAINTENANCE' : 'NORMAL';
    }
    
    await Event.create({
      type: 'intrusion',
      message: 'Alarma de intrusión desactivada manualmente',
      user
    });
    
    res.json({ success: true, message: 'Alarma de intrusión desactivada manualmente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Métricas extendidas del día
app.get('/api/metrics/today/extended', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Métricas existentes
    const temperatureReadings = await Reading.find({
      type: 'temperature',
      timestamp: { $gte: today, $lt: tomorrow }
    }).sort({ timestamp: 1 });
    
    const humidityReadings = await Reading.find({
      type: 'humidity',
      timestamp: { $gte: today, $lt: tomorrow }
    }).sort({ timestamp: 1 });
    
    const todayAlarms = await Alarm.find({
      startTime: { $gte: today, $lt: tomorrow }
    });
    
    // Nuevas métricas (5.4-5.8)
    const doorOpenings = await DoorOpening.find({
      timestamp: { $gte: today, $lt: tomorrow },
      action: 'OPEN'
    });
    
    const lightingEvents = await LightingEvent.find({
      timestamp: { $gte: today, $lt: tomorrow }
    });
    
    const motionEvents = await Event.find({
      type: 'motion',
      timestamp: { $gte: today, $lt: tomorrow }
    });
    
    const metrics = {
      temperature: {
        count: temperatureReadings.length,
        max: temperatureReadings.length > 0 ? Math.max(...temperatureReadings.map(r => r.value)) : null,
        min: temperatureReadings.length > 0 ? Math.min(...temperatureReadings.map(r => r.value)) : null,
        avg: temperatureReadings.length > 0 ? 
          temperatureReadings.reduce((sum, r) => sum + r.value, 0) / temperatureReadings.length : null
      },
      humidity: {
        count: humidityReadings.length,
        max: humidityReadings.length > 0 ? Math.max(...humidityReadings.map(r => r.value)) : null,
        min: humidityReadings.length > 0 ? Math.min(...humidityReadings.map(r => r.value)) : null,
        avg: humidityReadings.length > 0 ? 
          humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length : null
      },
      alarms: {
        temperature: todayAlarms.filter(a => a.type === 'temperature').length,
        humidity: todayAlarms.filter(a => a.type === 'humidity').length,
        intrusion: todayAlarms.filter(a => a.type === 'intrusion').length,
        total: todayAlarms.length
      },
      // Nuevas métricas
      door: {
        openings: doorOpenings.length,
        avg_duration: doorOpenings.length > 0 ? 
          doorOpenings.reduce((sum, o) => sum + o.duration, 0) / doorOpenings.length : 0,
        total_time_open: doorOpenings.reduce((sum, o) => sum + o.duration, 0)
      },
      lighting: {
        activations: lightingEvents.filter(e => e.action === 'ON').length,
        total_time: lightingEvents.length > 0 ? 'Calculado por eventos' : 0
      },
      security: {
        motion_detections: motionEvents.length,
        intrusions: todayAlarms.filter(a => a.type === 'intrusion').length
      }
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Control manual de iluminación (opcional)
app.post('/api/lighting/control', async (req, res) => {
  const { action, user = 'Web' } = req.body;
  const cmd = action.toUpperCase();
  
  if (cmd !== 'ON' && cmd !== 'OFF') {
    return res.status(400).json({ 
      success: false, 
      error: 'Comando inválido. Use: ON u OFF' 
    });
  }
  
  // Nota: Esto es opcional, ya que la iluminación es automática
  // Pero podrías enviar un comando MQTT si quisieras control manual
  // client.publish(TOPICS.lighting, cmd, { qos: 1 });
  
  await Event.create({
    type: 'lighting',
    message: `Iluminación ${cmd === 'ON' ? 'activada' : 'desactivada'} manualmente`,
    user
  });
  
  res.json({ 
    success: true, 
    action: cmd,
    message: `Comando de iluminación: ${cmd}` 
  });
});


// POSTs - Control (¡OJO A ESTAS DOS RUTAS!)
app.post('/api/door', (req, res) => {
  const { action, user = 'Web' } = req.body;
  const cmd = action.toUpperCase();
  
  let mqttCmd;
  if (cmd === 'OPEN' || cmd === 'ON') {
    mqttCmd = 'ON';
  } else if (cmd === 'CLOSE' || cmd === 'CLOSED' || cmd === 'OFF') {
    mqttCmd = 'OFF';
  } else {
    return res.status(400).json({ 
      success: false, 
      error: 'Comando inválido' 
    });
  }
  
  // Publicar en topic de COMANDO (nuevo)
  client.publish(TOPICS.access_command, mqttCmd, { qos: 1 });
  
  // Crear evento INMEDIATO (acción del usuario)
  Event.create({
    type: 'door',
    message: `Puerta ${cmd === 'OPEN' ? 'abriendo' : 'cerrando'}`,
    user: user
  });
  
  res.json({ 
    success: true, 
    action: cmd,
    message: `Comando enviado: ${mqttCmd}` 
  });
});

app.post('/api/fan/toggle', (req, res) => {
  const { enable } = req.body;
  const cmd = enable ? 'ON' : 'OFF';
  
  // Publicar en topic de COMANDO (nuevo)
  client.publish(TOPICS.fan_command, cmd, { qos: 1 });
  
  // Crear evento INMEDIATO (acción del usuario)
  Event.create({
    type: 'fan',
    message: `Ventilador ${enable ? 'encendido' : 'apagado'} manualmente`,
    user: 'Web'
  });
  
  res.json({ success: true, command: cmd });
});

app.post('/api/maintenance/toggle', async (req, res) => {
  const { enable, user = 'Web' } = req.body;
  const cmd = enable ? 'ON' : 'OFF';
  
  // Publicar en topic de COMANDO (nuevo)
  client.publish(TOPICS.maintenance_command, cmd, { qos: 1 });
  
  // Crear evento INMEDIATO (acción del usuario)
  await Event.create({
    type: 'maintenance',
    message: `Modo mantenimiento ${enable ? 'activado' : 'desactivado'}`,
    user: user || 'Web'
  });
  
  res.json({ success: true, command: cmd });
});



//INICIAR
app.listen(port, () => {
  console.log(`Backend listo en http://localhost:${port}`);
  console.log(`Escuchando datos de Raspberry Pi vía HiveMQ`);
});