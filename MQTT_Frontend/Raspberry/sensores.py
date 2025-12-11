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


# Debug: Mostrar configuración
print("=" * 60)
print("CONFIGURACION MQTT:")
print(f"Broker: {broker}")
print(f"Puerto: {port}")
print(f"Usuario: {username}")
print("=" * 60)

# Topics exactos que el backend espera
TOPICS = {
    "temperature": "/fiusac/datacenter/temperature",
    "humidity":    "/fiusac/datacenter/humidity",
    "access":      "/fiusac/datacenter/access",
    "fan":         "/fiusac/datacenter/fan",
    "maintenance": "/fiusac/datacenter/maintenance",
    "pir":         "/fiusac/datacenter/pir"
}
# ====================== PINES ======================
SERVO_PIN   = 12   # Servo para puerta
FAN_PIN     = 22   # Relé o transistor para ventilador
PIR_PIN     = 23   # Sensor de movimiento PIR
DHT_PIN     = board.D24   # DHT11 (datos)

# ====================== CONFIGURACIÓN GPIO ======================
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

# Servo (puerta)
GPIO.setup(SERVO_PIN, GPIO.OUT)
servo_pwm = GPIO.PWM(SERVO_PIN, 50)  # 50Hz para servo

servo_pwm.start(2.5)


# Ventilador (relé o transistor)
GPIO.setup(FAN_PIN, GPIO.OUT)
GPIO.output(FAN_PIN, GPIO.LOW)  # Apagado inicial

# PIR (entrada) - CORREGIDO: HIGH cuando detecta movimiento
GPIO.setup(PIR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

# Sensor DHT11
try:
    dht_device = adafruit_dht.DHT11(board.D24)
    print("[OK] Sensor DHT11 inicializado")
except Exception as e:
    print(f"[ERROR] Inicializando DHT11: {e}")
    dht_device = None

# ====================== ESTADO ======================
puerta_abierta = False
ventilador_on = False
mantenimiento_on = False

# ====================== CONTROL FÍSICO ======================
def abrir_puerta():
    global puerta_abierta
    try:

        duty = 12.5  # ~180 grados
        servo_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        servo_pwm.ChangeDutyCycle(0)
        puerta_abierta = True
        print("[FISICO] Puerta ABIERTA")
        # NO publicar aquí para evitar bucle
    except Exception as e:
        print(f"[ERROR] Abriendo puerta: {e}")

def cerrar_puerta():
    global puerta_abierta
    try:

        duty = 2.5   # ~0 grados
        servo_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        servo_pwm.ChangeDutyCycle(0)
        puerta_abierta = False
        print("[FISICO] Puerta CERRADA")
        # NO publicar aquí para evitar bucle
    except Exception as e:
        print(f"[ERROR] Cerrando puerta: {e}")


def encender_ventilador():
    global ventilador_on
    try:
        GPIO.output(FAN_PIN, GPIO.HIGH)
        ventilador_on = True
        print("[FISICO] Ventilador ENCENDIDO")
    except Exception as e:
        print(f"[ERROR] Encendiendo ventilador: {e}")

def apagar_ventilador():
    global ventilador_on
    try:
        GPIO.output(FAN_PIN, GPIO.LOW)
        ventilador_on = False
        print("[FISICO] Ventilador APAGADO")
    except Exception as e:
        print(f"[ERROR] Apagando ventilador: {e}")

# ====================== CALLBACKS MQTT ======================
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("[MQTT] CONECTADO a HiveMQ Cloud")
        print("  Suscribiendo a comandos...")
        # Suscribirse con QoS 1 para recibir mensajes garantizados
        client.subscribe(TOPICS["access"], qos=1)
        client.subscribe(TOPICS["fan"], qos=1)
        client.subscribe(TOPICS["maintenance"], qos=1)
        print(f"  [OK] Suscrito a: {TOPICS['access']}")
        print(f"  [OK] Suscrito a: {TOPICS['fan']}")
        print(f"  [OK] Suscrito a: {TOPICS['maintenance']}")
    else:
        print(f"[MQTT ERROR] Codigo: {rc}")

def on_message(client, userdata, msg):
    global mantenimiento_on
    try:
        comando = msg.payload.decode().strip().upper()
        print(f"\n[COMANDO RECIBIDO] {msg.topic}: {comando}")

        if msg.topic == TOPICS["access"]:
            if comando == "ON" or comando == "OPEN":
                print("  -> Ejecutando: ABRIR PUERTA")
                abrir_puerta()
            elif comando == "OFF" or comando == "CLOSED":
                print("  -> Ejecutando: CERRAR PUERTA")
                cerrar_puerta()
            else:
                print(f"  -> Comando no reconocido: {comando}")

        elif msg.topic == TOPICS["fan"]:
            if comando == "ON":
                print("  -> Ejecutando: ENCENDER VENTILADOR")
                encender_ventilador()
            elif comando == "OFF":
                print("  -> Ejecutando: APAGAR VENTILADOR")
                apagar_ventilador()
            else:
                print(f"  -> Comando no reconocido: {comando}")

        elif msg.topic == TOPICS["maintenance"]:
            if comando == "ON":
                mantenimiento_on = True
                print("  -> MODO MANTENIMIENTO ACTIVADO")
            elif comando == "OFF":
                mantenimiento_on = False
                print("  -> MODO MANTENIMIENTO DESACTIVADO")
            else:
                print(f"  -> Comando no reconocido: {comando}")
                
    except Exception as e:
        print(f"[ERROR] Procesando mensaje: {e}")

def on_disconnect(client, userdata, rc, properties=None):
    if rc != 0:
        print(f"[WARNING] Desconectado del broker. Codigo: {rc}")

# ====================== CLIENTE MQTT ======================
# Usar API VERSION 2
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"raspberry-pi-{int(time.time())}")
client.username_pw_set(username, password)

