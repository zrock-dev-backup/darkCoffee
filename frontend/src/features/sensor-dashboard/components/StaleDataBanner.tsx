import { Box, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export const StaleDataBanner = () => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "orange",
      color: "white",
      p: 1,
      zIndex: 1500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <WarningAmberIcon sx={{ mr: 1 }} />
    <Typography variant="h6">
      ⚠️ STALE DATA: Connection to sensor feed lost. Displayed values are not
      live.
    </Typography>
  </Box>
);
