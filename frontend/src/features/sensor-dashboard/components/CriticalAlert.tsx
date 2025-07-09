import { Modal, Box, Typography, Button, useTheme } from "@mui/material";
import { useEffect, useRef } from "react";
import type { SensorReading } from "../../../shared/types";

interface CriticalAlertProps {
  sensor: SensorReading | null;
  onAcknowledge: () => void;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #f44336",
  boxShadow: 24,
  p: 4,
  textAlign: "center",
};

export const CriticalAlert = ({
  sensor,
  onAcknowledge,
}: CriticalAlertProps) => {
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/alert.mp3");
      audioRef.current.loop = true;
    }
    if (sensor) {
      audioRef.current
        .play()
        .catch((e) => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [sensor]);

  if (!sensor) return null;

  return (
    <Modal open={!!sensor} aria-labelledby="critical-alert-title">
      <Box sx={style}>
        <Typography
          id="critical-alert-title"
          variant="h4"
          component="h2"
          color={theme.palette.error.main}
        >
          {sensor.type.toUpperCase()} ALERT
        </Typography>
        <Typography sx={{ mt: 2 }}>
          <strong>Where:</strong> {sensor.name}
        </Typography>
        <Typography sx={{ mt: 1 }}>
          <strong>Status:</strong> Current Reading: {sensor.value} {sensor.unit}{" "}
          (Unsafe)
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onAcknowledge}
          sx={{ mt: 4 }}
        >
          Acknowledge & Silence Alarm
        </Button>
      </Box>
    </Modal>
  );
};
