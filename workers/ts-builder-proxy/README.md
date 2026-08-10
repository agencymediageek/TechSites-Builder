# ts-builder-proxy — AI Site Structure Generator

A Cloudflare Worker that uses Grok 3 mini (xAI) to generate complete website structures from a business brief.

## Usage

```bash
curl -X POST https://builder.techsites.ai/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I run a dental clinic in São Paulo. We specialize in orthodontics and aesthetic dentistry. Our main audience is adults 25-45. Brand: clean, professional, trustworthy."
      }
    ]
  }'
```

**Response:**
```json
{
  "content": "# Dental Clinic Site Structure\n\n## Hero Section\n**Headline:** Your Perfect Smile, Our Expertise\n...",
  "tokensUsed": 1024
}
```

## Deploy

```bash
# First time
wrangler login
wrangler secret put GROK_KEY

# Deploy
wrangler deploy

# Local dev
wrangler dev
```

## Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `GROK_KEY` | `secret_text` | xAI API key — **must be secret_text, not plain_text** |

## System Prompt

The worker uses a fixed system prompt that instructs APEX to generate:
- Hero section (headline + subheadline)
- About, Services, Portfolio, Testimonials, CTA, Contact sections
- Color palette + typography recommendations
- SEO meta title + description
- Conversion-focused copy
- Next steps section

The prompt is embedded in `index.js` and versioned with the Worker.
