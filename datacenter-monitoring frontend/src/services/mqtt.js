// ==================== SERVICIO MQTT ====================
// TODO: Implementar conexión MQTT cuando el backend esté listo

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  connect(brokerUrl) {
    // TODO: Conectar con el broker MQTT
    // import mqtt from 'mqtt';
    // this.client = mqtt.connect(brokerUrl);
    
    // this.client.on('connect', () => {
    //   console.log('Conectado a MQTT');
    //   this.connected = true;
    //   this.subscribeToTopics();
    // });

    // this.client.on('message', (topic, message) => {
    //   this.handleMessage(topic, message);
    // });

    console.log('MQTT: Conexión pendiente de implementación');
  }

  subscribeToTopics() {
    // TODO: Suscribirse a los topics necesarios
    // const topics = [
    //   'datacenter/temperature',
    //   'datacenter/humidity',
    //   'datacenter/door',
    //   'datacenter/alerts',
    //   'datacenter/fan'
    // ];
    
    // topics.forEach(topic => {
    //   this.client.subscribe(topic);
    // });
  }

  handleMessage(topic, message) {
    // TODO: Procesar mensajes recibidos
    // const data = JSON.parse(message.toString());
    // return { topic, data };
  }

  publish(topic, message) {
    // TODO: Publicar mensajes al broker
    // if (this.connected) {
    //   this.client.publish(topic, JSON.stringify(message));
    // }
    
    console.log(`MQTT Publish: ${topic}`, message);
  }

  disconnect() {
    // TODO: Desconectar del broker
    // if (this.client) {
    //   this.client.end();
    // }
  }
}

export default new MQTTService();