# 🦙 Local LLM Setup Guide

Run stresst without paying for API calls by using a local LLM. This guide covers setup with **Ollama** (recommended) and other OpenAI-compatible servers.

## Table of Contents

- [Why Use a Local LLM?](#why-use-a-local-llm)
- [Option 1: Ollama (Recommended)](#option-1-ollama-recommended)
- [Option 2: LM Studio](#option-2-lm-studio)
- [Option 3: Other OpenAI-Compatible Servers](#option-3-other-openai-compatible-servers)
- [Recommended Models](#recommended-models)
- [Troubleshooting](#troubleshooting)

---

## Why Use a Local LLM?

| Feature | Anthropic (Cloud) | Local LLM |
|---------|------------------|-----------|
| **Cost** | Pay per token | Free |
| **Privacy** | Data sent to API | All data stays local |
| **Speed** | ~2-5 seconds | Depends on hardware |
| **Quality** | Excellent | Good to Very Good |
| **Setup** | Just API key | Requires installation |

**Trade-offs:**
- Local LLMs may produce less consistent JSON output
- Bug quality depends heavily on model choice
- Requires decent hardware (8GB+ RAM, ideally a GPU)

> ⚠️ **Performance Warning:** Running local LLMs can be **very slow and resource-intensive**. Generation times can range from 30 seconds to several minutes depending on your hardware. For acceptable performance, we strongly recommend:
> - A **dedicated GPU** with at least 8GB VRAM
> - **16GB+ system RAM** (32GB+ for larger models)
> - Using a **powerful, well-optimized model** like `llama3` or `codellama`
> - If you have limited hardware, consider using the cloud-based Anthropic option instead for a better experience.

---

## Option 1: Ollama (Recommended)

[Ollama](https://ollama.ai) is the easiest way to run local LLMs. It handles model downloading, optimization, and serving automatically.

### Step 1: Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai/download](https://ollama.ai/download)

### Step 2: Pull a Model

```bash
# Recommended: Llama 3 (8B parameters, good balance)
ollama pull llama3

# For better quality (requires more RAM/VRAM):
ollama pull llama3:70b

# For code-specific tasks:
ollama pull codellama:34b

# Lightweight option (runs on most machines):
ollama pull mistral
```

### Step 3: Start Ollama Server

```bash
ollama serve
```

The server runs on `http://localhost:11434` by default.

### Step 4: Install stresst Dependency

```bash
cd /path/to/stresst
npm install @ai-sdk/openai
```

### Step 5: Configure Environment

Add to your `.env.local`:

```env
# Use Ollama as the AI provider
AI_PROVIDER=ollama

# Model to use (must be pulled first)
OLLAMA_MODEL=llama3

# Optional: Custom Ollama URL (defaults to http://localhost:11434/v1)
# OLLAMA_BASE_URL=http://localhost:11434/v1
```

### Step 6: Run stresst

```bash
npm run dev
```

That's it! stresst will now use your local Ollama instance.

---

## Option 2: LM Studio

[LM Studio](https://lmstudio.ai) provides a user-friendly GUI for running local LLMs with an OpenAI-compatible server.

### Step 1: Install LM Studio

Download from [lmstudio.ai](https://lmstudio.ai)

### Step 2: Download a Model

1. Open LM Studio
2. Go to the "Discover" tab
3. Search for and download a model (recommended: `TheBloke/Llama-2-13B-chat-GGUF` or similar)

### Step 3: Start the Server

1. Go to the "Local Server" tab
2. Select your downloaded model
3. Click "Start Server"
4. Note the server URL (usually `http://localhost:1234/v1`)

### Step 4: Install stresst Dependency

```bash
npm install @ai-sdk/openai
```

### Step 5: Configure Environment

Add to your `.env.local`:

```env
# Use OpenAI-compatible provider
AI_PROVIDER=openai-compatible

# LM Studio server URL
OPENAI_COMPATIBLE_BASE_URL=http://localhost:1234/v1

# Model name (check LM Studio for exact name)
OPENAI_COMPATIBLE_MODEL=local-model
```

---

## Option 3: Other OpenAI-Compatible Servers

stresst works with any server that exposes an OpenAI-compatible API:

- **LocalAI** - [github.com/localai/localai](https://github.com/localai/localai)
- **vLLM** - [github.com/vllm-project/vllm](https://github.com/vllm-project/vllm)
- **text-generation-webui** - [github.com/oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)
- **llama.cpp server** - [github.com/ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp)

### Configuration

```env
AI_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=http://your-server:port/v1
OPENAI_COMPATIBLE_MODEL=your-model-name

# If your server requires an API key:
OPENAI_COMPATIBLE_API_KEY=your-api-key
```

---

## Recommended Models

### Best Quality (Requires Good Hardware)

| Model | Parameters | RAM Needed | Notes |
|-------|-----------|------------|-------|
| `llama3:70b` | 70B | 48GB+ | Best quality, needs powerful GPU |
| `codellama:34b` | 34B | 24GB+ | Optimized for code |
| `mixtral:8x7b` | 46.7B | 32GB+ | Excellent reasoning |

### Good Balance

| Model | Parameters | RAM Needed | Notes |
|-------|-----------|------------|-------|
| `llama3` | 8B | 8GB | Recommended default |
| `codellama:13b` | 13B | 12GB | Good for code tasks |
| `mistral` | 7B | 8GB | Fast, good quality |

### Lightweight (Runs Anywhere)

| Model | Parameters | RAM Needed | Notes |
|-------|-----------|------------|-------|
| `llama3:8b-instruct-q4_0` | 8B (quantized) | 4GB | Compressed, still decent |
| `phi3:mini` | 3.8B | 4GB | Microsoft's small but capable model |

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `anthropic` | Provider: `anthropic`, `ollama`, or `openai-compatible` |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434/v1` | Ollama server URL |
| `OLLAMA_MODEL` | Yes* | - | Model name for Ollama (*required if using Ollama) |
| `OPENAI_COMPATIBLE_BASE_URL` | Yes* | - | Server URL (*required if using openai-compatible) |
| `OPENAI_COMPATIBLE_MODEL` | No | `default` | Model name for OpenAI-compatible servers |
| `OPENAI_COMPATIBLE_API_KEY` | No | `not-needed` | API key if required by server |

---

## Troubleshooting

### "Connection refused" error

**Problem:** stresst can't connect to your local LLM server.

**Solutions:**
1. Make sure the server is running (`ollama serve` for Ollama)
2. Check the URL in your environment variables
3. Verify no firewall is blocking the port

```bash
# Test Ollama is running:
curl http://localhost:11434/v1/models
```

### "Model not found" error

**Problem:** The specified model isn't available.

**Solutions:**
1. Pull the model first: `ollama pull <model-name>`
2. Check available models: `ollama list`
3. Verify the model name matches exactly

### JSON parsing errors

**Problem:** Local LLM returns invalid JSON, causing parse errors.

**Solutions:**
1. Use a larger/better model (smaller models struggle with JSON)
2. Try `llama3` or `codellama` which are better at structured output
3. Consider using Anthropic for critical tests

### Slow generation

**Problem:** Bug generation takes a long time.

**Solutions:**
1. Use a smaller/quantized model
2. Ensure you have enough RAM (avoid swapping)
3. If using GPU, verify it's being utilized
4. Check Ollama logs: `ollama logs`

### Out of memory

**Problem:** Model crashes or system becomes unresponsive.

**Solutions:**
1. Use a smaller model or quantized version
2. Close other applications
3. Try CPU-only mode (slower but uses system RAM)

---

## Performance Tips

1. **Use GPU acceleration** if available - significantly faster
2. **Keep the Ollama server running** - first request after cold start is slower
3. **Use quantized models** (q4, q5) for better speed with minimal quality loss
4. **Allocate enough context** - stresst sends large prompts with full file contents

---

## Still Having Issues?

1. Check the [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/README.md)
2. Open an issue on the [stresst GitHub repository](https://github.com/brenoneill/stresst/issues)
3. Verify your setup works with a simple test:

```bash
# Test Ollama directly:
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Say hello in JSON format: {\"greeting\": \"...\"}",
  "stream": false
}'
```

If Ollama responds correctly but stresst doesn't work, the issue is likely in the environment configuration.

