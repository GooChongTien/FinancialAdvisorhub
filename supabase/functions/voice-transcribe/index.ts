/**
 * Voice Transcription Edge Function
 * Proxies audio files to OpenAI Whisper API for speech-to-text
 *
 * This function provides a secure backend proxy for voice transcription,
 * avoiding the need to expose OpenAI API keys in the frontend.
 *
 * Endpoint: POST /voice-transcribe
 * Body: FormData with 'audio' file and optional 'language' field
 * Returns: { text: string, language?: string }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit)

interface WhisperResponse {
  text: string;
  language?: string;
  duration?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key is configured
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured in Supabase Edge Function secrets");
      return new Response(
        JSON.stringify({
          error: "Voice transcription service not configured",
          details: "OpenAI API key is missing",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en";

    // Validate audio file
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: "File too large",
          details: `Maximum file size is 25MB. Received: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare form data for OpenAI
    const whisperFormData = new FormData();
    whisperFormData.append("file", audioFile, "recording.webm");
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", language);
    whisperFormData.append("response_format", "json");

    // Call OpenAI Whisper API
    console.log(`Transcribing audio file: ${audioFile.name} (${(audioFile.size / 1024).toFixed(2)}KB)`);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Whisper API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Transcription failed",
          details: errorData.error?.message || `API error: ${response.status}`,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result: WhisperResponse = await response.json();

    console.log(`Transcription successful: ${result.text.length} characters`);

    return new Response(
      JSON.stringify({
        text: result.text,
        language: result.language,
        duration: result.duration,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Voice transcription error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
