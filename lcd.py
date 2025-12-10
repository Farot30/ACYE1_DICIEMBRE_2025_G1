from RPLCD.i2c import CharLCD

class LCDDisplay:
    def __init__(self, address, cols, rows):
        self.lcd = CharLCD(
            i2c_expander='PCF8574',
            address=address,
            port=1,
            cols=cols,
            rows=rows,
            charmap='A00'
        )

    def show(self, text, line, column):
        """Muestra un texto en la línea indicada (0 o 1)."""
        self.lcd.cursor_pos = (line, column)
        self.lcd.write_string(text.ljust(20))

    

    def clear(self):
        """Limpia la pantalla."""
        self.lcd.clear()

