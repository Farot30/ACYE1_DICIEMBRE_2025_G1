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
from rpi_lcd import LCD

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
    "pir":         "/fiusac/datacenter/pir",
    "temp_alarm":  "/fiusac/datacenter/temp_alarm",
    "hum_alarm":   "/fiusac/datacenter/hum_alarm",
    "alerts":      "/fiusac/datacenter/alerts",
    "intrusion":   "/fiusac/datacenter/intrusion",
    "lighting":    "/fiusac/datacenter/lighting",
    "event":       "/fiusac/datacenter/event",
    "door_time":   "/fiusac/datacenter/door_time"
}
# ====================== PINES ======================
SERVO_PIN   = 12   # Servo para puerta
FAN_PIN     = 15   # Relé o transistor para ventilador
PIR_PIN     = 26   # Sensor de movimiento PIR
DHT_PIN     = board.D18   # DHT11 (datos)

BUZZER_PIN  = 14  # Buzzer para alarmas

#LED RGB 1
LED_R_PIN   = 17   # LED RGB - Rojo
LED_G_PIN   = 27   # LED RGB - Verde
LED_B_PIN   = 22   # LED RGB - Azul

#NUEVOS PINES PARA 5.6 (LEDs blancos de iluminación)
LED_WHITE_1 = 8    # LED blanco 1
LED_WHITE_2 = 7    # LED blanco 2
LED_WHITE_3 = 1   # LED blanco 3

# PIN para LED de estado (5.7) - LED RGB 2
LED_STATUS_R = 19   # LED de estado ROJO (separado o usar los existentes)
LED_STATUS_G = 16   # LED de estado VERDE
LED_STATUS_B = 20   # LED de estado AZUL

# ====================== INICIALIZACIÓN LCD ======================
lcd_available = False  # Definir aquí primero
try:
    lcd = LCD()  # Inicializa LCD I2C con dirección por defecto (0x27)
    lcd.clear()
    lcd.text("Data Center FIUSAC", 1)  # Línea 1
    lcd.text("Inicializando...", 2)    # Línea 2
    lcd.text("Sensores: OK", 3)        # Línea 3
    lcd.text("MQTT: Conectando", 4)    # Línea 4
    print("[OK] LCD 20x4 inicializada")
    lcd_available = True
except Exception as e:
    print(f"[ERROR] Inicializando LCD: {e}")
    lcd = None  # Asegurar que lcd esté definido
    lcd_available = False

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

# NUEVOS COMPONENTES PARA ALARMAS
GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.output(BUZZER_PIN, GPIO.LOW)

# LED RGB
GPIO.setup(LED_R_PIN, GPIO.OUT)
GPIO.setup(LED_G_PIN, GPIO.OUT)
GPIO.setup(LED_B_PIN, GPIO.OUT)

# LEDs blancos para iluminación automática
GPIO.setup(LED_WHITE_1, GPIO.OUT)
GPIO.setup(LED_WHITE_2, GPIO.OUT)
GPIO.setup(LED_WHITE_3, GPIO.OUT)

# LED de estado del sistema (5.7) 
GPIO.setup(LED_STATUS_R, GPIO.OUT)
GPIO.setup(LED_STATUS_G, GPIO.OUT)
GPIO.setup(LED_STATUS_B, GPIO.OUT)

# Inicializar todos los LEDs apagados
GPIO.output(LED_R_PIN, GPIO.LOW)
GPIO.output(LED_G_PIN, GPIO.LOW)
GPIO.output(LED_B_PIN, GPIO.LOW)
GPIO.output(LED_WHITE_1, GPIO.LOW)
GPIO.output(LED_WHITE_2, GPIO.LOW)
GPIO.output(LED_WHITE_3, GPIO.LOW)
GPIO.output(LED_STATUS_R, GPIO.LOW)
GPIO.output(LED_STATUS_G, GPIO.LOW)
GPIO.output(LED_STATUS_B, GPIO.LOW)

# Sensor DHT11
try:
    dht_device = adafruit_dht.DHT11(board.D18)
    print("[OK] Sensor DHT11 inicializado")
