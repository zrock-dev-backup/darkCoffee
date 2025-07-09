import paho.mqtt.client as mqtt
import json
import time
import random
import sys

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sensors/live/data"

def on_connect(client, userdata, flags, rc, properties=None):
    """Callback function for when the client connects to the broker."""
    if rc == 0:
        print(f"Successfully connected to Mosquitto Broker at {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"Failed to connect, return code {rc}\n")
        sys.exit()

def on_publish(client, userdata, mid, reasonCode, properties):
    print(f"Message {mid} published.")

def generate_sensor_data():
    """Generates a dictionary of simulated sensor data."""

    # Base values for realistic simulation
    temp_value = round(random.uniform(18.0, 24.0), 2)
    gas_value = random.randint(15, 34)
    humidity_value = random.randint(45, 55)

    # Occasionally spike values to test alerts (e.g., ~15% chance of an alert state)
    if random.random() < 0.10: # 10% chance of UNSAFE
        print("--- Generating UNSAFE event ---")
        temp_value = round(random.uniform(31.0, 35.0), 2)
        gas_value = random.randint(51, 70)
    elif random.random() < 0.05: # 5% chance of WARNING
        print("--- Generating WARNING event ---")
        temp_value = round(random.uniform(26.0, 29.0), 2)
        gas_value = random.randint(35, 50)

    payload = {
        "tSensor": "Temperature",
        "tValue": temp_value,
        "gSensor": "Gas",
        "gValue": gas_value,
        "hSensor": "Humidity", # Adding humidity for more variety
        "hValue": humidity_value,
    }
    return payload

def run_publisher():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="python_publisher_1")

    # Assign callbacks
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()

    try:
        while True:
            # Generate and publish data
            data = generate_sensor_data()
            json_payload = json.dumps(data)

            result = client.publish(MQTT_TOPIC, json_payload)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"Published to '{MQTT_TOPIC}': {json_payload}")
            else:
                print(f"Failed to publish message to topic {MQTT_TOPIC}")
            time.sleep(2)

    except KeyboardInterrupt:
        print("\nPublisher stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected from broker.")

if __name__ == '__main__':
    run_publisher()