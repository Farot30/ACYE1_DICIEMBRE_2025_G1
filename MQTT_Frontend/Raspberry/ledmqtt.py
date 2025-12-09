import paho.mqtt.client as mqtt
import ssl
import os
from dotenv import load_dotenv

#Intentar importar GPIO solo si estamos en Raspberry Pi
try:
    import RPi.GPIO as GPIO
    RPI = True
except ImportError:
    print("Ejecutando en Windows: RPi.GPIO no está disponible.")
    RPI = False

load_dotenv()

LED_PIN = 4

#Configurar GPIO solo si estamos en Raspberry Pi
if RPI:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT)

broker = os.environ.get("MQTT_BROKER")
port = int(os.environ.get("MQTT_PORT"))
username = os.environ.get("MQTT_USERNAME")
password = os.environ.get("MQTT_PASSWORD")
topic = os.environ.get("MQTT_TOPIC")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectado al broker MQTT")
        client.subscribe(topic)
    else:
        print("Error de conexión:", rc)

def on_message(client, userdata, msg):
    message = msg.payload.decode()
    print(f"Mensaje recibido: {message}")

    if RPI:
        if message.lower() == "on":
            GPIO.output(LED_PIN, GPIO.HIGH)
            print("LED ENCENDIDO")
        elif message.lower() == "off":
            GPIO.output(LED_PIN, GPIO.LOW)
            print("LED APAGADO")
    else:
        print("(Simulado) Raspberry no disponible aquí.")

client = mqtt.Client()
client.username_pw_set(username, password)
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(broker, port)
    client.loop_forever()
except KeyboardInterrupt:
    print("Desconectando...")
finally:
    if RPI:
        GPIO.cleanup()
