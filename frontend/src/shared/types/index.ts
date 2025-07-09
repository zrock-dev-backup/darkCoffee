export type SensorType =
  | "Temperature"
  | "Humidity"
  | "Gas"
  | "Motion"
  | "Distance";

export type SensorStatus = "SAFE" | "WARNING" | "UNSAFE" | "UNKNOWN";

export interface SensorReading {
  id: string;
  name: string;
  type: SensorType;
  value: number;
  unit: string;
  status: SensorStatus;
  timestamp: number;
}

export interface MqttPayload {
  dSensor?: string;
  dValue?: number;
  gSensor?: string;
  gValue?: number;
  tSensor?: string;
  tValue?: number;
}
