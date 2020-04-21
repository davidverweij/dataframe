# IoT Canvas / Data Frame

# Legacy

This project was initially created with an Arduino MKR1000, in combination with a Web interface that allowed the LED's to be configured. After re-evaluation of the intuitiveness and design requirements, the prototype was deemed to be an all-in-one solution.

# Prototype Contents

The current prototype uses a Raspberry Pi 3 A+ as the brains. It is attached to a LED matrix, LCD screen and a large resistive touchscreen. An Arduino Trinket is connected to read analogue devices (such as a LDR). The prototype, in the form factor of a A4 picture frame, hosts a drawing of your own. Using the transparent touchscreen portions of the drawing can be lit using the LED matrix behind this drawing. These lit-up zones can be configured to respond to online data sources, such as e-mails, weather, etc. The online platform IFTTT is used to create the connections. Placed in a home, this picture frame then becomes a ambient display for online data.

## Dependencies and Setup

The prototype consists out of a Raspberry PI, set up with Raspbian Lite. It has a Adafruit Neopixel RGBW led strip attached over a PWM port which is placed in a grid-like pattern. A [DogLCD](https://github.com/Gadgetoid/DogLCD) is connected over SPI (see wire diagram [here](https://learn.pimoroni.com/tutorial/sandyj/dot-breakout-assembly)))and a Arduino Trinket over I2C (*to be implemented*).

The Operating system is Raspbian Lite (download [here](https://www.raspberrypi.org/downloads/raspbian/)) which can be flashed to an SD card using [Etcher](https://www.etcher.io/). To set up Wi-Fi and SSH without a keyboard or monitor, re-inster the SD card into your computer, and create a "*wpa_supplicant.conf*" file, and a "*ssh*" in the main directory of the SD card. Leave the "*ssh*" file empty, but add and edit the following text to the "*wpa_supplicant.conf*" file, save, and eject the SD card.

    country=UK # Your 2-digit country code
    ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
    network = {
      ssid="YOUR_NETWORK_NAME"
      psk="YOUR_PASSWORD"
      key_mgmt=WPA-PSK
    }
Insert the SD card into the PI, and boot. By default, your username is *pi* and password *raspberry*. On Windows using Putty, or on Mac using the terminal, try

    ssh pi@raspberrypi.local

or if that doesn't work find and use its actual IP, for example `ssh pi@192.168.0.0`. The terminal will ask for your password (by default *raspberry*). Next, we need to change the default password (and name of the pi if you want), enable I2C and SPI. Execute the following command:

    sudo raspi-config

In **Change user password** you should change your password. In **Network Options --> Hostname** you can change the name of the PI on the network, to, for example, "*dataframe*". In **Interfacing Option**, enable **SPI** and **I2C**. In **ADVANCE --> Memory Split** change the value to 16. This lowers the reserved memory for GPU related activities - don't change this setting if you foresee you will need more GPU in the near future. Once finished, reboot, using:

    sudo reboot

Next, copy over the install_dependencies.sh file to the PI. Using the PI's name (in this example 'dataframe'). Find the path to it on your computer, and in the command line interface (Putty/Terminal) enter the following:

    scp /path/to/local/folder/install_dependencies.sh pi@dataframe.local:/home/pi

The terminal will ask for your password. When done, connect to your PI over ssh (e.g. `ssh pi@dataframe.local` Now, we can auto-install the required dependencies by running:

    sudo chmod +x install_dependencies.sh
    sudo bash install_dependencies.sh

This will enable the script to be executed and then install libraries such as [Samba](https://magpi.raspberrypi.org/articles/samba-file-server), [CircuitPython](https://learn.adafruit.com/circuitpython-on-raspberrypi-linux/installing-circuitpython-on-raspberry-pi), [Pyrebase](https://github.com/thisbejim/Pyrebase), [Adafruit NeoPixel Library](https://learn.adafruit.com/neopixels-on-raspberry-pi/raspberry-pi-wiring) and [evdev](https://pypi.org/project/evdev/). If all went well, you should now see a shared folder on the network - which should allow you to update files and codes on your personal machine, and instantly run them on your PI for development.

## LCD screen
- (add description of setup and parts)
- This schematic: https://www.lcd-module.com/eng/pdf/doma/dog-me.pdf

## Touchscreen
This prototype is using a 15.1" 5-Wire resistive touchscreen ([this one](https://uk.rs-online.com/web/p/touch-screen-sensors/7105240/) from RS-Online), to roughly accommodate A4 sized artworks. Combined with an AR1100BRD it is automatically recognised as a USB mouse. Using [Pynput](https://pypi.org/project/pynput/) it listens for touch events, as these are all registered as presses??? (TEST!!)


#TODO
- Connect I2C to Arduino Trinket to read analog inputs, see [here](https://www.reddit.com/r/raspberry_pi/comments/807smc/i2c_with_adafruit_trinket_as_slave_have_some/, https://forums.adafruit.com/viewtopic.php?f=52&t=128768#p652429, https://create.arduino.cc/projecthub/aardweeno/controlling-an-arduino-from-a-pi3-using-i2c-59817b)
- Calibrate touchscreen using a 4-point measurement with the LED screen.
- Test performance of the prototype on a Raspberry Pi Zero
- prevent error on unplugging touchscreen
