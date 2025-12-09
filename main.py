from time import sleep
from lcd import LCDDisplay
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM) #Usando numeracion GPIO
GPIO.setwarnings(False) # desactiva las advertencias

lcd = LCDDisplay(0x27, 20, 4)
lcd.show("Loading...", 1,5)

# Animación de carga
for i in range(20):
    lcd.show("*",2, i)
    sleep(0.1)




