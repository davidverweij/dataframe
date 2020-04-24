import time
from threading import Thread
from collections import namedtuple
import sys
import os
import random
import struct
import st7036   # control for the LCD screen
import evdev    # direct access to input device streams
import asyncio  # asynchronous library

import board           # GPIO helper functions - code must be run as root for GPIO access
import neopixel        # neopixel helper library

async def touchscreen(queue):
    usbdevices = [evdev.InputDevice(path) for path in evdev.list_devices()]
    Touch = namedtuple('Touch', ['state','x', 'y'])     # to send data across threads, state -1 is still pressing, 0 is released, 1 is pressed
    pos = [0.0, 0.0]                                    # local copy
    posupdated = [False,False]                          # only send if we have both a new X and Y (read as seperate lines)
    pressed = -1                                     # keep track of pressed / released (though we might assume x&y only occur when pressed..)

    for device in usbdevices:
        if "AR1100" in device.name:
            screen = evdev.InputDevice(device.path)
            async for event in screen.async_read_loop():
                # types:                # code                          # value
                #  3 = coordinates         0 = x-axis, 1 = y-axis           coordinate
                #  1 = 'click'             272 = 'click'                    1 = down, 0 = up
                if event.type is 3:
                    pos[event.code] = event.value
                    posupdated[event.code] = True               # x seems to always come first. Spotted occasional
                                                                # missing y, but this will just override the x again
                                                                # and not 'push' a message before both have been updated
                    if (posupdated[0] and posupdated[1]):       # both X and Y have been updated!
                        posupdated = [False, False]
                        msg = Touch._make([1 if pressed is not -1 else -1, pos[0], pos[1]])     # pressed is 1 if pressed before
                                                                        # sometimes the press is not registered, but being released before
                                                                        # means this is a first press
                        print(msg)
                        queue.put_nowait(msg)    # 0 = already pressed before

                        pressed = -1             # the x y coordinates of a press are being sent after the presses
                                                 # so we need to collect that, but a release is after xy

                elif (event.type == 1 and event.code == 272):
                    pressed = event.value
                    # print(pressed)
                    if pressed is 0:             # only send a release immediately, a press will be send with the XY later
                        msg = Touch._make([pressed, pos[0], pos[1]])
                        print(msg)
                        queue.put_nowait(msg)

                    posupdated = [False, False]  # clear current xy recordings to prevent doubleclicks

            # todo: recover from error? Perhaps look for touchscreen again (e.g. when cable get's disconnected)
            # todo: currently at https://realpython.com/async-io-python/#using-a-queue to understand signaling

async def doglcd(queue):
    # lcd screen settings
    lcd = st7036.st7036(register_select_pin=25, rows=3, columns=16)
    lcd.set_display_mode()
    lcd.set_contrast(50)
    touchscreenstatus = ["Continue", "Up", "Down"]      # to translate back the numbers from the message
    #  lcdsleeptime = 0.2

    #  NEOPIXEL NOT WORKING YET!! TODO:


    pixel_pin = board.D18           # NeoPixels must be connected to D10, D12, D18 or D21 to work.
    num_pixels = 2            # The number of NeoPixels
    ORDER = neopixel.GRB   # change to RGB, GRB, RGBW or GRBW as needed
    pixels = neopixel.NeoPixel(
        pixel_pin,
        num_pixels,
        brightness=0.5,         # set brightness range for colours to work on (0.0 - 1.0)
        auto_write=False,       # if true, pixels will be updated when value is changed. If False, use show()
        pixel_order=ORDER)

    while True:
        data = await queue.get()        # safely wait for messages in the cue which will indicate what we should represent
        lcd.clear()
        lcdmessage = f"{touchscreenstatus[data.state+1]:<16}"[:16] + "x = " + f"{data.x:<12}"[:13] + "y = " + f"{data.y:<12}"[:13]
        lcd.write(lcdmessage)
        if data.state is 0:
            pixels.fill((0,255,0))
            pixels.show()
        elif data.state is 1:
            pixels.fill((0,0,255))
            pixels.show()
        #
        # for i in range(48):
        #     lcd.set_cursor_offset(i)
        #     await asyncio.sleep(sleeptime)
        #     lcd.write(chr(i+65))
        #     await asyncio.sleep(sleeptime)



async def main():
    # this queue allows communication between threads
    queue = asyncio.Queue()

    # schedule concurrent tasks
    task_touchscreen = asyncio.create_task(touchscreen(queue))
    task_lcd = asyncio.create_task(doglcd(queue))

    print("tasks running")

    # now all we do is await these tasks
    await asyncio.gather(task_touchscreen,task_lcd)


if __name__ == "__main__":

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("User interrupted")

    print("Finished Program")
