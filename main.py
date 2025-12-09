from time import sleep
from lcd import LCDDisplay
import RPi.GPIO as GPIO
from sensordht11 import DHT11Sensor
import board

GPIO.setmode(GPIO.BCM) #Usando numeracion GPIO
GPIO.setwarnings(False) # desactiva las advertencias


#creacion de objetos
dht_sensor = DHT11Sensor(board.D17)
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
        temperature_c, temperature_f, humidity = dht_sensor.read()
        if temperature_c is not None and humidity is not None:
            lcd.clear()
            lcd.show(f"Temp: {temperature_c:.1f} C", 1, 0)
            lcd.show(f"Temp: {temperature_f:.1f} F", 2, 0)
            lcd.show(f"Humidity: {humidity:.1f} %", 3, 0)
        else:
            lcd.show("Error reading", 1, 0)
            lcd.show("sensor data", 2, 0)
        sleep(2)  # Espera 2 segundos antes de la siguiente lectura

    # limpieza al salir
    dht_sensor.close()  
    lcd.clear()

except KeyboardInterrupt:
    print("\nPrograma detenido.")

finally:
    lcd.clear()
    GPIO.cleanup()
    print("GPIO liberados.")