# Configurar TLS
client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
client.tls_insecure_set(False)

# Configurar callbacks
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

# Configurar reconexión automática
client.reconnect_delay_set(min_delay=1, max_delay=60)

print(f"\nConectando a {broker}:{port}...")

try:
    client.connect(broker, port, keepalive=60)
    client.loop_start()
    print("  Esperando conexion...")
    time.sleep(3)  # Esperar conexión inicial
except Exception as e:
    print(f"[ERROR] Conectando: {e}")
    exit(1)

# ====================== BUCLE PRINCIPAL ======================
print("\n" + "="*60)
print("RASPBERRY PI INICIADA")
print("  - Sensores DHT11 y PIR activos")
print("  - Esperando comandos del panel web...")
print("="*60)

last_pir_time = 0
last_sensor_time = 0

#dht_read_interval = 2  # Segundos entre lecturas DHT

try:
    while True:
        current_time = time.time()
        # Leer DHT11 cada 10 segundos
        if current_time - last_sensor_time >= 10:
            if dht_device:
                try:
                    temperature = dht_device.temperature
                    humidity = dht_device.humidity

                    if temperature is not None:
                        client.publish(TOPICS["temperature"], f"{temperature:.1f}", qos=1)
                        print(f"[DHT11] Temperatura: {temperature:.1f}C")
                    
                    if humidity is not None:
                        client.publish(TOPICS["humidity"], f"{humidity:.1f}", qos=1)
                        print(f"[DHT11] Humedad: {humidity:.1f}%")
                        
                except RuntimeError as error:
                    print(f"[DHT11] Error de lectura: {error.args[0]}")
                except Exception as error:
                    print(f"[DHT11] Error: {error}")
            
            last_sensor_time = current_time
        
        # Leer PIR - IMPORTANTE: ¿HIGH o LOW para tu sensor?
        try:
            # PRUEBA: Cambia entre GPIO.HIGH y GPIO.LOW según tu sensor
            if GPIO.input(PIR_PIN) == GPIO.LOW:  # Probablemente es LOW
                if current_time - last_pir_time > 5:
                    client.publish(TOPICS["pir"], "1", qos=1)
                    print("[PIR] Movimiento detectado!")
                    last_pir_time = current_time
        except Exception as e:
            print(f"[ERROR] PIR: {e}")
        
        time.sleep(0.1)  # Ciclo rápido para mejor respuesta

except KeyboardInterrupt:
    print("\n\n[INFO] Deteniendo Raspberry Pi...")
except Exception as e:
    print(f"\n[ERROR] En bucle principal: {e}")
finally:
    print("\n" + "="*60)
    print("Limpiando recursos...")
    try:
        # Apagar todo
        apagar_ventilador()
        cerrar_puerta()
        
        # Detener servo
        servo_pwm.stop()
        
        # Cerrar sensor DHT
        if dht_device:
            try:
                dht_device.exit()
            except:
                pass
        
        # Limpiar GPIO
        GPIO.cleanup()
        
        # Desconectar MQTT
        client.loop_stop()
        client.disconnect()
        
        print("[OK] Raspberry Pi desconectada correctamente")
    except Exception as e:
        print(f"[ERROR] Durante limpieza: {e}")
