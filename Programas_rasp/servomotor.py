import RPi.GPIO as GPIO


class ServoMotor:
    def __init__(self, pin, frecuencia):
        self.pin = pin
        GPIO.setup(self.pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.pin, frecuencia)  # Frecuencia de 50Hz
        
    
    def iniciar(self ):
        self.pwm.start(2.5)  # Posición inicial (0 grados)
    
    def mov_90(self):
        self.pwm.ChangeDutyCycle(7.5)  # Mover a 90 grados

    def mov_180(self):
        self.pwm.ChangeDutyCycle(12.5)  # Mover a 180 grados

    def liberar(self):
        self.pwm.stop() # Detener PWM