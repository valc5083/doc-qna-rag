import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
} from "@mui/material";
import { CheckCircle, Error, Warning, Info } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const CompactDialogTitle = styled(DialogTitle)({
  paddingBottom: 8,
});

const RoundedAlert = styled(Alert)({
  borderRadius: 8,
});

const IconDialogTitle = styled(DialogTitle)({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

const IconWrap = styled("span", {
  shouldForwardProp: (prop) => prop !== "iconColor",
})<{ iconColor: string }>(({ iconColor }) => ({
  display: "inline-flex",
  "& .MuiSvgIcon-root": {
    color: iconColor,
  },
}));

const PaddedDialogContent = styled(DialogContent)({
  paddingTop: 16,
  paddingBottom: 16,
});

const PreWrapMessage = styled(Typography)({
  whiteSpace: "pre-wrap",
  margin: 0,
});

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
          <CompactDialogTitle>{title}</CompactDialogTitle>
          <DialogContent>
            <RoundedAlert severity={colorMap[type]}>{message}</RoundedAlert>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} variant="contained" color="primary">
              {closeText}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <IconDialogTitle>
            <IconWrap iconColor={color}>
              <IconComponent />
            </IconWrap>
            {title}
          </IconDialogTitle>
          <PaddedDialogContent>
            <PreWrapMessage component="p">{message}</PreWrapMessage>
          </PaddedDialogContent>
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