except Exception as e:
    print(f"[ERROR] Inicializando DHT11: {e}")
    dht_device = None

# ====================== ESTADO ======================
puerta_abierta = False
ventilador_on = False
mantenimiento_on = False

alarma_temperatura = False
alarma_humedad = False
ventilador_auto = False  # Para saber si el ventilador se activó automáticamente
ventilador_control_manual = False

#lcd_available = False

#NUEVAS VARIABLES PARA 5.5 y 5.6
alarma_intrusion = False
ultima_deteccion_pir = 0
leds_iluminacion_on = False
tiempo_ultima_deteccion = 0
tiempo_alarma_intrusion_inicio = 0

tiempo_puerta_abierta = 0

# Para LCD rotativo (5.8)
modo_lcd_actual = 0  # 0: temp/hum, 1: estado puerta, 2: movimiento, 3: alarmas, 4: modo
ultimo_cambio_lcd = 0
INTERVALO_CAMBIO_LCD = 5  # segundos entre cambios


# ====================== CONTROL LCD ======================
def actualizar_lcd_rotativo():
    """Muestra información rotativa en LCD según 5.8"""
    global modo_lcd_actual, ultimo_cambio_lcd, puerta_abierta, ultima_deteccion_pir
    global alarma_temperatura, alarma_humedad, alarma_intrusion, mantenimiento_on
    
    if not lcd_available:
        return
    
    current_time = time.time()
    if current_time - ultimo_cambio_lcd >= INTERVALO_CAMBIO_LCD:
        modo_lcd_actual = (modo_lcd_actual + 1) % 5  # 5 modos
        ultimo_cambio_lcd = current_time
        
        try:
            lcd.clear()
            
            if modo_lcd_actual == 0:
                # Temperatura y humedad actuales
                lcd.text("TEMP y HUMEDAD", 1)
                if dht_device:
                    try:
                        temperature = dht_device.temperature
                        humidity = dht_device.humidity
                        if temperature is not None and humidity is not None:
                            lcd.text(f"T:{temperature:.1f}C", 2)
                            lcd.text(f"H:{humidity:.1f}%", 3)
                        else:
                            lcd.text("Leyendo...", 2)
                    except:
                        lcd.text("Error sensor", 2)
                lcd.text("Modo: Monitoreo", 4)
                
            elif modo_lcd_actual == 1:
                # Estado de la puerta
                lcd.text("ESTADO PUERTA", 1)
                estado = "ABIERTA" if puerta_abierta else "CERRADA"
                lcd.text(f"Puerta: {estado}", 2)
                lcd.text("", 3)
                if puerta_abierta:
                    lcd.text("Acceso permitido", 4)
                else:
                    lcd.text("Acceso restringido", 4)
                    
            elif modo_lcd_actual == 2:
                # Última detección de movimiento
                lcd.text("DETECCION MOVIM", 1)
                if ultima_deteccion_pir > 0:
                    tiempo_transcurrido = int(current_time - ultima_deteccion_pir)
                    lcd.text(f"Hace: {tiempo_transcurrido}s", 2)
                    if puerta_abierta:
                        lcd.text("Personal tecnico", 3)
                    else:
                        lcd.text("Sistema vigilando", 3)
                else:
                    lcd.text("Sin detecciones", 2)
                lcd.text("", 4)
                
            elif modo_lcd_actual == 3:
                # Alertas activas
                lcd.text("ALERTAS ACTIVAS", 1)
                alertas = []
                if alarma_temperatura:
                    alertas.append("TEMP")
                if alarma_humedad:
                    alertas.append("HUM")
                if alarma_intrusion:
                    alertas.append("INTR")
                if alertas:
                    lcd.text(f"Alertas: {' '.join(alertas)}", 2)
                    lcd.text("", 3)
                    lcd.text("Revision urgente", 4)
                else:
                    lcd.text("Sin alertas", 2)
                    lcd.text("", 3)
                    lcd.text("Todo normal", 4)
                    
            elif modo_lcd_actual == 4:
                # Modo de operación actual
                lcd.text("MODO OPERACION", 1)
                if mantenimiento_on:
                    lcd.text("MANTENIMIENTO", 2)
                    lcd.text("Alarmas desact.", 3)
                    lcd.text("Tecnicos activos", 4)
                elif alarma_intrusion:
                    lcd.text("ALERTA INTRUSION", 2)
                    lcd.text("Puerta CERRADA", 3)
                    lcd.text("Revision urgente", 4)
                else:
                    lcd.text("NORMAL", 2)
                    lcd.text("Sistema activo", 3)
                    lcd.text("Todo en orden", 4)
                    
        except Exception as e:
            print(f"[ERROR] Actualizando LCD rotativo: {e}")

