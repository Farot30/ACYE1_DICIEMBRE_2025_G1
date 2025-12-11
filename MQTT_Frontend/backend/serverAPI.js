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
  type: String,      // 'door', 'fan', 'maintenance', 'motion', 'alert'
  message: String,
  user: String,
  timestamp: { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', EventSchema);

//====================>MQTT<=================================================
const client = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: false
});

const TOPICS = {
  temperature: '/fiusac/datacenter/temperature',
  humidity: '/fiusac/datacenter/humidity',
  access: '/fiusac/datacenter/access',
  pir: '/fiusac/datacenter/pir',
  fan: '/fiusac/datacenter/fan',
  maintenance: '/fiusac/datacenter/maintenance'
};

let currentStatus = {
  door: 'CLOSED',
  fan: 'OFF',
  maintenance: false
};

client.on('connect', () => {
  console.log('Conectado a HiveMQ');
  client.subscribe(Object.values(TOPICS));
});

client.on('message', async (topic, message) => {
  const msg = message.toString().trim();
  const now = new Date();

  try {
    if (topic === TOPICS.temperature) {
      await Reading.create({ type: 'temperature', value: parseFloat(msg) });
    }

    if (topic === TOPICS.humidity) {
      await Reading.create({ type: 'humidity', value: parseFloat(msg) });
    }

    if (topic === TOPICS.access) {
      currentStatus.door = msg.toUpperCase();
      await Event.create({ type: 'door', message: `Puerta ${msg.toUpperCase()}`, user: 'Raspberry' });
    }

    if (topic === TOPICS.pir) {
      await Event.create({ type: 'motion', message: 'Movimiento detectado' });
    }

    if (topic === TOPICS.fan) {
      currentStatus.fan = msg.toUpperCase();
    }

    if (topic === TOPICS.maintenance) {
      currentStatus.maintenance = msg.toUpperCase() === 'ON';
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

// POSTs - Control (¡OJO A ESTAS DOS RUTAS!)
app.post('/api/door', (req, res) => {                    //Otto USA    /api/door
  const { action } = req.body;
  const cmd = action.toUpperCase();
  client.publish(TOPICS.access, cmd);
  Event.create({ type: 'door', message: `Puerta ${cmd}`, user: req.body.user || 'Web' });
  res.json({ success: true, action: cmd });
});

app.post('/api/door/open', (req, res) => {               //Nota: también soporta las rutas separadas
  client.publish(TOPICS.access, 'ON');
  Event.create({ type: 'door', message: 'Puerta abierta', user: req.body.user || 'Web' });
  res.json({ success: true });
});

app.post('/api/door/close', (req, res) => {
  client.publish(TOPICS.access, 'OFF');
  Event.create({ type: 'door', message: 'Puerta cerrada', user: req.body.user || 'Web' });
  res.json({ success: true });
});

app.post('/api/maintenance/toggle', async (req, res) => {
  const { enable, user } = req.body;
  const cmd = enable ? 'ON' : 'OFF';
  client.publish(TOPICS.maintenance, cmd);
  await Event.create({ type: 'maintenance', message: `Mantenimiento ${cmd}`, user: user || 'Web' });
  res.json({ success: true });
});

app.post('/api/fan/toggle', (req, res) => {
  const { enable } = req.body;
  const cmd = enable ? 'ON' : 'OFF';
  client.publish(TOPICS.fan, cmd);
  Event.create({ type: 'fan', message: `Ventilador ${cmd}` });
  res.json({ success: true });
});

//INICIAR
app.listen(port, () => {
  console.log(`Backend listo en http://localhost:${port}`);
  console.log(`Escuchando datos de Raspberry Pi vía HiveMQ`);
});