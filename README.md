# iotcanvas

# arduino

This project was initially created with an Arduino MKR1000, but then switched to Raspberry Pi to create an one-in-all solution.

# web

The web interface allows setting LEDs on a distance, but this is likely to change to the on-device touchscreen.

# raspberry

All-in-one solution which should drive the touchscreen, LEDs and respond to online data sets.

## setup

Followed this guide: https://thisdavej.com/create-a-lightweight-raspberry-pi-system-with-raspbian-lite/

- Raspberry PI 3 A+
- SSH into the pi with `ssh pi@dataframeproto1.local`


## installed dependencies

- Raspbian Lite via [this tutorial] (https://thisdavej.com/create-a-lightweight-raspberry-pi-system-with-raspbian-lite/)
- Install I2C and SPI dependencies
- Setup up [Network File sharing] (https://magpi.raspberrypi.org/articles/samba-file-server)
- Python Firebase wrapper [Pyrebase] (https://github.com/thisbejim/Pyrebase)
- Adafruit [Circuitpython] (https://learn.adafruit.com/circuitpython-on-raspberrypi-linux/installing-circuitpython-on-raspberry-pi)
- Adafruit [NeoPixel Library] (https://learn.adafruit.com/neopixels-on-raspberry-pi/raspberry-pi-wiring)