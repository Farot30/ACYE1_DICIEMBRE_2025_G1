from time import sleep
from lcd import LCDDisplay
import RPi.GPIO as GPIO
from sensordht11 import DHT11Sensor
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
        lcd.show("sensor data", 2, 0)
        sleep(2)  # Espera 2 segundos antes de la siguiente lectura

def validacion_temp(dht_sensor, lcd):
    if dht_sensor.read():
        if dht_sensor.tempC >= 24.00:
            lcd.clear()
            lcd.show("ACTIVANDO VENTILADOR", 1, 0)
            lcd.show(f"TEMPERATURA > {dht_sensor.tempC:.1f}C", 2, 0)
            GPIO.output(14, GPIO.HIGH)  # Activa el buzzer
        elif dht_sensor.tempC >= 28.00:
            lcd.clear()
            lcd.show("ALERTA: TEMP CRITICA", 1, 5)
        elif dht_sensor.tempC < 24.00:
            GPIO.output(14, GPIO.LOW)  # Desactiva el buzzer
            
            
    else:
        lcd.show("Error reading", 1, 0)
        lcd.show("sensor data", 2, 0)
        sleep(2)  # Espera 2 segundos antes de la siguiente lectura        


GPIO.setmode(GPIO.BCM) #Usando numeracion GPIO
GPIO.setup(14, GPIO.OUT) #Buzzer
GPIO.output(14, GPIO.LOW) #Buzzer apagado
GPIO.setwarnings(False) # desactiva las advertencias


#creacion de objetos
dht_sensor = DHT11Sensor(board.D17) # sensor DHT11 conectado al pin GPIO17
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
        sleep(2)  # Espera 2 segundos antes de la siguiente lectura
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



