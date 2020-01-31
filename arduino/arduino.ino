/*
   Created by D.Verweij

   Based on https://github.com/mobizt using Firebase Realtime Database
   https://github.com/mobizt/Firebase-Arduino-WiFi101

   - Stream + Get/Set method works inconsistent together
   - Note: typos in database references do not throw errors (becomes unresponsive)
   - Firebase.get() cannot (by default) retreive more than 400 Bytes of data
      - LED Matrix string = # LEDS * 6 bytes (e.g. 120 LEDs is 720 bytes)
      - Quick fix: local copy of library with increased "FIREBASE_RESPONSE_SIZE" to 1000
          - Costs more memory allocation, but should allow for 720 bytes + header. Might need to increase for larger LED matrices.
   - Current solution: Firebase.get integer with unix of latest update (4 bytes // TODO: check if not unsigned_long (then 8 bytes))
      - if new update (newer unix), get full String (>720 bytes);
   - Polling frequency = response time. (e.g. 1.5 seconds per poll, ~1.5 seconds response time between save and display).
*/

//Required WiFi101 Library for Arduino from https://github.com/arduino-libraries/WiFi101

#include "src/Firebase_Arduino_based_on_WiFi101/src/Firebase_Arduino_WiFi101.h"   // locally stored version of Firebase_Arduino_WiFi101 library, with increased FIREBASE_RESPONSE_SIZE

#define ARDUINOTRACE_ENABLE 1  // Disable (0) or enable (1) all traces
#include <ArduinoTrace.h>      // Easy trace / variable dump library (use TRACE() or DUMP(var))

#include "arduino_secrets.h"
//  arduino_secrets.h contains:
//
//  #define FIREBASE_HOST "YOUR_FIREBASE_PROJECT.firebaseio.com"
//  #define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"
//  #define WIFI_SSID "YOUR_WIFI_AP"
//  #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
//
//  arduino_secrets.h is added to .gitignore

// path for this matrix to listen to
String path = "/matrices/tell-degree-stop/";

#include <Adafruit_NeoPixel.h>
#ifdef __AVR__
#include <avr/power.h>
#endif

#define PIN 6 // LED strip data pin

FirebaseData firebaseData;                              // Define Firebase data object
Adafruit_NeoPixel strip =
  Adafruit_NeoPixel(120, PIN, NEO_RGBW + NEO_KHZ800);   // Depends on LEDstrip, see Adafruit Example Code

int potpin = 0;               // A potmeter to reduce overall brightness. Will replace with LDR (or alike)
int potpinVal = 0;            // Potmeter reading result (to be multiplied with LED values)
int prev_potpinVal = 0;       // Previous potmeter result
float potpinValFloat = 0.0;   // to use for LEDs (one variable, faster calculations?).
int potpinDiff = 20;           // Prevent debouncing/jittering by having threshold for potmeter readings -- 20 gives 50 types of brightness

String matrixString = "";     // keep a local copy of the database string for LED RGB valus
int matrixSize[2] = {9, 13};  // size of the matrix we are currently working with;
int totalLEDs;                // # of LEDS in the matrix, is size.x * size.y
int matrix[117][4];           // 117 LEDs, with 4 values for RGBW

int lastDatabaseChange = 0;   // track last time the database updated (unix time)
bool getNewData = false;      // if newer value for lastDatabaseChange, flag for new data

unsigned long getDataPrevMillis = 0;  // store last polling time
int getDataThreshold = 1500;          // time in between polling

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

  strip.begin();
  strip.show(); // Initialize all pixels to 'off'

  Serial.print("Connecting to Wi-Fi");
  int status = WL_IDLE_STATUS;

  int counter = 0;
  while (status != WL_CONNECTED)
  {
    status = WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print(".");

    // LED strip search for wifi animation
    strip.setPixelColor(counter, strip.Color(0, 0, 0, 0));
    counter = (counter + 1) % 117;
    strip.setPixelColor(counter, strip.Color(0, 0, 0, 100));
    strip.show();
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

  /* ADDED TO MAINTAIN STREAM */

  if (!Firebase.beginStream(firebaseData, path + "updated"))
  {
    Serial.println("------Can't begin stream connection------");
    Serial.println("REASON: " + firebaseData.errorReason());
    Serial.println();
  }

  /* --- END OF ADDED  */

}

void loop()
{

  potpinVal = analogRead(potpin); // get the brightness modifier (will be 0 - 1023)

  // check if differs, if so, then update LED and store value
  if (abs(potpinVal - prev_potpinVal) > potpinDiff) {
    potpinValFloat = (float) potpinVal / 1023;
    prev_potpinVal = potpinVal;
    updateMatrix();

  }

  /* ADDED TO MAINTAIN STREAM */
  if (!Firebase.readStream(firebaseData))
  {
    Serial.println("Can't read stream data");
    Serial.println("REASON: " + firebaseData.errorReason());
    Serial.println();
  }

  if (firebaseData.streamTimeout())
  {
    Serial.println("Stream timeout, resume streaming...");
    Serial.println();
  }

  if (firebaseData.streamAvailable())
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
  /* ---- END OF ADDED */

  /*

    if (millis() - getDataPrevMillis > getDataThreshold) {
    getDataPrevMillis = millis();

    if (Firebase.getInt(firebaseData, path + "updated"))
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
  */

  if (getNewData)
  {
    getNewData = false;


    if (Firebase.getString(firebaseData, path + "LED"))
    {

      if (firebaseData.dataType() == "string") {


        String in = firebaseData.stringData();

        // TODO: validate incoming data

        int numLeds = in.length() / 6;

        for (int i = 0; i < numLeds && i < totalLEDs; i++) {    // double check in case incoming data is different length than local stored
          int offset = i * 6;
          matrix[i][0] = decodeNibble(in[offset + 0]) * 16 + decodeNibble(in[offset + 1]);
          matrix[i][1] = decodeNibble(in[offset + 2]) * 16 + decodeNibble(in[offset + 3]);
          matrix[i][2] = decodeNibble(in[offset + 4]) * 16 + decodeNibble(in[offset + 5]);
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

    /* ADDED TO MAINTAIN STREAM */
    if (!Firebase.beginStream(firebaseData, path + "updated"))
    {
      Serial.println("------Can't begin stream connection------");
      Serial.println("REASON: " + firebaseData.errorReason());
      Serial.println();
    }
    /* --- END OF ADD */

  }
}

void updateMatrix() {
  for (int i = 0; i < totalLEDs; i++) {
    for (int j = 0; j < 4; j++) {
      strip.setPixelColor(i, strip.Color((int) (potpinValFloat * matrix[i][0]) , (int) (potpinValFloat * matrix[i][1]), (int) (potpinValFloat * matrix[i][2]), (int) (potpinValFloat * matrix[i][3])));
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