# ====================== CONTROL FÍSICO ======================
def abrir_puerta():
    global puerta_abierta, tiempo_puerta_abierta
    try:
        duty = 12.5  # ~180 grados
        servo_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        servo_pwm.ChangeDutyCycle(2.5)
        puerta_abierta = True
        tiempo_puerta_abierta = time.time()
        print("[FISICO] Puerta ABIERTA")
        
        # Publicar estado MQTT
        try:
            client.publish(TOPICS["access"], "OPEN", qos=1)
        except:
            pass
        
        # Actualizar LCD
        if lcd_available:
            try:
                lcd.clear()
                lcd.text("PUERTA ABIERTA", 2)
                time.sleep(1)
            except:
                pass
        
    except Exception as e:
        print(f"[ERROR] Abriendo puerta: {e}")

def cerrar_puerta():
    global puerta_abierta, tiempo_puerta_abierta
    try:
        duty = 2.5   # ~0 grados
        servo_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        servo_pwm.ChangeDutyCycle(2.5)
        
        # Calcular tiempo que estuvo abierta
        tiempo_abierta = 0
        if puerta_abierta and tiempo_puerta_abierta > 0:
            tiempo_abierta = time.time() - tiempo_puerta_abierta
            print(f"[INFO] Puerta estuvo abierta por {tiempo_abierta:.1f} segundos")
            
            # PUBLICAR TIEMPO VÍA MQTT (REQUISITO 5.4)
            try:
                client.publish(TOPICS["door_time"], f"{tiempo_abierta:.1f}", qos=1)
            except:
                pass
        
        puerta_abierta = False
        print("[FISICO] Puerta CERRADA")
        
        # Publicar estado MQTT
        try:
            client.publish(TOPICS["access"], "CLOSED", qos=1)
        except:
            pass
        
        # Actualizar LCD
        if lcd_available:
            try:
                lcd.clear()
                lcd.text("PUERTA CERRADA", 2)
                time.sleep(1)
            except:
                pass
        
        # Si hay alarma de intrusión activa, desactivarla
        if alarma_intrusion:
            desactivar_alarma_intrusion()
            
    except Exception as e:
        print(f"[ERROR] Cerrando puerta: {e}")

def encender_ventilador():
    global ventilador_on
    client.publish(TOPICS["fan"], "ON", qos=1) 
    print("[AUTO] Ventilador activado por temperatura")
    try:
        GPIO.output(FAN_PIN, GPIO.HIGH)
        ventilador_on = True
        print("[FISICO] Ventilador ENCENDIDO")
                
    except Exception as e:
        print(f"[ERROR] Encendiendo ventilador: {e}")

def apagar_ventilador():
    global ventilador_on
    client.publish(TOPICS["fan"], "OFF", qos=1) 
    print("[AUTO] Ventilador desactivado")
    try:
        GPIO.output(FAN_PIN, GPIO.LOW)
        ventilador_on = False
        print("[FISICO] Ventilador APAGADO")
        
    except Exception as e:
        print(f"[ERROR] Apagando ventilador: {e}")


