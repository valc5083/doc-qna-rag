import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { CheckCircle, Error, Warning, Info } from "@mui/icons-material";

export type DialogType = "success" | "error" | "warning" | "info" | "confirm";

interface ConfirmationDialogProps {
  open: boolean;
  type: DialogType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  closeText?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}

const ConfirmationDialog = ({
  open,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  closeText = "Close",
  maxWidth = "sm",
}: ConfirmationDialogProps) => {
  const iconMap = {
    success: { icon: CheckCircle, color: "#4CAF50" },
    error: { icon: Error, color: "#F44336" },
    warning: { icon: Warning, color: "#FF9800" },
    info: { icon: Info, color: "#2196F3" },
    confirm: { icon: Warning, color: "#FF9800" },
  };

  const colorMap = {
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
    confirm: "warning",
  } as const;

  const { icon: IconComponent, color } = iconMap[type];

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      {type === "error" || type === "info" ? (
        <>
          <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
          <DialogContent>
            <Alert severity={colorMap[type]} sx={{ borderRadius: 1 }}>
              {message}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} variant="contained" color="primary">
              {closeText}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconComponent sx={{ color }} />
            {title}
          </DialogTitle>
          <DialogContent sx={{ py: 2 }}>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{message}</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} variant="outlined" color="inherit">
              {closeText}
            </Button>
            {type === "confirm" && onConfirm && (
              <Button onClick={onConfirm} variant="contained" color="warning">
                {confirmText}
              </Button>
            )}
            {(type === "success" || type === "warning") && !onConfirm && (
              <Button onClick={onClose} variant="contained" color="primary">
                {confirmText}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ConfirmationDialog;
