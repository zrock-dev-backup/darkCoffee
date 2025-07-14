/**
 * DHT11 Sensor Reader
 * This sketch reads temperature and humidity data from the DHT11 sensor and prints the values to the serial port.
 * It also handles potential error states that might occur during reading.
 *
 * Author: Dhruba Saha
 * Version: 2.1.0
 * License: MIT
 */

// Include the DHT11 library for interfacing with the sensor.
#include <DHT11.h>

DHT11 dht11(2);

void setup() {
    Serial.begin(9600);
}

void loop() {
    int temperature = 0;
    int humidity = 0;

    int result = dht11.readTemperatureHumidity(temperature, humidity);

    if (result == 0 && temperature != 0 && humidity != 0) {
        char buffer[64];
        snprintf(buffer, sizeof(buffer), "{\"temperature\": %d, \"humidity\": %d}", temperature, humidity);
        Serial.println(buffer);
    } else {
        char errorBuffer[64];
        snprintf(errorBuffer, sizeof(errorBuffer), "{\"error\": \"%s\"}", DHT11::getErrorString(result));
        Serial.println(errorBuffer);
    }

    delay(2000); 
}
