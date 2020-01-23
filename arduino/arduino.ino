/*
   Created by D.Verweij

   Based on https://github.com/mobizt using Firebase Realtime Database
   https://github.com/mobizt/Firebase-Arduino-WiFi101

*/

//Example shows how to connect to Firebase RTDB and get stream connection

//Required WiFi101 Library for Arduino from https://github.com/arduino-libraries/WiFi101


#include "Firebase_Arduino_WiFi101.h"
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
// path for this matrix to listen to
#define path "/matrix1"

// led strip prep - we are currently testing RGBW led strip of 2 meters (zigzaggin pattern)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(120, PIN, NEO_RGBW + NEO_KHZ800);

// added a potmeter to tune down overall brightness
int potpin = 0; // reading the potmeter to reduce overall brightness
int potpinVal = 0; // the result of reading the potpin
int matrix[120][4]; // 120 LEDs, with 4 values for RGBW

unsigned long sendDataPrevMillis = 0;
uint16_t count = 0;


void setup()
{

  Serial.begin(115200);
  delay(100);
  Serial.println();

  //populate matrix array
  for (int i = 0; i < 120; i++) {
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

  if (!Firebase.beginStream(firebaseData, path + "/LED"))
  {
    Serial.println("------Can't begin stream connection------");
    Serial.print("REASON: ");
    Serial.println(firebaseData.errorReason());
    Serial.println();
  }

  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void loop()
{

  potpinVal = (int) ((double) analogRead(potpin) / 10.23); // get the brightness modifier (will be 0 - 100)


  if (!Firebase.readStream(firebaseData))
  {
    Serial.println("Can't read stream data");
    Serial.print("REASON: ");
    Serial.println(firebaseData.errorReason());
    Serial.println();
  }

  if (firebaseData.streamTimeout())
  {
    Serial.println("Stream timeout, resume streaming...");
    Serial.println();
  }

  if (firebaseData.streamAvailable())
  {
    if (firebaseData.streamPath().equals("/matrix1")) {
      String LED = firebaseData.dataPath();
      LED.replace("/", "");
      if (isValidNumber(LED) && firebaseData.dataType() == "string") {
        int LEDtarget = LED.toInt();
        String in = firebaseData.stringData();

        boolean valid = true;

        int RGBW[4];

        for (int i = 0; i < 4; i++) {
          String temp = getValue(in, ';', i);
          temp.trim();
          int tempInt = temp.toInt(); // will be 0 if not a valid string to convert, but then isValidNumber will flag false

          if (isValidNumber(temp) && tempInt <= 255 && tempInt >= 0) {
            RGBW[i] = tempInt;
          } else {
            valid = false;
            break;
          }
        }



        if (!valid) {
          Serial.println("Invalid data input: " + in);
        } else {
          for (int i = 0; i < 4; i++) {
            matrix[LEDtarget][i] = RGBW[i];
          }
          // update LED stip and show
          strip.setPixelColor(LEDtarget, strip.Color(RGBW[0], RGBW[1], RGBW[2], RGBW[3]));
          strip.show();
          delay(10);

          Serial.print("Updated LED: " + LED);
          Serial.println("to: " + in);
        }



      } else {
        Serial.print("Incorrect formatting targeted LED: " + LED);
        Serial.println(" , datatype: " + firebaseData.dataType());
      }
    }



  }
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

String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }

  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}
