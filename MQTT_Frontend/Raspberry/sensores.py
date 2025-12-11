# datacenter_pi.py - Versión REAL para Raspberry Pi con sensores y actuadores físicos
# Funciona con DHT11, PIR, Servo (puerta) y Relé/Motor DC (ventilador)

import paho.mqtt.client as mqtt
import ssl
import os
import time
import adafruit_dht
import board
import RPi.GPIO as GPIO
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

# ====================== CONFIGURACIÓN MQTT ======================
broker = os.environ.get("MQTT_BROKER")
port = int(os.environ.get("MQTT_PORT", 8883))
username = os.environ.get("MQTT_USERNAME")
password = os.environ.get("MQTT_PASSWORD")

# Verificar que las variables de entorno estén cargadas
if not all([broker, username, password]):
    print("ERROR: Variables de entorno MQTT no configuradas correctamente")
    print(f"Broker: {broker}, Username: {username}")
    exit(1)

# Topics exactos que el backend espera
TOPICS = {
    "temperature": "/fiusac/datacenter/temperature",
    "humidity":    "/fiusac/datacenter/humidity",
    "access":      "/fiusac/datacenter/access",
    "fan":         "/fiusac/datacenter/fan",
    "maintenance": "/fiusac/datacenter/maintenance",
    "pir":         "/fiusac/datacenter/pir"
}

# ====================== PINES (ajusta según tu conexión física) ======================
SERVO_PIN   = 17   # Servo para puerta
FAN_PIN     = 22   # Relé o transistor para ventilador
PIR_PIN     = 23   # Sensor de movimiento PIR
DHT_PIN     = board.D24   # DHT11 (datos)

# ====================== CONFIGURACIÓN GPIO ======================
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

# Servo (puerta)
GPIO.setup(SERVO_PIN, GPIO.OUT)
servo_pwm = GPIO.PWM(SERVO_PIN, 50)  # 50Hz para servo
servo_pwm.start(0)

# Ventilador (relé o transistor)
GPIO.setup(FAN_PIN, GPIO.OUT)
GPIO.output(FAN_PIN, GPIO.LOW)  # Apagado inicial

# PIR (entrada)
GPIO.setup(PIR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)  # Agregado pull-down

dht_device = adafruit_dht.DHT11(board.D24)

# ====================== ESTADO ======================
puerta_abierta = False
ventilador_on = False
mantenimiento_on = False

# ====================== CONTROL FÍSICO ======================
def abrir_puerta():
    global puerta_abierta
    try:
        duty = 10.0  # ~180 grados (ajusta según tu servo)
        servo_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        servo_pwm.ChangeDutyCycle(0)  # Detener señal para evitar vibraciones
        puerta_abierta = True
        print("PUERTA ABIERTA (física)")
        client.publish(TOPICS["access"], "OPEN", qos=1)
    except Exception as e:
        print(f"Error abriendo puerta: {e}")

def cerrar_puerta():
    global puerta_abierta
    try:
        duty = 2.5   # ~0 grados (ajusta según tu servo)
        servo_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        servo_pwm.ChangeDutyCycle(0)  # Detener señal
        puerta_abierta = False
        print("PUERTA CERRADA (física)")
        client.publish(TOPICS["access"], "CLOSED", qos=1)
    except Exception as e:
        print(f"Error cerrando puerta: {e}")

def encender_ventilador():
    global ventilador_on
    try:
        GPIO.output(FAN_PIN, GPIO.HIGH)
        ventilador_on = True
        print("VENTILADOR ENCENDIDO (físico)")
    except Exception as e:
        print(f"Error encendiendo ventilador: {e}")

def apagar_ventilador():
    global ventilador_on
    try:
        GPIO.output(FAN_PIN, GPIO.LOW)
        ventilador_on = False
        print("VENTILADOR APAGADO (físico)")
    except Exception as e:
        print(f"Error apagando ventilador: {e}")

# ====================== CALLBACKS MQTT ======================
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Raspberry Pi conectada a HiveMQ Cloud")
        print("  Suscrita a comandos de control...")
        # Suscribirse a todos los topics de control
        client.subscribe(TOPICS["access"])
        client.subscribe(TOPICS["fan"])
        client.subscribe(TOPICS["maintenance"])
        print(f"  Suscrito a: {TOPICS['access']}")
        print(f"  Suscrito a: {TOPICS['fan']}")
        print(f"  Suscrito a: {TOPICS['maintenance']}")
    else:
        print(f"Error de conexión MQTT: {rc}")
        print("Códigos de error: 0=OK, 1=Protocolo, 2=ID inválido, 3=Servidor, 4=Credenciales")