def encender_iluminacion():
    """Enciende los LEDs blancos de iluminación"""
    global leds_iluminacion_on, tiempo_ultima_deteccion
    if not leds_iluminacion_on:
        GPIO.output(LED_WHITE_1, GPIO.HIGH)
        GPIO.output(LED_WHITE_2, GPIO.HIGH)
        GPIO.output(LED_WHITE_3, GPIO.HIGH)
        leds_iluminacion_on = True
        print("[ILUMINACION] LEDs blancos ENCENDIDOS")
        
        # Publicar evento MQTT
        try:
            client.publish(TOPICS["lighting"], "ON", qos=1)
        except:
            pass
    
    tiempo_ultima_deteccion = time.time()

def apagar_iluminacion():
    """Apaga los LEDs blancos de iluminación"""
    global leds_iluminacion_on
    if leds_iluminacion_on:
        GPIO.output(LED_WHITE_1, GPIO.LOW)
        GPIO.output(LED_WHITE_2, GPIO.LOW)
        GPIO.output(LED_WHITE_3, GPIO.LOW)
        leds_iluminacion_on = False
        print("[ILUMINACION] LEDs blancos APAGADOS")
        
        # Publicar evento MQTT
        try:
            client.publish(TOPICS["lighting"], "OFF", qos=1)
        except:
            pass


# ====================== CONTROL DE ALARMAS ======================
# Variables para rastrear inicio de alarmas (para duración futura si el backend lo necesita)
tiempo_inicio_temp = 0
tiempo_inicio_hum = 0
tiempo_inicio_intrusion = 0

def activar_alarma_temperatura(temperature):
    global alarma_temperatura, tiempo_inicio_temp
    if not alarma_temperatura:
        alarma_temperatura = True
        tiempo_inicio_temp = time.time()
        print("[ALARMA] Temperatura CRÍTICA detectada")
        
        # REQUISITO 5.2: Mostrar en LCD
        if lcd_available:
            try:
                lcd.clear()
                lcd.text("ALERTA: TEMP CRITICA", 1)
                lcd.text(f"Temperatura: {temperature:.1f}C", 2)
                lcd.text("Ventilador: ON", 3)
                lcd.text("Revisar inmediato", 4)
                # Mantener por 3 segundos antes de volver al modo rotativo
                time.sleep(3)
            except:
                pass
        
        client.publish(TOPICS["alerts"], "ALERTA: Temperatura crítica detectada", qos=1)

def desactivar_alarma_temperatura():
    global alarma_temperatura
    if alarma_temperatura:
        alarma_temperatura = False
        duracion = time.time() - tiempo_inicio_temp
        print("[ALARMA] Temperatura normalizada")
        client.publish(TOPICS["alerts"], f"RESUELTO: Alarma temperatura (duración: {duracion:.1f}s)", qos=1)

def activar_alarma_humedad(humidity):
    global alarma_humedad, tiempo_inicio_hum
    if not alarma_humedad:
        alarma_humedad = True
        tiempo_inicio_hum = time.time()
        print("[ALARMA] Humedad ALTA detectada")
        
        # REQUISITO 5.3: Mostrar en LCD inmediatamente
        if lcd_available:
            try:
                lcd.clear()
                lcd.text("ALERTA: HUMEDAD ALTA", 1)
                lcd.text(f"Humedad: {humidity:.1f}%", 2)
                lcd.text("Nivel critico", 3)
                lcd.text("Revisar sistema", 4)
                time.sleep(3)
                global ultimo_cambio_lcd
                ultimo_cambio_lcd = time.time()  # Resetear temporizador rotativo
            except:
                pass
        
        client.publish(TOPICS["alerts"], "ALERTA: Humedad alta detectada", qos=1)

def desactivar_alarma_humedad():
    global alarma_humedad
    if alarma_humedad:
        alarma_humedad = False
        duracion = time.time() - tiempo_inicio_hum
        print("[ALARMA] Humedad normalizada")
        client.publish(TOPICS["alerts"], f"RESUELTO: Alarma humedad (duración: {duracion:.1f}s)", qos=1)

