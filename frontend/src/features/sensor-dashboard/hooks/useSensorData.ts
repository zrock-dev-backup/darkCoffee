import { useState, useEffect, useMemo } from "react";
import type { MqttPayload, SensorReading } from "../../../shared/types";
import { MqttService, type MqttStatus } from "../../../lib/mqtt/MqttService.ts";
import { getSensorStatus } from "../../../shared/utils/getSensorStatus.ts";

const MQTT_HOST = import.meta.env.VITE_MQTT_HOST || "localhost";
const MQTT_PORT = parseInt(import.meta.env.VITE_MQTT_PORT || "9001", 10);
const MQTT_CLIENT_ID = `dark-coffee-client-${Math.random().toString(16).substring(2, 8)}`;
const SENSOR_TOPIC = "sensors/live/data";

export function useSensorData() {
  const [readings, setReadings] = useState<Record<string, SensorReading>>({});
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>("DISCONNECTED");

  useEffect(() => {
    const mqttService = MqttService.getInstance(
      MQTT_HOST,
      MQTT_PORT,
      MQTT_CLIENT_ID,
    );

    const handleMessage = (payload: MqttPayload) => {
      const newReadings: Record<string, SensorReading> = {};
      const timestamp = Date.now();

      // TODO: apply open closed
      if (payload.tSensor && payload.tValue !== undefined) {
        const id = "temp-main";
        newReadings[id] = {
          id,
          name: "Temperature",
          type: "Temperature",
          value: payload.tValue,
          unit: "°C",
          status: getSensorStatus("Temperature", payload.tValue),
          timestamp,
        };
      }
      if (payload.gSensor && payload.gValue !== undefined) {
        const id = "gas-main";
        newReadings[id] = {
          id,
          name: "Gas (CO)",
          type: "Gas",
          value: payload.gValue,
          unit: "ppm",
          status: getSensorStatus("Gas", payload.gValue),
          timestamp,
        };
      }

      setReadings((prev) => ({ ...prev, ...newReadings }));
    };

    const handleStatusChange = (status: MqttStatus) => {
      setMqttStatus(status);
    };

    mqttService.subscribe(SENSOR_TOPIC, handleMessage);
    mqttService.onStatusChange(handleStatusChange);
    mqttService.connect();

    return () => {
      mqttService.unsubscribe(SENSOR_TOPIC, handleMessage);
      mqttService.offStatusChange(handleStatusChange);
    };
  }, []);

  const sensorList = useMemo(() => Object.values(readings), [readings]);

  const unsafeSensors = useMemo(
    () =>
      sensorList.filter(
        (s) => s.status === "UNSAFE" && s.timestamp > Date.now() - 5000,
      ),
    [sensorList],
  );

  const isStale =
    mqttStatus !== "CONNECTED" ||
    (sensorList.length > 0 &&
      Date.now() - Math.max(...sensorList.map((s) => s.timestamp)) > 5000);

  return {
    sensors: sensorList,
    isStale,
    connectionStatus: mqttStatus,
    unsafeSensors,
  };
}
