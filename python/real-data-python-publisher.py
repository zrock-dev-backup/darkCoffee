import time
import serial
import json
import paho.mqtt.client as mqtt
import sys
import random

arduino = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
time.sleep(2)
arduino.reset_input_buffer()

MQTT_BROKER = "172.20.25.130"
MQTT_PORT = 1883
MQTT_TOPIC_TEMPERATURE = "sensors/temperature/main-room"
MQTT_TOPIC_HUMIDITY = "sensors/humidity/main-room"


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"Successfully connected to Mosquitto Broker at {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"Failed to connect, return code {rc}")
        sys.exit()

def on_publish(client, userdata, mid, reasonCode=None, properties=None):
    print(f"Message {mid} published.")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="arduino_publisher")
client.on_connect = on_connect
client.on_publish = on_publish
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()

try:
    while True:
        line = arduino.readline()

        if line:
            try:
                json_string = line.decode('utf-8').strip()

                if not json_string.startswith('{') or not json_string.endswith('}'):
                    continue

                data = json.loads(json_string)

                if "temperature" in data and "humidity" in data:
                    print("Data received from Arduino:", data)

                    temperature_payload = {
                        "value": data["temperature"],
                        "unit": "°C"
                    }
                    result_temp = client.publish(MQTT_TOPIC_TEMPERATURE, json.dumps(temperature_payload))
                    if result_temp.rc == mqtt.MQTT_ERR_SUCCESS:
                        print(f"Publish on '{MQTT_TOPIC_TEMPERATURE}': {temperature_payload}")
                    else:
                        print(f"Error publishing temperature")

                    humidity_payload = {
                        "value": data["humidity"],
                        "unit": "%"
                    }
                    result_hum = client.publish(MQTT_TOPIC_HUMIDITY, json.dumps(humidity_payload))
                    if result_hum.rc == mqtt.MQTT_ERR_SUCCESS:
                        print(f"Published on '{MQTT_TOPIC_HUMIDITY}': {humidity_payload}")
                    else:
                        print(f"Error publishing humidity")

                elif "error" in data:
                    print("Error Arduino:", data["error"])


            except json.JSONDecodeError:
                print("Error: JSON bad format.")

        time.sleep(2)

except KeyboardInterrupt:
    print("\nPublisher interrupted by user.")
finally:
    client.loop_stop()
    client.disconnect()
    arduino.close()
    print("Disconnected from broker and disconnection")