def activar_alarma_intrusion():
    global alarma_intrusion, tiempo_inicio_intrusion
    if not alarma_intrusion:
        alarma_intrusion = True
        tiempo_inicio_intrusion = time.time()
        print("[ALARMA] INTRUSIÓN DETECTADA!")
        client.publish(TOPICS["alerts"], "ALERTA CRITICA: Intrusión detectada con puerta cerrada", qos=1)
        client.publish(TOPICS["intrusion"], "ACTIVE", qos=1)

def desactivar_alarma_intrusion():
    global alarma_intrusion
    if alarma_intrusion:
        alarma_intrusion = False
        duracion = time.time() - tiempo_inicio_intrusion
        print("[ALARMA] Alarma de intrusión desactivada")
        client.publish(TOPICS["intrusion"], "RESOLVED", qos=1)
        client.publish(TOPICS["alerts"], f"RESUELTO: Intrusión (duración: {duracion:.1f}s)", qos=1)
        # Apagar buzzer y LED de alarma específico
        GPIO.output(BUZZER_PIN, GPIO.LOW)
        GPIO.output(LED_R_PIN, GPIO.LOW)
        GPIO.output(LED_G_PIN, GPIO.LOW)
        GPIO.output(LED_B_PIN, GPIO.LOW)


# NUEVA FUNCIÓN CENTRALIZADA
def manejar_alarmas_visuales_y_sonoras():
    """Control centralizado de buzzer y LED RGB 1 según prioridad de alarmas"""
    global alarma_intrusion, alarma_temperatura, alarma_humedad
    
    current_time = time.time()
    
    # --- PRIORIDAD: Intrusión > Temperatura > Humedad ---
    if alarma_intrusion:
        # Buzzer rápido (5 Hz → período 0.2s, 50% duty)
        if not hasattr(manejar_alarmas_visuales_y_sonoras, "buzzer_toggle"):
            manejar_alarmas_visuales_y_sonoras.buzzer_toggle = 0
            manejar_alarmas_visuales_y_sonoras.buzzer_last = 0
        
        if current_time - manejar_alarmas_visuales_y_sonoras.buzzer_last > 0.1:  # 10 Hz toggle → 5 Hz beep
            manejar_alarmas_visuales_y_sonoras.buzzer_toggle = 1 - manejar_alarmas_visuales_y_sonoras.buzzer_toggle
            GPIO.output(BUZZER_PIN, manejar_alarmas_visuales_y_sonoras.buzzer_toggle)
            manejar_alarmas_visuales_y_sonoras.buzzer_last = current_time
        
        # LED RGB 1: alternar rojo/azul rápido
        if not hasattr(manejar_alarmas_visuales_y_sonoras, "led_toggle"):
            manejar_alarmas_visuales_y_sonoras.led_toggle = 0
            manejar_alarmas_visuales_y_sonoras.led_last = 0
        
        if current_time - manejar_alarmas_visuales_y_sonoras.led_last > 0.2:
            if manejar_alarmas_visuales_y_sonoras.led_toggle:
                GPIO.output(LED_R_PIN, GPIO.HIGH)
                GPIO.output(LED_B_PIN, GPIO.LOW)
            else:
                GPIO.output(LED_R_PIN, GPIO.LOW)
                GPIO.output(LED_B_PIN, GPIO.HIGH)
            GPIO.output(LED_G_PIN, GPIO.LOW)
            manejar_alarmas_visuales_y_sonoras.led_toggle = 1 - manejar_alarmas_visuales_y_sonoras.led_toggle
            manejar_alarmas_visuales_y_sonoras.led_last = current_time
    
    elif alarma_temperatura:
        # Buzzer continuo
        GPIO.output(BUZZER_PIN, GPIO.HIGH)
        
        # LED verde parpadeante (1 Hz)
        if not hasattr(manejar_alarmas_visuales_y_sonoras, "temp_led_last"):
            manejar_alarmas_visuales_y_sonoras.temp_led_last = 0
        if current_time - manejar_alarmas_visuales_y_sonoras.temp_led_last > 0.5:
            estado = not GPIO.input(LED_G_PIN)
            GPIO.output(LED_G_PIN, estado)
            GPIO.output(LED_R_PIN, GPIO.LOW)
            GPIO.output(LED_B_PIN, GPIO.LOW)
            manejar_alarmas_visuales_y_sonoras.temp_led_last = current_time
    
    elif alarma_humedad:
        # Buzzer intermitente lento (1 Hz)
        if not hasattr(manejar_alarmas_visuales_y_sonoras, "hum_buzzer_last"):
            manejar_alarmas_visuales_y_sonoras.hum_buzzer_last = 0
        if current_time - manejar_alarmas_visuales_y_sonoras.hum_buzzer_last > 0.5:
            GPIO.output(BUZZER_PIN, not GPIO.input(BUZZER_PIN))
            manejar_alarmas_visuales_y_sonoras.hum_buzzer_last = current_time
        
        # LED amarillo parpadeante
        if not hasattr(manejar_alarmas_visuales_y_sonoras, "hum_led_last"):
            manejar_alarmas_visuales_y_sonoras.hum_led_last = 0
        if current_time - manejar_alarmas_visuales_y_sonoras.hum_led_last > 0.5:
            estado = not GPIO.input(LED_R_PIN)
            GPIO.output(LED_R_PIN, estado)
            GPIO.output(LED_G_PIN, estado)
            GPIO.output(LED_B_PIN, GPIO.LOW)
            manejar_alarmas_visuales_y_sonoras.hum_led_last = current_time
    
    else:
        # Ninguna alarma → apagar todo lo relacionado con alarmas específicas
        GPIO.output(BUZZER_PIN, GPIO.LOW)
        GPIO.output(LED_R_PIN, GPIO.LOW)
        GPIO.output(LED_G_PIN, GPIO.LOW)
        GPIO.output(LED_B_PIN, GPIO.LOW)