def on_message(client, userdata, msg):
    global mantenimiento_on
    try:
        comando = msg.payload.decode().strip().upper()
        print(f"\n COMANDO RECIBIDO → {msg.topic}: {comando}")

        if msg.topic == TOPICS["access"]:
            if comando == "ON" or comando == "OPEN":  # Aceptar ambos formatos
                abrir_puerta()
            elif comando == "OFF" or comando == "CLOSED":
                cerrar_puerta()
            else:
                print(f"Comando no reconocido para acceso: {comando}")

        elif msg.topic == TOPICS["fan"]:
            if comando == "ON":
                encender_ventilador()
            elif comando == "OFF":
                apagar_ventilador()
            else:
                print(f"Comando no reconocido para ventilador: {comando}")

        elif msg.topic == TOPICS["maintenance"]:
            if comando == "ON":
                mantenimiento_on = True
                print("MODO MANTENIMIENTO ACTIVADO")
            elif comando == "OFF":
                mantenimiento_on = False
                print("MODO MANTENIMIENTO DESACTIVADO")
            else:
                print(f"Comando no reconocido para mantenimiento: {comando}")
                
    except Exception as e:
        print(f"Error procesando mensaje MQTT: {e}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print(" Conexión MQTT perdida. Intentando reconectar...")
        while True:
            try:
                client.reconnect()
                print(" Reconexión exitosa")
                break
            except:
                time.sleep(5)

# ====================== CLIENTE MQTT ======================
client_id = f"raspberry-pi-{int(time.time())}"  # ID único
client = mqtt.Client(client_id=client_id)
client.username_pw_set(username, password)

# Configurar TLS para HiveMQ Cloud
client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
client.tls_insecure_set(False)  # Mejor seguridad

# Configurar callbacks
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

# Configurar will message y keepalive
client.will_set(TOPICS["maintenance"], "OFF", qos=1, retain=False)
client.reconnect_delay_set(min_delay=1, max_delay=120)

print("Conectando al broker HiveMQ...")
print(f"Broker: {broker}:{port}")
print(f"Usuario: {username}")

try:
    client.connect(broker, port, keepalive=60)
    client.loop_start()
    time.sleep(2)  # Esperar conexión inicial
except Exception as e:
    print(f"Error conectando al broker: {e}")
    print("Verifica:")
    print("1. Conexión a internet")
    print("2. Credenciales MQTT en .env")
    print("3. Puerto 8883 abierto en firewall")
    exit(1)

# ====================== BUCLE PRINCIPAL (SENSORES REALES) ======================
print("\n" + "="*60)
print("RASPBERRY PI REAL INICIADA - Enviando datos reales cada 10 segundos")
print("Puedes controlar desde el panel web")
print("="*60)

last_pir_time = 0
last_sensor_time = 0
#dht_read_interval = 2  # Segundos entre lecturas DHT

try:
    while True:
        current_time = time.time()
        
        # Leer DHT11 (temperatura y humedad reales) cada dht_read_interval segundos
        if current_time - last_sensor_time >= 3:  # DHT11 no soporta lecturas más rápidas de ~2-3 segundos
            try:
                # La nueva librería usa propiedades directas
                temperature = dht_device.temperature
                humidity = dht_device.humidity

                if temperature is not None and humidity is not None:
                    client.publish(TOPICS["temperature"], f"{temperature:.1f}", qos=1)
                    client.publish(TOPICS["humidity"], f"{humidity:.1f}", qos=1)
                    print(f"Temperatura real: {temperature:.1f}°C")
                    print(f"Humedad real: {humidity:.1f}%")
                else:
                    print("Lectura DHT11 fallida (None)")
                    
            except RuntimeError as error:
                # Errores normales: checksum, timeout → ignorar
                print(f"DHT11 error (normal): {error.args[0]}")
            except Exception as error:
                print(f"Error grave DHT11: {error}")
                # En caso extremo, reiniciar el sensor
                dht_device.exit()
                time.sleep(2)
                dht_device = adafruit_dht.DHT11(board.D24)

            last_sensor_time = current_time
        
        # Leer PIR (movimiento real)
        try:
            if GPIO.input(PIR_PIN) == GPIO.LOW:
                if current_time - last_pir_time > 5:  # evitar spam (5 segundos)
                    client.publish(TOPICS["pir"], "1", qos=1)
                    print(" ¡MOVIMIENTO DETECTADO! (real)")
                    last_pir_time = current_time
        except Exception as e:
            print(f"Error leyendo PIR: {e}")
        
        # Publicar estado periódicamente
        if current_time - last_pir_time > 30:  # Publicar "no movimiento" cada 30s
            client.publish(TOPICS["pir"], "0", qos=1)
            last_pir_time = current_time
        
        time.sleep(1)  # Ciclo más rápido para mejor respuesta

except KeyboardInterrupt:
    print("\n\nDeteniendo Raspberry Pi...")
except Exception as e:
    print(f"\nError en bucle principal: {e}")
finally:
    print("\n" + "="*60)
    print("Limpiando GPIO y desconectando MQTT...")
    try:
        # Apagar todo antes de salir
        apagar_ventilador()
        cerrar_puerta()
        dht_device.exit()
        servo_pwm.stop()
        GPIO.cleanup()
        client.loop_stop()
        client.disconnect()
        print(" Raspberry Pi desconectada correctamente")
    except Exception as e:
        print(f"Error durante limpieza: {e}")