import RPi.GPIO as GPIO

class InfrarrojoSensor:
    def __init__(self, pin):
        self.pin = pin
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.IN)

    def leer_estado(self):
        return GPIO.input(self.pin) # Devuelve 0 si detecta obstáculo, 1 si no.