import time
from threading import Thread
import sys
import os
import random
import struct
import st7036   # control for the LCD screen
import evdev    # direct access to input device streams
import asyncio  # asynchronous library

async def touchscreen():
    usbdevices = [evdev.InputDevice(path) for path in evdev.list_devices()]
    for device in usbdevices:
        if "AR1100" in device.name:
            screen = evdev.InputDevice(device.path)
            async for event in screen.async_read_loop():
                # types:                # code                          # value
                #  3 = coordinates         0 = x-axis, 1 = y-axis           coordinate
                #  1 = 'click'             272 = 'click'                    1 = down, 0 = up
                if event.type is 3:
                    if event.code is 0:
                        print("x at ", event.value)
                    elif event.code is 1:
                        print("y at ", event.value)
                    else:
                        print("unknown code in event type 3!")
                elif (event.type == 1 and event.code == 272):
                    if event.value is 1:
                        print("pressed!")
                    elif event.value is 0:
                        print("released!")
                    else:
                        print("unknown value pr code at type 1")

            # todo: recover from error? Perhaps look for touchscreen again (e.g. when cable get's disconnected)
            # todo: currently at https://realpython.com/async-io-python/#using-a-queue to understand signaling

async def doglcd():
    lcd = st7036.st7036(register_select_pin=25, rows=3, columns=16)
    lcd.set_display_mode()
    lcd.set_contrast(50)
    sleeptime = 0.2

    while True:
        lcd.clear()
        for i in range(48):
            lcd.set_cursor_offset(i)
            await asyncio.sleep(sleeptime)
            lcd.write(chr(i+65))
            await asyncio.sleep(sleeptime)

async def main():
    await asyncio.gather(touchscreen(),doglcd())

if __name__ == "__main__":

    asyncio.run(main())

    print("Finished Program")



#
# lcd = st7036.st7036(register_select_pin=25, rows=3, columns=16)
# lcd.set_display_mode()
# lcd.set_contrast(50)
# lcd.clear()
# sleeptime = 0.2
#
# print(">> fill screen")
# for i in range(48):
#     lcd.set_cursor_offset(i)
#     time.sleep(sleeptime)
#     lcd.write(chr(i+65))
#     time.sleep(sleeptime)
#
# print(">> cycle character set")
# for i in range(256 - 48 - 65):
#     lcd.set_cursor_offset(0x00)
#     lcd.write("".join([chr(i + j + 65) for j in range(48)]))
#     time.sleep(sleeptime)
#     lcd.clear()
#     lcd.clear()
#
# print(">> test contrast range")
# lcd.set_cursor_offset(0x10)
# lcd.write("test contrast")
# for i in range(0x40):
#     lcd.set_contrast(i)
#     time.sleep(sleeptime)
# for i in reversed(range(0x40)):
#     lcd.set_contrast(i)
#     time.sleep(sleeptime)
#     lcd.set_contrast(40)
#     lcd.clear()
#
# print(">> test set cursor position")
# for i in range(50):
#     row = random.randint(0, 3 - 1)
#     column = random.randint(0, 16 - 1)
#
#     lcd.set_cursor_position(column, row)
#     lcd.write(chr(0b01101111))
#     time.sleep(sleeptime)
#     lcd.set_cursor_position(column, row)
#     lcd.write(" ")
