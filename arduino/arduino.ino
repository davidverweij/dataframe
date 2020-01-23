/*
   Created by D.Verweij

   Based on https://github.com/mobizt using Firebase Realtime Database
   https://github.com/mobizt/Firebase-Arduino-WiFi101

*/

//Example shows how to connect to Firebase RTDB and get stream connection

//Required WiFi101 Library for Arduino from https://github.com/arduino-libraries/WiFi101

#include "src/Firebase_Arduino_based_on_WiFi101/src/Firebase_Arduino_WiFi101.h"   // note, this is locally stored because we increased the buffer size (defined in the header)


// easy trace/debug library
#define ARDUINOTRACE_ENABLE 1  // Disable (0) or enable (1) all traces
#include <ArduinoTrace.h>


#include "arduino_secrets.h"
// contains sensitive data

#include <Adafruit_NeoPixel.h>
#ifdef __AVR__
#include <avr/power.h>
#endif

#define PIN 6 // LED strip data pin

//Define Firebase data object
FirebaseData firebaseData;

// led strip prep - we are currently testing RGBW led strip of 2 meters (zigzaggin pattern)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(120, PIN, NEO_RGBW + NEO_KHZ800);

// added a potmeter to tune down overall brightness
int potpin = 0; // reading the potmeter to reduce overall brightness
int potpinVal = 0; // the result of reading the potpin
int prev_potpinVal = 0; // history of potpin, to see when we need to update the LED
int potpinDiff = 2; // difference needed to be flagged, prevents debouncing
String matrixString = "";  // keep a local copy of the databse string
int matrixSize[2] = {9, 13}; // size of the matrix;
int totalLEDs;
int matrix[120][4]; // 120 LEDs, with 4 values for RGBW

int lastDatabaseChange = 0;   // track last time the database updated
bool getNewData = false;

unsigned long getDataPrevMillis = 0;


void setup()
{

  Serial.begin(115200);
  delay(100);
  Serial.println();

  totalLEDs = matrixSize[0] * matrixSize[1];

  //populate matrix array
  for (int i = 0; i < totalLEDs; i++) {
    for (int j = 0; j < 4; j++) {
      matrix[i][j] = 0;
    }
  }

  Serial.print("Connecting to Wi-Fi");
  int status = WL_IDLE_STATUS;
  while (status != WL_CONNECTED)
  {
    status = WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("IoTCanvas Database ID: ");
  Serial.println(FIREBASE_ID);
  Serial.print("Connected with IP: ");
  IPAddress ip = WiFi.localIP();
  Serial.println(ip);
  Serial.println();

  //Provide the autntication data
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH, WIFI_SSID, WIFI_PASSWORD);
  Firebase.reconnectWiFi(true);


  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void loop()
{

  potpinVal = (int) ((double) analogRead(potpin) / 10.23); // get the brightness modifier (will be 0 - 100)

  // check if differs, if so, then update LED and store value
  if (abs(potpinVal - prev_potpinVal) > potpinDiff) {
    updateMatrix();
    prev_potpinVal = potpinVal;
  }

  if (millis() - getDataPrevMillis > 1500) {
    getDataPrevMillis = millis();
    
    if (Firebase.getInt(firebaseData, updatepath))
    {
      if (firebaseData.dataType() == "int") {
        int updatedOn = firebaseData.intData();
        if (updatedOn > lastDatabaseChange) {
          getNewData = true;
          lastDatabaseChange = updatedOn;
          DUMP(lastDatabaseChange);
        }
      }
    }
  }

  if (getNewData)
  {
    getNewData = false;


    if (Firebase.getString(firebaseData, LEDpath))
    {

      if (firebaseData.dataType() == "string") {


        String in = firebaseData.stringData();

        // TODO: validate incoming data

        int numLeds = in.length() / 6;

        for (int i = 0; i < numLeds && i < totalLEDs; i++) {    // double check in case incoming data is different length than local stored
          int offset = i * 6;
          matrix[i][0] = (int) ((double) potpinVal * (decodeNibble(in[offset + 0]) * 16 + decodeNibble(in[offset + 1])) / 100);
          matrix[i][1] = (int) ((double) potpinVal * (decodeNibble(in[offset + 2]) * 16 + decodeNibble(in[offset + 3])) / 100);
          matrix[i][2] = (int) ((double) potpinVal * (decodeNibble(in[offset + 4]) * 16 + decodeNibble(in[offset + 5])) / 100);
          //led[i][3] = 0;  // we work without white at the moment
        }

        updateMatrix();

        Serial.println("Updated matrix with: " + in);

      } else {
        Serial.print("Incorrect formatting, datatype: ");
        Serial.println(firebaseData.dataType());
      }

    }
    else
    {
      Serial.println("----------Can't get data--------");
      Serial.println("REASON: " + firebaseData.errorReason());
      Serial.println("--------------------------------");
      Serial.println();
      if (firebaseData.bufferOverflow())  Serial.println("BUFFER OVERFLOW");
    }

  }
}

void updateMatrix() {
  for (int i = 0; i < totalLEDs; i++) {
    for (int j = 0; j < 4; j++) {
      strip.setPixelColor(i, strip.Color(matrix[i][0] , matrix[i][1], matrix[i][2], matrix[i][3]));
    }
  }
  strip.show();
}

boolean isValidNumber(String str) {
  boolean isNum = false;
  for (byte i = 0; i < str.length(); i++)
  {
    isNum = isDigit(str.charAt(i));
    if (!isNum) return false;
  }
  return isNum;
}

int decodeNibble(char value) {
  if (value >= '0' && value <= '9') return value - '0';
  if (value >= 'A' && value <= 'Z') return value - 'A';
  if (value >= 'a' && value <= 'z') return value - 'a';
  return -1;
}
