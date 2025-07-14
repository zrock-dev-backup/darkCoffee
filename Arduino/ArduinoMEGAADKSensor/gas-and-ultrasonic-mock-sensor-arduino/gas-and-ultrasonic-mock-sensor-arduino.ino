#include <ArduinoJson.h>

/**
 * @brief Represents the configuration for a mock sensor.
 */
struct MockSensor {
  float baseValue;   ///< Central value around which readings fluctuate.
  float variance;    ///< Maximum variation from the base value.
  float minValue;    ///< Minimum possible reading.
  float maxValue;    ///< Maximum possible reading.
};

MockSensor gasSensor = {300.0, 50.0, 0.0, 1023.0};
MockSensor distanceSensor = {50.0, 30.0, 5.0, 200.0};

unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 1000;

/**
 * @brief Initializes serial communication and seeds the random generator.
 */
void setup() {
  Serial.begin(9600);
  randomSeed(analogRead(A5));
  Serial.println("Mock Sensor System Initialized");
}

/**
 * @brief Main loop to generate and transmit mock sensor data periodically.
 */
void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastUpdate >= UPDATE_INTERVAL) {
    StaticJsonDocument<128> gasDoc;
    StaticJsonDocument<128> ultrasonicDoc;

    float gasLevel = generateMockReading(gasSensor);
    gasDoc["topic"] = "sensors/gas/kitchen";
    gasDoc["payload"]["value"] = (int)gasLevel;
    gasDoc["payload"]["unit"] = "ppm";

    float distance = generateMockReading(distanceSensor);
    ultrasonicDoc["topic"] = "sensors/ultrasonic/entryway";
    ultrasonicDoc["payload"]["value"] = (int)distance;
    ultrasonicDoc["payload"]["unit"] = "cm";

    serializeJson(gasDoc, Serial);
    Serial.println();

    serializeJson(ultrasonicDoc, Serial);
    Serial.println();

    lastUpdate = currentTime;
  }

  delay(10);
}

/**
 * @brief Generates a simulated sensor reading based on defined variance and constraints.
 * 
 * @param sensor Reference to the sensor configuration.
 * @return float Simulated sensor reading.
 */
float generateMockReading(MockSensor& sensor) {
  float variance = random(-sensor.variance * 100, sensor.variance * 100) / 100.0;
  float value = sensor.baseValue + variance;
  value = constrain(value, sensor.minValue, sensor.maxValue);

  sensor.baseValue += random(-10, 11) / 100.0;
  sensor.baseValue = constrain(sensor.baseValue, 
                               sensor.minValue + sensor.variance, 
                               sensor.maxValue - sensor.variance);
  return value;
}
