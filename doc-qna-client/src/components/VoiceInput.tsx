import { useState, useCallback } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Mic, GraphicEq } from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import toast from "react-hot-toast";

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const MicButton = styled(IconButton)<{ recording?: boolean }>(
  ({ recording }) => ({
    height: 48,
    width: 48,
    borderRadius: 12,
    animation: recording ? `${pulse} 1s ease-in-out infinite` : "none",
    background: recording ? "rgba(244,67,54,0.12)" : "transparent",
    color: recording ? "#F44336" : "#2E75B6",
    "&:hover": {
      background: recording ? "rgba(244,67,54,0.2)" : "rgba(46,117,182,0.1)",
    },
    "&:disabled": {
      opacity: 0.4,
    },
  }),
);

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput = ({ onTranscript, disabled }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input not supported. Use Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsRecording(true);
      toast("🎤 Listening...", { duration: 2000 });
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      toast.success(`Got: "${transcript}"`);
    };

    rec.onerror = (event: any) => {
      if (event.error === "no-speech") toast.error("No speech detected.");
      else if (event.error === "not-allowed")
        toast.error("Microphone access denied.");
      else toast.error("Voice input failed.");
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
      setRecognition(null);
    };

    rec.start();
    setRecognition(rec);
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognition?.stop();
    setIsRecording(false);
  }, [recognition]);

  return (
    <Tooltip title={isRecording ? "Stop recording" : "Speak your question"}>
      <MicButton
        recording={isRecording}
        onClick={isRecording ? stop : start}
        disabled={disabled}
      >
        {isRecording ? <GraphicEq /> : <Mic />}
      </MicButton>
    </Tooltip>
  );
};

export default VoiceInput;
