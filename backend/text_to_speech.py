"""Text-to-Speech module using edge-tts (Microsoft Neural Voices)

Converts AI-generated interview questions to natural-sounding speech audio.
Runs locally, no GPU required.
"""
import asyncio
import io
import re
import edge_tts

# Professional male interviewer voice
VOICE = "en-US-GuyNeural"


def _strip_markdown(text: str) -> str:
    """Remove markdown formatting for cleaner TTS output."""
    # Remove bold/italic markers
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    # Remove markdown headers
    text = re.sub(r'#{1,6}\s*', '', text)
    # Remove bracket notation like [Technical]
    text = re.sub(r'\[([^\]]+)\]', r'\1', text)
    # Remove emojis (common unicode ranges)
    text = re.sub(
        r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF'
        r'\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF'
        r'\U00002702-\U000027B0\U0001F900-\U0001F9FF'
        r'\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF'
        r'\U00002600-\U000026FF]+',
        '', text
    )
    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


async def _synthesize_async(text: str) -> bytes:
    """Async synthesis using edge-tts."""
    communicate = edge_tts.Communicate(text, VOICE)
    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
    return b"".join(audio_chunks)


def synthesize_speech(text: str) -> bytes:
    """Convert text to speech audio (MP3 bytes).

    Args:
        text: The text to convert (may contain markdown).

    Returns:
        MP3 audio bytes ready to be sent to the client.
    """
    clean_text = _strip_markdown(text)
    if not clean_text:
        return b""

    # Run the async synthesis in a new event loop
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If there's already an event loop (e.g. inside Flask),
            # create a new one in a thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                result = pool.submit(
                    asyncio.run, _synthesize_async(clean_text)
                ).result(timeout=30)
            return result
        else:
            return loop.run_until_complete(_synthesize_async(clean_text))
    except RuntimeError:
        return asyncio.run(_synthesize_async(clean_text))
