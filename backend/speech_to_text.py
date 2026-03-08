"""Speech-to-Text module using Groq Whisper API

Sends candidate audio to the Groq Whisper API for transcription.
No local model, no GPU required.
Uses temp file + urllib multipart for reliable uploads.
"""
import os
import json
import tempfile
import io

# Use the requests-like approach via urllib3 or fallback to subprocess
# We'll use a temp-file + subprocess curl approach for maximum reliability,
# OR use the built-in http.client for clean multipart handling.

import http.client
import ssl
from urllib.parse import urlparse


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio bytes using Groq Whisper API.

    Args:
        audio_bytes: Raw audio data (WebM, WAV, MP3, etc.)
        filename: Original filename (used for content-type detection).

    Returns:
        Transcribed text string.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")

    if not audio_bytes or len(audio_bytes) < 100:
        raise ValueError("Audio data is too small or empty")

    # Determine content type from filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    content_types = {
        "webm": "audio/webm",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
        "flac": "audio/flac",
    }
    content_type = content_types.get(ext, "audio/webm")

    # Build multipart form data using proper CRLF formatting
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

    parts = []

    # File part
    parts.append(f"--{boundary}".encode())
    parts.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
    parts.append(f"Content-Type: {content_type}".encode())
    parts.append(b"")
    parts.append(audio_bytes)

    # Model part
    parts.append(f"--{boundary}".encode())
    parts.append(b'Content-Disposition: form-data; name="model"')
    parts.append(b"")
    parts.append(b"whisper-large-v3-turbo")

    # Language part
    parts.append(f"--{boundary}".encode())
    parts.append(b'Content-Disposition: form-data; name="language"')
    parts.append(b"")
    parts.append(b"en")

    # Response format part
    parts.append(f"--{boundary}".encode())
    parts.append(b'Content-Disposition: form-data; name="response_format"')
    parts.append(b"")
    parts.append(b"json")

    # Closing boundary
    parts.append(f"--{boundary}--".encode())
    parts.append(b"")

    body = b"\r\n".join(parts)

    # Use http.client for reliable HTTPS connection
    url = "api.groq.com"
    path = "/openai/v1/audio/transcriptions"

    context = ssl.create_default_context()
    conn = http.client.HTTPSConnection(url, context=context, timeout=60)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }

    try:
        conn.request("POST", path, body=body, headers=headers)
        response = conn.getresponse()
        response_data = response.read().decode("utf-8")

        if response.status != 200:
            print(f"⚠️ Groq Whisper API error ({response.status}): {response_data}")
            raise ValueError(f"Speech-to-text failed with status {response.status}: {response_data}")

        result = json.loads(response_data)
        transcript = result.get("text", "").strip()

        if not transcript:
            print("⚠️ Groq Whisper returned empty transcript")
            raise ValueError("Could not understand the audio. Please speak clearly and try again.")

        print(f"✓ Transcribed: {transcript[:80]}...")
        return transcript

    except json.JSONDecodeError as e:
        print(f"⚠️ Failed to parse Whisper response: {e}")
        raise ValueError("Speech-to-text failed: invalid response from API")
    except Exception as e:
        if "Speech-to-text failed" in str(e):
            raise
        print(f"⚠️ Transcription error: {str(e)}")
        raise ValueError(f"Speech-to-text failed: {str(e)}")
    finally:
        conn.close()