# LED de estado general (5.7) - se mantiene igual, pero sin conflictos
def actualizar_led_estado():
    """Controla el LED RGB 2 de estado general del sistema"""
    global alarma_temperatura, alarma_humedad, alarma_intrusion, mantenimiento_on
    
    if alarma_temperatura or alarma_humedad or alarma_intrusion:
        # ROJO fijo
        GPIO.output(LED_STATUS_R, GPIO.HIGH)
        GPIO.output(LED_STATUS_G, GPIO.LOW)
        GPIO.output(LED_STATUS_B, GPIO.LOW)
    elif mantenimiento_on:
        # AMARILLO parpadeante
        current_time = time.time()
        if not hasattr(actualizar_led_estado, "last_toggle"):
            actualizar_led_estado.last_toggle = 0
        if current_time - actualizar_led_estado.last_toggle > 0.5:
            estado = not GPIO.input(LED_STATUS_R)
            GPIO.output(LED_STATUS_R, estado)
            GPIO.output(LED_STATUS_G, estado)
            GPIO.output(LED_STATUS_B, GPIO.LOW)
            actualizar_led_estado.last_toggle = current_time
    else:
        # VERDE fijo
        GPIO.output(LED_STATUS_R, GPIO.LOW)
        GPIO.output(LED_STATUS_G, GPIO.HIGH)
        GPIO.output(LED_STATUS_B, GPIO.LOW)


# ====================== CALLBACKS MQTT ======================
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("[MQTT] CONECTADO a HiveMQ Cloud")
        print("  Suscribiendo a comandos...")
        
        # Actualizar LCD
        if lcd_available:
            try:
                lcd.text("MQTT: Conectado OK", 4)
                time.sleep(1)
            except:
                pass
        
        # Suscribirse con QoS 1 para recibir mensajes garantizados
        client.subscribe(TOPICS["access"], qos=1)
        client.subscribe(TOPICS["fan"], qos=1)
        client.subscribe(TOPICS["maintenance"], qos=1)
        print(f"  [OK] Suscrito a: {TOPICS['access']}")
        print(f"  [OK] Suscrito a: {TOPICS['fan']}")
        print(f"  [OK] Suscrito a: {TOPICS['maintenance']}")
    else:
        print(f"[MQTT ERROR] Codigo: {rc}")
        
        # Actualizar LCD
        if lcd_available:
            try:
                lcd.text(f"MQTT Error: {rc}", 4)
            except:
                pass

