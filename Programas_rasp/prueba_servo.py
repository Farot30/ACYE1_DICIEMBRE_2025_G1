import RPi.GPIO as GPIO
from servomotor import ServoMotor
from time import sleep
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False) # desactiva las advertencias

servo = ServoMotor(12,50)  # Pin GPIO12, frecuencia 50Hz
servo.iniciar()

while True:
    valor= input("Ingrese 90 para mover a 90 grados, 180 para mover a 180 grados, o 'q' para salir: ")

    if valor == '90':
        servo.mov_90()
        #sleep(1)  # Espera 1 segundo en la posición
    elif valor == '180':
        servo.mov_180()
        #sleep(1)  # Espera 1 segundo en la posición
    elif valor == '0':
        servo.iniciar()
    elif valor.lower() == 'q':
        servo.liberar()
        break
    