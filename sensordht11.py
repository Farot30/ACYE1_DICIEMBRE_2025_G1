import time
import board
import adafruit_dht

class DHT11Sensor:
    def __init__(self, pin): # inicializa el sensor DHT11 en el pin especificado
        self.dht = adafruit_dht.DHT11(pin)
        self.tempC = None
        self.tempF = None
        self.humidity = None

    def read(self):
        try:
            self.tempC = self.dht.temperature
            self.tempF = self.tempC * (9 / 5) + 32 
            self.humidity = self.dht.humidity
            return True #Si la lectura fue exitosa
        except RuntimeError as e:
            print(f"RuntimeError: {e.args[0]}")
            return None, None, None
        except Exception as e:
            self.dht.exit()
            raise e

    def close(self):
        self.dht.exit()