# Text to speech comparison

Static comparison page for text-to-speech providers across the 24 official EU languages.

The published site includes:

- sanitized provider/language metadata in `data/tts-comparison.json`
- MP3 samples under `audio/`
- aggregate cost estimates for API-backed providers

The repository intentionally excludes API keys, `.env` files, OpenRouter generation IDs, raw activity exports, request headers, local audit reports, PCM/WAV intermediates, and local model caches.

## Local preview

```bash
node scripts/serve.mjs
```

Then open `http://127.0.0.1:8765/`.
