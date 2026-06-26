# SCA Portfolio AI

A web app for UK GP trainees to generate structured portfolio case reviews from free-text case notes — inspired by the [PortfolioAI portfolio tool](https://www.fourteenfisherman.com/portfolio).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (includes npm)
- A **free Groq API key** (recommended) from [console.groq.com/keys](https://console.groq.com/keys)

## Setup (Windows — from GitHub)

**Run one command per line.** Do not paste the whole block at once (PowerShell will show `>>` and break).

```powershell
cd c:\Users\chess\Documents
git clone https://github.com/Tiraan93/15fisherman.git
cd 15fisherman
.\setup.cmd
```

Edit `.env.local` and add your Groq key (`GROQ_API_KEY=gsk_...`). Then:

```powershell
.\start.cmd
```

Open [http://localhost:3003/portfolio](http://localhost:3003/portfolio).

If `npm` is not recognized, always use `.\setup.cmd` and `.\start.cmd` (they find Node.js automatically).

## Setup (Mac/Linux)

```bash
git clone https://github.com/Tiraan93/15fisherman.git
cd 15fisherman
npm install
cp .env.example .env.local
npm run dev
```

Edit `.env.local`:

```
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

## AI providers

| Provider | Cost | Setup |
|----------|------|--------|
| **OpenRouter** (default) | Pay-as-you-go | `OPENROUTER_API_KEY` from [openrouter.ai/keys](https://openrouter.ai/keys); uses the `deepseek/deepseek-v4-flash` model |
| **Groq** | Free tier | `LLM_PROVIDER=groq` and `GROQ_API_KEY` from [console.groq.com](https://console.groq.com/keys) |
| **Ollama** | Free, local | Install [Ollama](https://ollama.com), `ollama pull llama3.2`, set `LLM_PROVIDER=ollama` |
| **OpenAI** | Paid | `LLM_PROVIDER=openai` and `OPENAI_API_KEY` |

OpenRouter is OpenAI-compatible, so set `OPENROUTER_MODEL` to any [model slug](https://openrouter.ai/models) (e.g. `openrouter/free` or a specific `:free` model).

Set `LLM_MODEL` to override the default model for your provider.

Without any key, the app runs in **demo mode** with a sample review so you can test the UI.

## Rate limiting

The `/api/generate-review` and `/api/improve-section` endpoints are limited to **2 requests per IP per minute** to protect against abuse and runaway provider costs on a public deployment.

For production on Vercel, add a free [Upstash Redis](https://upstash.com) so the limit is enforced across all serverless instances:

```
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Without these, it falls back to an in-memory limiter (fine for local dev, but per-instance only).

## Disclaimer

AI-generated drafts must be reviewed before portfolio submission. Not medical advice.
