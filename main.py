from time import sleep
from lcd import LCDDisplay
import RPi.GPIO as GPIO
from sensordht11 import DHT11Sensor
from servomotor import ServoMotor
from sensorInfrarrojo import InfrarrojoSensor
import board

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
    if dht_sensor.read():
        if dht_sensor.tempC >= 24.00:
            lcd.clear()
            lcd.show("ACTIVANDO VENTILADOR", 1, 0)
            lcd.show(f"TEMPERATURA > {dht_sensor.tempC:.1f}C", 2, 0)
            GPIO.output(14, GPIO.LOW)  # desactiva el buzzer
        elif dht_sensor.tempC >= 28.00:
            lcd.clear()
            lcd.show("ALERTA: TEMP CRITICA", 1, 5)
            lcd.show(f"TEMPERATURA = {dht_sensor.tempC:.1f}C", 2, 0)
            GPIO.output(14, GPIO.HIGH)  # activa el buzzer
            GPIO.output(20, GPIO.HIGH)  # Enciende LED verde
            #colocar funcion para que parpadee el led verde y el buzzer quede fijo sonando

        elif dht_sensor.tempC < 24.00:
            GPIO.output(14, GPIO.LOW)  # Desactiva el buzzer

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
    while True: 
        mensaje(dht_sensor, lcd)
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



