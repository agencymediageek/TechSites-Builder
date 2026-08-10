# TechSites Builder — Deployment Guide

## Infrastructure Overview

| Component | Platform | Notes |
|-----------|----------|-------|
| Hub Worker | Cloudflare Workers | `techsites-hub-production` |
| Builder AI Worker | Cloudflare Workers | `ts-builder-proxy` |
| WYSIWYG Worker | Cloudflare Workers | `wysiwyg-universal` |
| Templates | Cloudflare Pages | `directory-template-master`, `cafe-model`, etc. |
| KV State | Cloudflare KV | TS_HUB_KV, TS_SITES_KV, TS_WYSIWYG_KV |
| DNS | Cloudflare | `techsites.ai` zone |

---

## Deploy a Worker

### Prerequisites
```bash
npm install -g wrangler
wrangler login  # Opens browser OAuth
```

### Deploy ts-builder-proxy
```bash
cd workers/ts-builder-proxy

# Set secret (first time only)
wrangler secret put GROK_KEY
# Enter xAI API key when prompted

# Deploy
wrangler deploy

# Verify
curl -X POST https://builder.techsites.ai/ \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test brief"}]}'
```

### Deploy wysiwyg-universal
```bash
cd workers/wysiwyg-universal

# Set secrets (first time only)
wrangler secret put SITE_KEY_SECRET

# Create KV namespace (first time only)
wrangler kv namespace create TS_WYSIWYG_KV
# Copy the namespace ID to wrangler.toml

# Deploy
wrangler deploy

# Test
curl https://wysiwyg.techsites.ai/state?page=index.html \
  -H "X-Site-Key: test-site-key"
```

---

## Provision a New Client Site

```bash
# scripts/new-client.sh
#!/bin/bash
set -e

DOMAIN=$1    # e.g. "mycafe.techsites.ai"
NICHE=$2     # e.g. "food-beverage"
LICENSE=$3   # e.g. "TS-A3F9-B2K1-9XZ4"
PLAN=${4:-"starter"}

# Validate args
if [ -z "$DOMAIN" ] || [ -z "$NICHE" ] || [ -z "$LICENSE" ]; then
  echo "Usage: ./new-client.sh <domain> <niche> <license> [plan]"
  exit 1
fi

# Calculate matrix seed from license key (Node.js inline)
SEED=$(node -e "
  const key = '$LICENSE';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  hash = Math.abs(hash);
  const indices = [];
  let rem = hash;
  for (let i = 0; i < 6; i++) {
    indices.push(rem % 6);
    rem = Math.floor(rem / 6);
  }
  console.log(JSON.stringify(indices));
")

echo "📐 Matrix seed for $DOMAIN: $SEED"

# Create site config in KV
SITE_CONFIG=$(cat <<EOF
{
  "domain": "$DOMAIN",
  "seed": $SEED,
  "niche": "$NICHE",
  "plan": "$PLAN",
  "license": "$LICENSE",
  "content": {},
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

wrangler kv key put "site:$DOMAIN" "$SITE_CONFIG" \
  --namespace-id="${TS_SITES_KV_ID}"

echo "✅ Site config written to KV"

# Add DNS CNAME (requires CF API token)
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"$DOMAIN\",
    \"content\": \"techsites-hub-production.workers.dev\",
    \"proxied\": true
  }"

echo "✅ DNS CNAME added for $DOMAIN"
echo "🌐 Site will be live at https://$DOMAIN in ~60 seconds"
```

---

## Update Block Library

When adding or updating HTML blocks:

```bash
# Upload a block to KV
wrangler kv key put "block:menus/menu-3" \
  --path="templates/components/menus/menu-3.html" \
  --namespace-id="${TS_SITES_KV_ID}"

# Upload all blocks at once
for file in templates/components/**/*.html; do
  name=$(echo $file | sed 's|templates/components/||' | sed 's|\.html||')
  echo "Uploading block:$name"
  wrangler kv key put "block:$name" \
    --path="$file" \
    --namespace-id="${TS_SITES_KV_ID}"
done

echo "✅ All blocks uploaded"
```

---

## Update Design Tokens

```bash
# Upload all niche token files
for file in templates/tokens/niches/*.css; do
  niche=$(basename "$file" .css)
  echo "Uploading tokens:$niche"
  wrangler kv key put "tokens:$niche" \
    --path="$file" \
    --namespace-id="${TS_SITES_KV_ID}"
done

echo "✅ All design tokens uploaded"
```

---

## Cloudflare Pages Deployment

Pages are deployed via Git integration (automatic on push) or manually:

```bash
# Manual deploy of a template
cd templates/cafe-model
wrangler pages deploy . --project-name=cafe-model

# Or via CF Dashboard:
# Cloudflare → Pages → cafe-model → Create new deployment → Upload
```

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `GROK_KEY` | ts-builder-proxy (secret_text) | xAI API key |
| `STRIPE_SECRET_KEY` | Hub Worker (secret_text) | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Hub Worker (secret_text) | Webhook validation |
| `JWT_SECRET` | Hub Worker (secret_text) | Session signing |
| `CF_API_TOKEN` | CI/CD only | CF API for DNS |
| `CF_ZONE_ID` | CI/CD only | techsites.ai zone ID |
| `TS_SITES_KV_ID` | CI/CD only | KV namespace ID |
| `TS_WYSIWYG_KV_ID` | CI/CD only | WYSIWYG KV namespace ID |

**Critical:** Never store API keys as `plain_text` Worker variables. Always use `secret_text` bindings (CF Dashboard → Worker → Settings → Variables → Add variable → Type: Secret).

---

## Monitoring & Observability

```bash
# Real-time Worker logs
wrangler tail techsites-hub-production

# Filter errors only
wrangler tail techsites-hub-production --format json | \
  jq 'select(.outcome != "ok" or .logs[].level == "error")'

# KV usage stats
# CF Dashboard → Workers KV → TS_SITES_KV → Usage

# Worker analytics
# CF Dashboard → Workers → techsites-hub-production → Analytics
```

### Health Checks
```bash
# Hub
curl https://hub.techsites.ai/api/healthz

# Builder AI
curl -X POST https://builder.techsites.ai/ \
  -d '{"messages":[{"role":"user","content":"ping"}]}'

# WYSIWYG
curl https://wysiwyg.techsites.ai/state?page=index.html \
  -H "X-Site-Key: health-check"
```

---

## Rollback

```bash
# Worker rollback (CF Dashboard or Wrangler)
wrangler rollback techsites-hub-production

# KV data rollback (manual — no built-in history)
# Restore from R2 backup:
wrangler kv key put "site:client.techsites.ai" \
  "$(cat backups/site-client-20260810.json)" \
  --namespace-id="${TS_SITES_KV_ID}"
```

---

## Cost Tracking

Monthly cost estimate for 10,000 active client sites:

| Resource | Usage | Monthly Cost |
|----------|-------|-------------|
| CF Workers | 500M requests | $5 (Workers Paid plan) |
| CF Workers KV reads | 2B reads | $150 |
| CF Workers KV writes | 100M writes | $100 |
| CF R2 (template storage) | 5GB | $0.075 |
| CF Pages | Unlimited | $20/month (Pro) |
| **Total** | — | **~$275/month** |

Revenue at 10,000 clients × $49/month = **$490,000/month** — 1,782× cost multiplier.
