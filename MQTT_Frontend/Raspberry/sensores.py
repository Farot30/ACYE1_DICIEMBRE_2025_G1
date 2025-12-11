import paho.mqtt.client as mqtt
import ssl
import os
import time
import random
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

#CONFIGURACIÓN
broker = os.environ.get("MQTT_BROKER")
port = int(os.environ.get("MQTT_PORT", 8883))
username = os.environ.get("MQTT_USERNAME")
password = os.environ.get("MQTT_PASSWORD")

# Topics exactos que tu backend espera
TOPICS = {
    "temperature": "/fiusac/datacenter/temperature",
    "humidity":    "/fiusac/datacenter/humidity",
    "access":        "/fiusac/datacenter/access",
    "fan":           "/fiusac/datacenter/fan",
    "maintenance":   "/fiusac/datacenter/maintenance",
    "pir":           "/fiusac/datacenter/pir"
}

#ESTADO SIMULADO
puerta_abierta = False
ventilador_on = False
mantenimiento_on = False 

#MENSAJES MQTT
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("SIMULADOR conectado a HiveMQ Cloud")
        print("Suscrito a comandos...")
        client.subscribe(TOPICS["access"])
        client.subscribe(TOPICS["fan"])
        client.subscribe(TOPICS["maintenance"])
    else:
        print(f"Error de conexión: {rc}")

def on_message(client, userdata, msg):
    global puerta_abierta, ventilador_on, mantenimiento_on
    comando = msg.payload.decode().strip().upper()
    print(f"\nCOMANDO RECIBIDO → {msg.topic}: {comando}")

    if msg.topic == TOPICS["access"]:
        if comando == "ON":  #Solo actúa en comandos puros, ignora confirmaciones
            puerta_abierta = True
            print("PUERTA ABIERTA (simulado)")
            client.publish(TOPICS["access"], "OPEN")  # Confirma solo una vez, diferente al comando
        elif comando == "OFF":
            puerta_abierta = False
            print("PUERTA CERRADA (simulado)")
            client.publish(TOPICS["access"], "CLOSED")  #Confirma solo una vez, diferente al comando

    elif msg.topic == TOPICS["fan"]:
        if comando == "ON":  #Solo comandos puros
            ventilador_on = True
            print("VENTILADOR ENCENDIDO (simulado)")

        elif comando == "OFF":
            ventilador_on = False
            print("VENTILADOR APAGADO (simulado)")


    elif msg.topic == TOPICS["maintenance"]:
        if comando == "ON":
            mantenimiento_on = True
            print("MODO MANTENIMIENTO ACTIVADO (simulado)")

        elif comando == "OFF":
            mantenimiento_on = False
            print("MODO MANTENIMIENTO DESACTIVADO (simulado)")


#CLIENTE
client = mqtt.Client()
client.username_pw_set(username, password)
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)
client.on_connect = on_connect
client.on_message = on_message

print("Conectando al broker HiveMQ...")
client.connect(broker, port)
client.loop_start()

#SIMULACIÓN DE SENSORES
print("\nSIMULADOR INICIADO - Publicando datos cada 8 segundos\n")
print("Puedes probar los botones del panel web ahora")
print("-" * 60)

try:
    while True:
        #Simular temperatura y humedad
        temp = round(22 + random.uniform(-5, 8), 1)
        hum = round(45 + random.uniform(-15, 25), 1)

        client.publish(TOPICS["temperature"], str(temp))
        client.publish(TOPICS["humidity"], str(hum))
        print(f"Enviado → Temperatura: {temp}°C | Humedad: {hum}%")

        #Simular movimiento cada ~30 segundos
        if random.random() < 0.03:  #3% de probabilidad por ciclo
            client.publish(TOPICS["pir"], "1")
            print("MOVIMIENTO DETECTADO! (simulado)")

        time.sleep(8)

except KeyboardInterrupt:
    print("\nSimulador detenido")
finally:
    client.loop_stop()
    client.disconnect()