print("st7036 test cycles")

import time
import sys
import os
import random

lcd = st7036.st7036(register_select_pin=25, rows=3, columns=16)
lcd.set_display_mode()
lcd.set_contrast(40)
lcd.clear()

print(">> fill screen")
for i in range(48):
    lcd.set_cursor_offset(i)
    time.sleep(.50)
    lcd.write(chr(i+65))
    time.sleep(.20)

print(">> cycle character set")
for i in range(256 - 48 - 65):
    lcd.set_cursor_offset(0x00)
    lcd.write("".join([chr(i + j + 65) for j in range(48)]))
    time.sleep(.20)
    lcd.clear()
    lcd.clear()

print(">> test contrast range")
lcd.set_cursor_offset(0x10)
lcd.write("test contrast")
for i in range(0x40):
    lcd.set_contrast(i)
    time.sleep(0.20)
for i in reversed(range(0x40)):
    lcd.set_contrast(i)
    time.sleep(0.20)

    lcd.set_contrast(40)
    lcd.clear()

print(">> test set cursor position")
for i in range(50):
    row = random.randint(0, 3 - 1)
    column = random.randint(0, 16 - 1)

    lcd.set_cursor_position(column, row)
    lcd.write(chr(0b01101111))
    time.sleep(.50)
    lcd.set_cursor_position(column, row)
    lcd.write(" ")