def on_message(client, userdata, msg):
    global mantenimiento_on, ventilador_auto, ventilador_control_manual
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
                print("  -> Ejecutando: ENCENDER VENTILADOR (MANUAL)")
                encender_ventilador()
                ventilador_auto = False
                ventilador_control_manual = True  # <- Importante
            elif comando == "OFF":
                print("  -> Ejecutando: APAGAR VENTILADOR (MANUAL)")
                apagar_ventilador()
                ventilador_auto = False
                ventilador_control_manual = True
            else:
                print(f"  -> Comando no reconocido: {comando}")

        elif msg.topic == TOPICS["maintenance"]:
            if comando == "ON":
                mantenimiento_on = True
                print("  -> MODO MANTENIMIENTO ACTIVADO")
                # Actualizar LCD
                if lcd_available:
                    try:
                        lcd.text("MODO MANTENIMIENTO", 4)
                    except:
                        pass
            elif comando == "OFF":
                mantenimiento_on = False
                print("  -> MODO MANTENIMIENTO DESACTIVADO")
                # Actualizar LCD
                if lcd_available:
                    try:
                        lcd.text("Modo: NORMAL", 4)
                    except:
                        pass
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
        manejar_alarmas_visuales_y_sonoras()

        # Leer DHT11 cada 30 segundos
        if current_time - last_sensor_time >= 30:
            if dht_device:
                try:
                    temperature = dht_device.temperature
                    humidity = dht_device.humidity

                    if temperature is not None and humidity is not None:
                        # Publicar temperatura y humedad
                        client.publish(TOPICS["temperature"], f"{temperature:.1f}", qos=1)
                        client.publish(TOPICS["humidity"], f"{humidity:.1f}", qos=1)
                        print(f"[DHT11] Temperatura: {temperature:.1f}C, Humedad: {humidity:.1f}%")
                        
                        
                        # CONDICIONAL 5.1: Control automático del ventilador
                        if temperature >= 24.0 and not ventilador_on and not ventilador_control_manual:
                            print("[AUTO] Temperatura ≥24°C - Activando ventilador automáticamente")
                            encender_ventilador()
                            ventilador_auto = True
                            # Publicar estado del ventilador
                            client.publish(TOPICS["fan"], "ON", qos=1)
                        
                        elif temperature < 24.0 and ventilador_auto and not ventilador_control_manual:
                            print("[AUTO] Temperatura <24°C - Apagando ventilador automático")
                            apagar_ventilador()
                            ventilador_auto = False
                            # Publicar estado del ventilador
                            client.publish(TOPICS["fan"], "OFF", qos=1)
                        
                        # CONDICIONAL 5.2: Alarma de temperatura crítica
                        if temperature >= 28.0 and not alarma_temperatura:
                            activar_alarma_temperatura(temperature)
                            client.publish(TOPICS["temp_alarm"], f"{temperature:.1f}", qos=1)
                        
                        elif temperature < 28.0 and alarma_temperatura:
                            desactivar_alarma_temperatura()
                            client.publish(TOPICS["temp_alarm"], "OFF", qos=1)
                        
                        if humidity >= 94.0 and not alarma_humedad:
                            activar_alarma_humedad(humidity)
                            client.publish(TOPICS["hum_alarm"], f"{humidity:.1f}", qos=1)
                        
                        elif humidity < 94.0 and alarma_humedad:
                            desactivar_alarma_humedad()
                            client.publish(TOPICS["hum_alarm"], "OFF", qos=1)
                            
                except RuntimeError as error:
                    print(f"[DHT11] Error de lectura: {error.args[0]}")
                    # Mostrar error en LCD
                    if lcd_available:
                        try:
                            lcd.text("Error sensor DHT11", 2)
                        except:
                            pass
                except Exception as error:
                    print(f"[DHT11] Error: {error}")
            
            last_sensor_time = current_time
        
        # Leer PIR - Sistema de Seguridad e Intrusión (5.5)
        try:
            if GPIO.input(PIR_PIN) == GPIO.LOW:  # MOVIMIENTO DETECTADO
                tiempo_actual = time.time()  # <-- Usar nombre diferente
                time.sleep(0.05)  # 50ms debounce
                if GPIO.input(PIR_PIN) == GPIO.LOW:  # Confirmar:
                
                    # Guardar última detección
                    ultima_deteccion_pir = tiempo_actual

                    tiempo_ultima_deteccion = tiempo_actual
                    
                    # 5.6: Encender iluminación automática
                    encender_iluminacion()
                    
                    if tiempo_actual - last_pir_time > 5:
                        client.publish(TOPICS["pir"], "1", qos=1)
                        print("[PIR] Movimiento detectado!")
                        last_pir_time = tiempo_actual
                    
                    # 5.5: Lógica de seguridad según estado de puerta
                    if puerta_abierta:
                        # Puerta ABIERTA: Personal técnico
                        if lcd_available and not mantenimiento_on:
                            try:
                                lcd.clear()
                                lcd.text("PERSONAL TECNICO", 1)
                                lcd.text("DETECTADO", 2)
                                lcd.text("Puerta: ABIERTA", 3)
                                lcd.text("Trabajando...", 4)
                            except:
                                pass
                        
                        # Publicar evento para MongoDB
                        try:
                            client.publish(TOPICS["event"], 
                                        "MOVIMIENTO: Personal técnico detectado con puerta abierta", qos=1)
                        except:
                            pass
                            
                    else:
                        # Puerta CERRADA: Posible intrusión
                        if not mantenimiento_on and not alarma_intrusion:
                            activar_alarma_intrusion()
                        
                        elif mantenimiento_on:
                            # Modo mantenimiento: permitir movimiento
                            if lcd_available:
                                try:
                                    lcd.clear()
                                    lcd.text("MODO MANTENIMIENTO", 1)
                                    lcd.text("Movimiento detectado", 2)
                                    lcd.text("Puerta: CERRADA", 3)
                                    lcd.text("Trabajo autorizado", 4)
                                except:
                                    pass
                            
        except Exception as e:
            print(f"[ERROR] PIR: {e}")

        if alarma_intrusion and (time.time() - tiempo_inicio_intrusion > 30):  # 30 segundos máximo
            print("[ALARMA] Intrusión: desactivando por timeout")
            desactivar_alarma_intrusion()
        
        # 5.6: Apagar iluminación después de 15 segundos
        if leds_iluminacion_on:
            if time.time() - tiempo_ultima_deteccion > 15:
                apagar_iluminacion()
        
        # 5.8: Actualizar LCD rotativo
        actualizar_lcd_rotativo()
        
        # 5.7: Actualizar LED de estado
        actualizar_led_estado()
        
        time.sleep(0.1)  # Ciclo rápido para mejor respuesta

except KeyboardInterrupt:
    print("\n\n[INFO] Deteniendo Raspberry Pi...")
except Exception as e:
    print(f"\n[ERROR] En bucle principal: {e}")

finally:
    print("\n" + "="*60)
    print("Limpiando recursos...")
    try:
        # Limpiar LCD
        if lcd_available:
            try:
                lcd.clear()
                lcd.text("Sistema apagado", 2)
                time.sleep(1)
                lcd.clear()
            except:
                pass
        
        # Apagar todo
        apagar_ventilador()
        cerrar_puerta()
        apagar_iluminacion()
        
        # Apagar todos los LEDs
        GPIO.output(LED_R_PIN, GPIO.LOW)
        GPIO.output(LED_G_PIN, GPIO.LOW)
        GPIO.output(LED_B_PIN, GPIO.LOW)
        GPIO.output(LED_WHITE_1, GPIO.LOW)
        GPIO.output(LED_WHITE_2, GPIO.LOW)
        GPIO.output(LED_WHITE_3, GPIO.LOW)
        GPIO.output(LED_STATUS_R, GPIO.LOW)
        GPIO.output(LED_STATUS_G, GPIO.LOW)
        GPIO.output(LED_STATUS_B, GPIO.LOW)
        
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