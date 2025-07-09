import { type JSX, memo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import type { SensorReading, SensorStatus } from "../../../shared/types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import HelpIcon from "@mui/icons-material/Help";

interface SensorStatusCardProps {
  sensor: SensorReading;
  onClick: () => void;
}

const statusConfig: Record<SensorStatus, { color: string; icon: JSX.Element }> =
  {
    SAFE: {
      color: "#4caf50",
      icon: <CheckCircleIcon data-testid="CheckCircleIcon" fontSize="large" />,
    },
    WARNING: {
      color: "#ff9800",
      icon: <WarningIcon data-testid="WarningIcon" fontSize="large" />,
    },
    UNSAFE: {
      color: "#f44336",
      icon: <ErrorIcon data-testid="ErrorIcon" fontSize="large" />,
    },
    UNKNOWN: {
      color: "#9e9e9e",
      icon: <HelpIcon data-testid="HelpIcon" fontSize="large" />,
    },
  };

export const SensorStatusCard = memo(
  ({ sensor, onClick }: SensorStatusCardProps) => {
    const config = statusConfig[sensor.status];

    return (
      <Card
        data-testid={`sensor-card-${sensor.id}`}
        onClick={onClick}
        sx={{
          minWidth: 220,
          cursor: "pointer",
          color: "white",
          backgroundColor: config.color,
          transition: "transform 0.2s",
          "&:hover": { transform: "scale(1.05)" },
        }}
      >
        <CardContent>
          <Typography variant="h6" component="div">
            {sensor.name}
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mt={1}
          >
            <Typography variant="h4">
              {sensor.value} {sensor.unit}
            </Typography>
            {config.icon}
          </Box>
          <Typography variant="caption" display="block" mt={1}>
            Status: {sensor.status}
          </Typography>
        </CardContent>
      </Card>
    );
  },
);
