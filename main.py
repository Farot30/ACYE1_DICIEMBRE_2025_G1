from time import sleep
from lcd import LCDDisplay
import RPi.GPIO as GPIO
from sensordht11 import DHT11Sensor
from servomotor import ServoMotor
from sensorInfrarrojo import InfrarrojoSensor
import board

estado_led_hum = False
ultimo_cambio_hum= time.time()

estado_led_temp = False
ultimo_cambio_temp= time.time()

#funciones auxiliares

def mensaje(dht_sensor, lcd):
    if dht_sensor.read():
        lcd.clear()
        lcd.show(f"Temp: {dht_sensor.tempC:.1f} C", 1, 0)
        lcd.show(f"Temp: {dht_sensor.tempF:.1f} F", 2, 0)
        lcd.show(f"Humidity: {dht_sensor.humidity:.1f} %", 3, 0)
        
    else:
        lcd.show("Error reading", 1, 0)
        lcd.show("sensor data dht11", 2, 0)
        sleep(2)  # Espera 2 segundos antes de la siguiente lectura

def validacion_temp(dht_sensor, lcd):
    global estado_led_temp, ultimo_cambio_temp
    global estado_led_hum, ultimo_cambio_hum

    if not dht_sensor.read():
        return  # Si falla la lectura, salir


    if dht_sensor.tempC >= 28.00:
        lcd.clear()
        lcd.show("ALERTA: TEMP CRITICA", 1, 5)
        lcd.show(f"TEMPERATURA = {dht_sensor.tempC:.1f}C", 2, 0)
        GPIO.output(14, GPIO.HIGH)  # activa el buzzer
            
        if time.time() - ultimo_cambio_temp >= 1:
            ultimo_cambio_temp = time.time()

            if estado_led_temp:  # Si el LED está encendido, lo apaga
                estado_led_temp = False
                GPIO.output(20, GPIO.LOW)  # Apaga LED verde
            else:
                estado_led_temp = True
                GPIO.output(20, GPIO.HIGH)  # Enciende LED verde
        return

    if dht_sensor.tempC >= 24.00:
        lcd.clear()
        lcd.show("ACTIVANDO VENTILADOR", 1, 0)
        lcd.show(f"TEMPERATURA > {dht_sensor.tempC:.1f}C", 2, 0)
        GPIO.output(14, GPIO.LOW)  # desactiva el buzzer
        GPIO.output(15, GPIO.HIGH)  # Enciende el motor del ventilador
        GPIO.output(20, GPIO.LOW)  # Apaga LED VERDE
    else:
        GPIO.output(15, GPIO.LOW)  # Apaga el motor del ventilador
        GPIO.output(20, GPIO.LOW)  # Apaga LED VERDE
        GPIO.output(14, GPIO.LOW)  # Desactiva el buzzer

    if dht_sensor.humidity >= 70.00:
        lcd.clear()
        lcd.show("ALERTA: HUMEDAD ALTA", 1, 0)
        lcd.show(f"HUM = {dht_sensor.humidity:.1f} %", 2, 0)

        if time.time() - ultimo_cambio_hum >= 0.4:
            ultimo_cambio_hum = time.time()

            if estado_led_hum:
                estado_led_hum = False
                GPIO.output(16, GPIO.LOW)   # LED azul OFF
                GPIO.output(14, GPIO.LOW)   # buzzer OFF
            else:
                estado_led_hum = True
                GPIO.output(16, GPIO.HIGH)   # LED azul ON
                GPIO.output(14, GPIO.HIGH)   # buzzer ON

    else:
        estado_led_hum = False
        GPIO.output(16, GPIO.LOW)
        GPIO.output(14, GPIO.LOW)



def sistema_iluminacion(infrarrojo_sensor, lcd):
    if infrarrojo_sensor.leer_estado() == 0:  # Obstáculo detectado
        lcd.clear()
        lcd.show("Obstaculo detectado", 0, 0)
        GPIO.output(1, GPIO.HIGH)  # Enciende el LED blanco
    
    else:
        GPIO.output(1, GPIO.LOW)   # Apaga el LED blanco
      
#Configuracion de pines GPIO
GPIO.setmode(GPIO.BCM) #Usando numeracion GPIO
GPIO.setup(1, GPIO.OUT) #Led iluminacion (Blanco)
GPIO.setup(14, GPIO.OUT) #Buzzer
GPIO.setup(16, GPIO.OUT) #Led azul
GPIO.setup(21, GPIO.OUT) #LED rojo
GPIO.setup(20, GPIO.OUT) #LED verde
GPIO.setup(15, GPIO.OUT) #motor dc (ventilador)

GPIO.output(14, GPIO.LOW) #Buzzer apagado
GPIO.setwarnings(False) # desactiva las advertencias


#creacion de objetos
dht_sensor = DHT11Sensor(board.D18) # sensor DHT11 conectado al pin GPIO18
servo= ServoMotor(12,50)  # Pin GPIO18, frecuencia 50Hz
infrarrojo_sensor = InfrarrojoSensor(26)  # Sensor infrarrojo en el pin GPIO26
lcd = LCDDisplay(0x27, 20, 4)

#mensaje de bienvenida
lcd.show("Loading...", 1,5)

# Animación de carga
for i in range(20):
    lcd.show("*",2, i)
    sleep(0.1)



#inicio del programa principal
try:
    ultimo_tiempo = 0
    while True: 
        ahora=time.time()
        if ahora - ultimo_tiempo >= 30:  # Lee el sensor cada 30 segundos
            mensaje(dht_sensor, lcd)
            ultimo_tiempo = ahora
            validacion_temp(dht_sensor, lcd)

        
        
        sistema_iluminacion(infrarrojo_sensor, lcd)
        sleep(1)  # Espera 1 segundo antes de la siguiente lectura
        lcd.clear()

    # limpieza al salir
    dht_sensor.close()  
    lcd.clear()

except KeyboardInterrupt:
    print("\nPrograma detenido.")

finally:
    lcd.clear()
    GPIO.cleanup()
    print("GPIO liberados.")



