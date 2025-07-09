import type { SensorType, SensorStatus } from "../types";

const THRESHOLDS = {
  Temperature: {
    UNSAFE_LOW: 10,
    WARNING_LOW: 15,
    WARNING_HIGH: 25,
    UNSAFE_HIGH: 30,
  },
  Humidity: {
    UNSAFE_LOW: 30,
    WARNING_LOW: 40,
    WARNING_HIGH: 60,
    UNSAFE_HIGH: 70,
  },
  Gas: {
    // CO
    SAFE_MAX: 35,
    WARNING_MAX: 50,
  },
  Motion: {
    UNSAFE_VALUE: 1,
  },
};

// TODO: apply open closed
export function getSensorStatus(type: SensorType, value: number): SensorStatus {
  switch (type) {
    case "Temperature": {
      const t = THRESHOLDS.Temperature;
      if (value < t.UNSAFE_LOW || value > t.UNSAFE_HIGH) return "UNSAFE";
      if (value < t.WARNING_LOW || value > t.WARNING_HIGH) return "WARNING";
      return "SAFE";
    }
    case "Humidity": {
      const h = THRESHOLDS.Humidity;
      if (value < h.UNSAFE_LOW || value > h.UNSAFE_HIGH) return "UNSAFE";
      if (value < h.WARNING_LOW || value > h.WARNING_HIGH) return "WARNING";
      return "SAFE";
    }
    case "Gas": {
      const g = THRESHOLDS.Gas;
      if (value > g.WARNING_MAX) return "UNSAFE";
      if (value >= g.SAFE_MAX) return "WARNING";
      return "SAFE";
    }
    case "Motion": {
      return value === THRESHOLDS.Motion.UNSAFE_VALUE ? "UNSAFE" : "SAFE";
    }
    default:
      return "UNKNOWN";
  }
}
