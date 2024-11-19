import { useState, useRef } from "react";
import styles from "./VoiceRecorder.module.css";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onUploadSuccess?: () => void;
}

export function VoiceRecorder({
  onRecordingComplete,
  onUploadSuccess,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error" | "";
  }>({
    message: "",
    type: "",
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        audioRef.current = audioBlob;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus({ message: "", type: "" });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStatus({
        message:
          "Error accessing microphone. Please ensure you have granted permission.",
        type: "error",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleSaveRecording = async () => {
    if (!audioRef.current) {
      setStatus({ message: "No recording to save", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", audioRef.current, "recording.wav");

      const response = await fetch(
        "http://localhost:3000/api/upload-recording",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save recording");
      }

      setStatus({ message: "Recording saved successfully!", type: "success" });
      onRecordingComplete(audioRef.current);
      onUploadSuccess?.();
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : "Failed to save recording",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.recorder}>
      <div className={styles.controls}>
        {!isRecording ? (
          <button onClick={startRecording} className={styles.recordButton}>
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className={styles.stopButton}>
            Stop Recording
          </button>
        )}
        {audioUrl && !isRecording && (
          <button
            onClick={handleSaveRecording}
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? "Uploading..." : "Upload Recording"}
          </button>
        )}
      </div>
      {status.message && (
        <div className={`${styles.status} ${styles[status.type]}`}>
          {status.message}
        </div>
      )}
      {audioUrl && (
        <div className={styles.preview}>
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}
