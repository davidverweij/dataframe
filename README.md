# iotcanvas

# arduino

This project was initially created with an Arduino MKR1000, but then switched to Raspberry Pi to create an one-in-all solution.

# web

The web interface allows setting LEDs on a distance, but this is likely to change to the on-device touchscreen.

# raspberry

All-in-one solution which should drive the touchscreen, LEDs and respond to online data sets.

## setup

Followed [this guide](https://thisdavej.com/create-a-lightweight-raspberry-pi-system-with-raspbian-lite/) to set up Raspian Lite on the Raspberry PI
Follow [this guide from Pimoroni](https://learn.pimoroni.com/tutorial/sandyj/dot-breakout-assembly) to set up the display

- Raspberry PI 3 A+
- SSH into the pi with `ssh pi@dataframeproto1.local`
- DogLCD, specifically the EA DOGM163W-A - connection diagram see [this readme file](https://github.com/Gadgetoid/DogLCD)


## installed dependencies

- Raspbian Lite via [this tutorial](https://thisdavej.com/create-a-lightweight-raspberry-pi-system-with-raspbian-lite/)
- Install I2C and SPI dependencies
- Setup up [Network File sharing](https://magpi.raspberrypi.org/articles/samba-file-server)
- Python Firebase wrapper [Pyrebase](https://github.com/thisbejim/Pyrebase)
- Adafruit [Circuitpython](https://learn.adafruit.com/circuitpython-on-raspberrypi-linux/installing-circuitpython-on-raspberry-pi)
- Adafruit [NeoPixel Library](https://learn.adafruit.com/neopixels-on-raspberry-pi/raspberry-pi-wiring)
- [Beautiful Table](https://pypi.org/project/beautifultable/) for printing tables to the CLI


## LCD screen
- (add description of setup and parts)

## SYSTEMD unit file to run at boot

Add a file called 'dataframe.service' to /lib/systemd/system/:
`
[Unit]
Description=DataFrame running Service
After=multi-user.target

[Service]
Type=idle
ExecStart=/usr/bin/python3 -u /home/pi/dataframe.py
StandardOutput = append:/home/pi/dataframe_output.log
StandardError = append:/home/pi/dataframe_error.log
Restart=always

[Install]
WantedBy=multi-user.target

`

Ensure proper read-write rights with
`sudo chmod 644 /lib/systemd/system/sample.service `
and add it to the boot sequence with
`sudo systemctl daemon-reload`
`sudo systemctl enable dataframe.service`
