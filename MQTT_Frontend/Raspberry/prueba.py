import paho.mqtt.client as mqtt
import ssl
import time
import os
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

BROKER = os.getenv("MQTT_BROKER")
PORT = int(os.getenv("MQTT_PORT", 8883))
USER = os.getenv("MQTT_USERNAME")
PASS = os.getenv("MQTT_PASSWORD")

TOPIC = "/fiusac/datacenter/access"

print("Broker:", BROKER)
print("Puerto:", PORT)
print("Usuario:", USER)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Conectado a HiveMQ Cloud")
        client.subscribe(TOPIC)
    else:
        print("❌ Error de conexión:", rc)

def on_message(client, userdata, msg):
    print("📩 Mensaje recibido:", msg.payload.decode())

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(USER, PASS)

# TLS obligatorio en HiveMQ Cloud
client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

client.on_connect = on_connect
client.on_message = on_message

print("Conectando...")
client.connect(BROKER, PORT)
client.loop_start()

while True:
    time.sleep(1)
