# -----------------------------------------------------------
#  A continuous script that handles all incoming events and display for the DataFrame
#
#  (C) 2020 David Verweij, Newcastle, United Kingdom
#
# -----------------------------------------------------------


# TODO : keep script alive, using something like this: http://code.activestate.com/recipes/576911-keep-a-process-up-and-running/
# TODO : Listen to button presses using events like this: https://raspberrypihq.com/use-a-push-button-with-raspberry-pi-gpio/
# TODO : set up a streaming link to the firebase? So we know when something is updated - rather than checking values all the time
# TODO : set timer to refresh tokenID (still needed with streaming?)
# TODO : create repeating method to indicate dataframe is online and alive (time, thread, etc)
# TODO : Interface with this script as a service running (https://rpyc.readthedocs.io/en/latest/)


import sys
import platform                  # to determine which system we are running on
import time                      # timer helper functions
import json, re                  # json and regex helper libraries
import requests.exceptions       # error types
import pyrebase                  # Firebase database helper library
import urllib                    # quick and easy url methods

system = platform.system() is "Linux"  # Linux: "Linux", Mac: "Darwin", Windows: "Windows"
print("Running IotCanvas.py on a ", platform.system(), " operated platform")

if system:                 # if we work on a Linux system (assuming only when using a Pi)
    import board           # GPIO helper functions - code must be run as root for GPIO access
    import neopixel        # neopixel helper library
else:
    from beautifultable import BeautifulTable

# ---
# HELPER VARIABLES
# ---

user_authenticated = False
refreshMatrix = False
db_connected = False
stream_running = False
last_db_refresh = 0
ledmatrix = [9,13]
internet_status = False

# ---
# HELPER FUNCTIONS
# ---

def getInternetStatus():
    try:
        url = "https://www.google.com"
        urllib.urlopen(url)
        internet_status = True
    except:
        internet_status = False

def refreshToken():
    user = auth.refresh(user['refreshToken'])

def startStream():
    try:
        trigger_stream = db.child("matrices").child(matrixref).child('last_trigger').stream(firebase_stream_handler, user['idToken'])
    except:
        stream_running = False
        print("something wrong with streaming")

def firebase_stream_handler(message):
    if message["event"] is "auth_revoked":
        refreshToken()
        startStream()
        # do something with LED matrix just to illustrate if it works
    elif message["event"] is "put" and message["path"] is "/":
            # check with latest database trigger timestamp
            if message["data"] > last_db_refresh:
                # there has been a new trigger!
                print("new trigger found!")
            else:
                # ignore, it was an old timestamp
                print("not a new trigger - old timestamp")
    else:
        # unexpected updates
        print(message["event"]) # put
        print(message["path"]) # /
        print(message["data"]) # {'title': 'Pyrebase', "body": "etc..."}

def dataframeAliveSignal(db_ref, matrix_ref, unixtime):   # indicated to firebase that we are alive
    db_ref.child("matrices").child(matrix_ref).update({"alive":unixtime}, user['idToken'])

def updateMatrix():
    matrix_array = re.findall('......', matrix["LED"])     # split string in chuncks of 6

    if system:
        for num, led in enumerate(matrix_array):
            if num < (ledmatrix[0] * ledmatrix[1]):
                led_array = re.findall('..', led)           # assuming we have an list of 3
                pixels[num] = (int(led_array[0], 16),int(led_array[1], 16),int(led_array[2], 16))
        pixels.show()
        time.sleep(1)
    else:                       # for debugging purposes, so we can see in the monitor what is going on
        table = BeautifulTable()
        rowflip = False         # the LED matrix is wired in a zigzag pattern
        for x in range(0, ledmatrix[0]):
            # y represents column value
            column = []
            if rowflip:
                for y in reversed(range(0, ledmatrix[1])):
                    # x represents row value
                    led = re.findall('..', matrix_array[(x*ledmatrix[1]) + y])      # assuming we have an list of 3
                    ledstr = str(int(led[0], 16)) + "\n" + str(int(led[1], 16)) +  "\n" + str(int(led[2], 16))
                    column.append(ledstr)
            else:
                for y in range(0, ledmatrix[1]):
                    # x represents row value
                    led = re.findall('..', matrix_array[(x*ledmatrix[1]) + y])      # assuming we have an list of 3
                    ledstr = str(int(led[0], 16)) + "\n" + str(int(led[1], 16)) +  "\n" + str(int(led[2], 16))
                    column.append(ledstr)

            table.insert_column(x,'', column)       # add to the column
            rowflip = not rowflip                   # flip zigzag pattern
            del column[:]                         # delete the temporary column to be sure

        print(table)                              # print the resulting pretty table to the console


# ---
# SETUP FOR THE FIREBASE DATABASE CONNECTION
# ---

import raspi_secrets        # a .gitignored file with firebase config
firebase = pyrebase.initialize_app(raspi_secrets.FirebaseConfig)
auth = firebase.auth()      # Get a reference to the auth service

try:
    user = auth.sign_in_with_email_and_password("davidverweij@gmail.com", "testingMyApp!")    # Log the user in
    user = auth.refresh(user['refreshToken'])   # refresh so we are only working with a userId, not localId
    db = firebase.database()    # Get a reference to the database service

    user_authenticated = True
    db_connected = True

except requests.exceptions.HTTPError as httpErr:
    error_message = json.loads(httpErr.args[1])['error']['message']
    print("Error in connecting to the service: ", error_message)
    user_authenticated = False
except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as connErr:
    print ("Error Connecting:",connErr)
except: # catch *all* exceptions
    print("Error in setting up database connection")
    raise
    # show on led matrix, perhaps trigger pi reboot?..

# setup for the LED matrix
if system:
    pixel_pin = board.D18       # NeoPixels must be connected to D10, D12, D18 or D21 to work.
    num_pixels = 117            # The number of NeoPixels
    ORDER = neopixel.NEO_RGBW   # change to RGB, GRB, RGBW or GRBW as needed
    pixels = neopixel.NeoPixel(
        pixel_pin,
        num_pixels,
        brightness=0.2,         # set brightness range for colours to work on (0.0 - 1.0)
        auto_write=False,       # if true, pixels will be updated when value is changed. If False, use show()
        pixel_order=ORDER)

if db_connected:
    matrixref = db.child("users").child(user['userId']).child('matrixref').get(user['idToken']).val()       # get the matrix reference
    matrix = db.child("matrices").child(matrixref).get(user['idToken']).val()                               # get the matrix data
    last_db_refresh = int(time.time())           # now in unix time (UTC)
    dataframeAliveSignal(db, matrixref, last_db_refresh)   # indicated to firebase that we are alive
    updateMatrix()
    startStream()                           # start stream listening to events



# ---
# THE INFINITE LOOP BELOW IS MAINLY DORMANT. EVENTS WILL TRIGGER CHANGES
# IT ALSO ENSURES EVERYTHING IS RUNNING AND UP TO DATE
# ---

while True:     # run forever
    if refreshMatrix:
        updateMatrix()
    pass
