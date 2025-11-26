/**
 * Voice Recording Hook with STT Integration
 *
 * Provides voice recording with two STT backends:
 * 1. Web Speech API (browser-native, free, Chrome/Edge only)
 * 2. OpenAI Whisper API (fallback, requires API key)
 *
 * Features:
 * - Real-time transcription (Web Speech API)
 * - Multi-language support
 * - Recording state management
 * - Error handling and fallback
 * - Audio blob capture for Whisper API
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceRecordingOptions {
  /**
   * Preferred STT backend: "webspeech" or "whisper"
   * Defaults to "webspeech" if available, falls back to "whisper"
   */
  preferredBackend?: "webspeech" | "whisper";

  /**
   * Language code (e.g., "en-US", "zh-CN", "ms-MY")
   */
  language?: string;

  /**
   * Enable continuous recognition (keeps listening)
   */
  continuous?: boolean;

  /**
   * Enable interim results (partial transcripts while speaking)
   */
  interimResults?: boolean;

  /**
   * Maximum alternatives to return
   */
  maxAlternatives?: number;

  /**
   * Callback when transcription is available
   */
  onTranscript?: (transcript: string, isFinal: boolean) => void;

  /**
   * Callback when recording state changes
   */
  onRecordingChange?: (isRecording: boolean) => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  backend: "webspeech" | "whisper" | null;
  isSupported: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Hook for voice recording with STT
 */
export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const {
    preferredBackend = "webspeech",
    language = "en-US",
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onTranscript,
    onRecordingChange,
    onError,
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    transcript: "",
    interimTranscript: "",
    error: null,
    backend: null,
    isSupported: false,
  });

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if Web Speech API is supported
  const isWebSpeechSupported = typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isSupported: isWebSpeechSupported || preferredBackend === "whisper",
      backend: isWebSpeechSupported ? "webspeech" : "whisper",
    }));
  }, [isWebSpeechSupported, preferredBackend]);

  /**
   * Initialize Web Speech API recognition
   */
  const initializeWebSpeech = useCallback(() => {
    if (!isWebSpeechSupported) {
      throw new Error("Web Speech API not supported in this browser");
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = language;

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
      onRecordingChange?.(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
      }));

      if (finalTranscript) {
        onTranscript?.(finalTranscript.trim(), true);
      }
      if (interimTranscript) {
        onTranscript?.(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setState((prev) => ({ ...prev, error: errorMessage, isRecording: false }));
      onError?.(new Error(errorMessage));
      onRecordingChange?.(false);
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isRecording: false }));
      onRecordingChange?.(false);
    };

    recognitionRef.current = recognition;
  }, [
    continuous,
    interimResults,
    maxAlternatives,
    language,
    isWebSpeechSupported,
    onTranscript,
    onRecordingChange,
    onError,
  ]);

  /**
   * Initialize MediaRecorder for Whisper API
   */
  const initializeMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        // Send to Whisper API
        try {
          const transcript = await transcribeWithWhisper(audioBlob, language);
          setState((prev) => ({
            ...prev,
            transcript: prev.transcript + transcript + " ",
            isRecording: false,
          }));
          onTranscript?.(transcript, true);
          onRecordingChange?.(false);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio";
          setState((prev) => ({ ...prev, error: errorMessage, isRecording: false }));
          onError?.(new Error(errorMessage));
          onRecordingChange?.(false);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to access microphone";
      setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(new Error(errorMessage));
      throw error;
    }
  }, [language, onTranscript, onRecordingChange, onError]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, interimTranscript: "" }));

      if (preferredBackend === "webspeech" && isWebSpeechSupported) {
        if (!recognitionRef.current) {
          initializeWebSpeech();
        }
        recognitionRef.current?.start();
      } else {
        // Use MediaRecorder for Whisper API
        await initializeMediaRecorder();
        mediaRecorderRef.current?.start();
        setState((prev) => ({ ...prev, isRecording: true }));
        onRecordingChange?.(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start recording";
      setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(new Error(errorMessage));
    }
  }, [
    preferredBackend,
    isWebSpeechSupported,
    initializeWebSpeech,
    initializeMediaRecorder,
    onRecordingChange,
    onError,
  ]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Reset transcript
   */
  const resetTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: "",
      interimTranscript: "",
      error: null,
    }));
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}

/**
 * Transcribe audio using OpenAI Whisper API via Supabase Edge Function
 * This is more secure than calling OpenAI directly from the browser
 */
async function transcribeWithWhisper(audioBlob: Blob, language: string): Promise<string> {
  // Get Supabase URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local");
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", language.split("-")[0]); // "en-US" -> "en"

  // Call Supabase Edge Function
  const functionUrl = `${supabaseUrl}/functions/v1/voice-transcribe`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.details || `Transcription failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}

/**
 * Alternative: Direct OpenAI API call (less secure, requires API key in browser)
 * Only use this if you uncomment and set VITE_OPENAI_API_KEY
 */
async function transcribeWithWhisperDirect(audioBlob: Blob, language: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env.local or use Edge Function proxy");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "whisper-1");
  formData.append("language", language.split("-")[0]);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error?.message || `Whisper API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}
