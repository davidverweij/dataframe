#!/bin/sh
echo ">> Starting setup for DataFrame PI"

# "> /dev/null 2>&1" hides the logs from the user running the script

apt-get update > /dev/null 2>&1           # get's the latest updates for the OS
apt-get full-upgrade -y > /dev/null 2>&1  # updates the OS where possible

while true; do
  read -p "Do you wish to setup a shared network folder? y/n " yn
  case $yn in
    [Yy]* )
    echo "Installing Samba .. ";
    apt-get install samba samba-common-bin > /dev/null 2>&1    # installs Samba, for network file sharing
    mkdir -m 1777 /share                      # creates a editable 'share' folder to be seen on the local Network
    cat >> /etc/samba/smb.conf << EOT        # adds config for Samba to set that folder open to the local Network

[share]
  Comment = Pi shared folder
  Path = /share
  Browseable = yes
  Writeable = Yes
  only guest = no
  create mask = 0777
  directory mask = 0777
  Public = yes
EOT

    while true; do
      read -p "Do you want guest access (anyone on the network) to this folder? y/n  " yn
      case $yn in
        [Yy]* ) cat "  Guest ok = yes" >> /etc/samba/smb.conf; break;;
        [Nn]* ) echo ">> Samba will now ask for a password for a new user 'pi'. There’s no harm in reusing your raspberry login if you want to, as this is a low-security, local network project"
              smbpasswd -a pi                    # create a password for samba Service
              break
              ;;
        * ) echo "Please answer yes or no";;
      esac
    done

    /etc/init.d/smbd restart        # restart samba - the folder should now appear in the Network
    break
    ;;
    [Nn]* ) echo "Samba will not be installed"; break;;
    * ) echo "Please answer yes or no";;
  esac
done

# test SPI and I2C protocols are available
echo ">> Below you should see I2C and SPI devices. If not, please enable these in raspi-config"
ls /dev/i2c* /dev/spi*

echo ">> Now installing python libraries..."
apt install python3-pip > /dev/null 2>&1           # install pip3, a python3 package installer
echo "Pip3 Python Package Installer installed, with version:"
pip3 --version                  # report back if the version was installed

# install required libraries
pip3 install RPI.GPIO > /dev/null 2>&1             # access to GPIO pins
echo "RPI.GPIO Package installed"
pip3 install adafruit-blinka > /dev/null 2>&1      # CircuitPython
echo "Adafruit Blinka Package installed"
pip3 install pyrebase > /dev/null 2>&1             # Firebase communication
echo "Pyrebase Package installed"
pip3 install rpi_ws281x adafruit-circuitpython-neopixel > /dev/null 2>&1      # neopixel Library
echo "Neopixel Package installed"
pip3 install st7036  > /dev/null 2>&1              # DogLCD display Library
echo "ST7036 Package installed"
pip3 install evdev > /dev/null 2>&1                # keyboard and mouse input library
echo "Evdev Package installed"

echo ">> Done installing dependencies"
exit
