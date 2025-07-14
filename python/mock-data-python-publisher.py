import paho.mqtt.client as mqtt
import json
import time
import serial
import sys

MQTT_BROKER = "172.20.25.130"
MQTT_PORT = 1883
SERIAL_PORT = "/dev/ttyACM1"
BAUD_RATE = 9600

class SerialReader:
    """
    Manages serial communication with a connected device such as an Arduino.

    Attributes:
        port (str): Serial port address (e.g., '/dev/ttyACM0').
        baud_rate (int): Communication speed in baud.
        serial (serial.Serial | None): Serial connection object.
    """

    def __init__(self, port: str, baud_rate: int):
        """
        Initializes the SerialReader with the given port and baud rate.

        Args:
            port (str): The serial port to connect to.
            baud_rate (int): The baud rate for communication.
        """
        self.port = port
        self.baud_rate = baud_rate
        self.serial = None

    def open(self):
        """
        Opens the serial connection and waits for the device to initialize.
        """
        try:
            self.serial = serial.Serial(self.port, self.baud_rate, timeout=2)
            print(f"Connected to Arduino on {self.port} at {self.baud_rate} baud.")
            time.sleep(2)
        except serial.SerialException:
            print(f"Could not open serial port {self.port}")
            sys.exit(1)

    def read_line(self) -> str:
        """
        Reads a single line from the serial port.

        Returns:
            str: The decoded and stripped line, or an empty string on error.
        """
        try:
            return self.serial.readline().decode('utf-8').strip()
        except Exception as e:
            print(f"Serial read error: {e}")
            return ""

    def close(self):
        """
        Closes the serial port if it is open.
        """
        if self.serial and self.serial.is_open:
            self.serial.close()
            print("Serial port closed.")


class MessageParser:
    """
    Parses raw input strings into MQTT-compatible topic and payload.
    """

    def parse(self, line: str) -> tuple[str, dict] | None:
        """
        Parses a JSON-formatted string into a topic and payload.

        Args:
            line (str): JSON string expected to contain 'topic' and 'payload' keys.

        Returns:
            tuple[str, dict] | None: A tuple of topic and payload if valid, else None.
        """
        try:
            data = json.loads(line)
            topic = data.get("topic")
            payload = data.get("payload")
            if topic and payload:
                return topic, payload
            print("Invalid data format (missing topic or payload).")
        except json.JSONDecodeError:
            print("Invalid JSON received.")
        return None


class MqttPublisher:
    """
    Handles MQTT client connection and message publication.

    Attributes:
        broker (str): MQTT broker address.
        port (int): MQTT broker port.
        client (mqtt.Client): Instance of the MQTT client.
    """

    def __init__(self, broker: str, port: int):
        """
        Initializes the MQTT publisher with broker and port.

        Args:
            broker (str): MQTT broker address.
            port (int): MQTT broker port.
        """
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="arduino_mqtt_publisher")
        self.client.on_connect = self.on_connect
        self.client.on_publish = self.on_publish
        self.broker = broker
        self.port = port

    def connect(self):
        """
        Connects to the MQTT broker and starts the network loop.
        """
        self.client.connect(self.broker, self.port, 60)
        self.client.loop_start()

    def disconnect(self):
        """
        Stops the MQTT network loop and disconnects from the broker.
        """
        self.client.loop_stop()
        self.client.disconnect()

    def publish(self, topic: str, payload: dict):
        """
        Publishes a message to a specified topic.

        Args:
            topic (str): MQTT topic string.
            payload (dict): Message content as a dictionary.
        """
        result = self.client.publish(topic, json.dumps(payload))
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"Published to '{topic}': {payload}")
        else:
            print(f"Failed to publish to '{topic}'")

    def on_connect(self, client, userdata, flags, rc, properties=None):
        """
        Callback for when the client connects to the broker.

        Args:
            client: The client instance for this callback.
            userdata: User-defined data.
            flags: Response flags sent by the broker.
            rc (int): Connection result code.
            properties: Optional MQTT v5 properties.
        """
        if rc == 0:
            print(f"Connected to MQTT broker at {self.broker}:{self.port}")
        else:
            print(f"Connection failed with code {rc}")
            sys.exit()

    def on_publish(self, client, userdata, mid, reasonCode, properties):
        """
        Callback for when a message is published.

        Args:
            client: The client instance for this callback.
            userdata: User-defined data.
            mid (int): Message ID.
            reasonCode: Result code.
            properties: Optional MQTT v5 properties.
        """
        print(f"Message {mid} published.")


class Application:
    """
    Coordinates serial reading, message parsing, and MQTT publishing.

    Attributes:
        reader (SerialReader): Serial reader instance.
        parser (MessageParser): Message parser instance.
        publisher (MqttPublisher): MQTT publisher instance.
    """

    def __init__(self, reader: SerialReader, parser: MessageParser, publisher: MqttPublisher):
        """
        Initializes the application with all required components.

        Args:
            reader (SerialReader): Object to read data from serial port.
            parser (MessageParser): Object to parse messages.
            publisher (MqttPublisher): Object to publish MQTT messages.
        """
        self.reader = reader
        self.parser = parser
        self.publisher = publisher

    def run(self):
        """
        Starts the main application loop for reading, parsing, and publishing messages.
        """
        self.reader.open()
        self.publisher.connect()

        try:
            while True:
                line = self.reader.read_line()
                if line:
                    print(f"Received from Arduino: {line}")
                    parsed = self.parser.parse(line)
                    if parsed:
                        topic, payload = parsed
                        self.publisher.publish(topic, payload)
        except KeyboardInterrupt:
            print("\nPublisher stopped by user.")
        finally:
            self.cleanup()

    def cleanup(self):
        """
        Cleans up resources by closing the serial port and disconnecting MQTT.
        """
        self.publisher.disconnect()
        self.reader.close()
        print("Application shutdown complete.")


if __name__ == '__main__':
    reader = SerialReader(SERIAL_PORT, BAUD_RATE)
    parser = MessageParser()
    publisher = MqttPublisher(MQTT_BROKER, MQTT_PORT)
    app = Application(reader, parser, publisher)
    app.run()
