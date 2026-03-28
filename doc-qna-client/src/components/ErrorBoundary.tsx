import { Component, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: 2,
            p: 4,
          }}
        >
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Typography color="text.secondary" fontSize="0.9rem">
            {this.state.error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
