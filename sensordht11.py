import time
import board
import adafruit_dht

class DHT11Sensor:
    def __init__(self, pin): # inicializa el sensor DHT11 en el pin especificado
        self.dht = adafruit_dht.DHT11(pin)

    def read(self):
        try:
            temperature_c = self.dht.temperature
            temperature_f = temperature_c * (9 / 5) + 32 
            humidity = self.dht.humidity
            return temperature_c, temperature_f, humidity
        except RuntimeError as e:
            print(f"RuntimeError: {e.args[0]}")
            return None, None, None
        except Exception as e:
            self.dht.exit()
            raise e

    def close(self):
        self.dht.exit()