import { useState } from "react";
import {
  Box,
  Grid,
  CssBaseline,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { useSensorData } from "../hooks/useSensorData";
import { SensorStatusCard } from "./SensorStatusCard";
import { CriticalAlert } from "./CriticalAlert";
import { StaleDataBanner } from "./StaleDataBanner";

const darkTheme = createTheme({
  palette: { mode: "dark" },
});

export const SensorDashboard = () => {
  const { sensors, isStale, unsafeSensors } = useSensorData();
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    new Set(),
  );

  const activeAlertSensor =
    unsafeSensors.find((s) => !acknowledgedIds.has(s.id)) || null;

  const handleAcknowledge = () => {
    if (activeAlertSensor) {
      setAcknowledgedIds((prev) => new Set(prev).add(activeAlertSensor.id));
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {isStale && <StaleDataBanner />}
      <Box
        sx={{ p: 3, opacity: isStale ? 0.5 : 1, transition: "opacity 0.3s" }}
      >
        <Grid container spacing={3}>
          {sensors.map((sensor) => (
            <Grid key={sensor.id}>
              <SensorStatusCard
                sensor={sensor}
                onClick={() => console.log(`Clicked ${sensor.name}`)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      <CriticalAlert
        sensor={activeAlertSensor}
        onAcknowledge={handleAcknowledge}
      />
    </ThemeProvider>
  );
};
