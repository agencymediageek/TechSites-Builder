# TechSites Builder — Cloudflare Workers Documentation

## Account Structure

| Account | Worker Count | Key Workers |
|---------|-------------|-------------|
| `reynaldodallin` CF account | 22 Workers | All production Workers |
| Cloudflare Pages | 6 Pages | Template demonstrations |

---

## Complete Worker Inventory

### Production Platform

| Worker | Status | Route | Purpose |
|--------|--------|-------|---------|
| `techsites-hub-production` | 🟢 Active | `hub.techsites.ai/*`, `techsites.ai/*` | Main SaaS hub: auth, dashboard, site serving |
| `ts-builder-proxy` | 🟢 Active | `builder.techsites.ai/*` | Grok 3 mini AI site structure generator |
| `techsites-proxy` | 🟢 Active | various | General request proxy layer |
| `techsites-dxb-wildcard-router` | 🟢 Active | `*.techsites.ai/*` | Routes subdomain requests to correct site |

### WYSIWYG Workers (Consolidation Target)

All 8 legacy Workers below are to be migrated to `wysiwyg-universal`.

| Worker | Client Site | KV Namespace |
|--------|-------------|-------------|
| `mokha-wysiwyg-standalone-api` | cafe-model.pages.dev | WYSIWYG_KV_MOKHA |
| `agency-wysiwyg-standalone-review-api` | agency-review.pages.dev | WYSIWYG_KV_AGENCY |
| `dentist-wysiwyg-standalone-review-api` | dentist-review.pages.dev | WYSIWYG_KV_DENTIST |
| `real-estate-model-wysiwyg-api` | real-estate-model.pages.dev | WYSIWYG_KV_REALESTATE |
| `trial-model-dubai-wysiwyg-api` | trial-model-dubai.pages.dev | WYSIWYG_KV_DUBAI |
| `techsites-wysiwyg-sandbox-api` | sandbox | WYSIWYG_KV_SANDBOX |
| `techsites-editor-api` | base | WYSIWYG_KV_BASE |
| `techsites-editor-api-production` | production base | WYSIWYG_KV_PROD |
| **`wysiwyg-universal`** | **All clients** | **TS_WYSIWYG_KV** |

### KV Namespaces

| Namespace | ID | Used By |
|-----------|-----|---------|
| `TS_HUB_KV` | `<id>` | Hub: user sessions, plan configs |
| `TS_SITES_KV` | `<id>` | Hub: per-client site state |
| `TS_WYSIWYG_KV` | `<id>` | Universal WYSIWYG Worker |

---

## Cloudflare Pages Inventory

| Project | URL | Template Type | WYSIWYG |
|---------|-----|---------------|---------|
| `techsites-ai` | techsites-ai.pages.dev | WP TechSites landing page | ❌ |
| `ts-site-builder` | ts-site-builder.pages.dev | Site builder SaaS | ❌ |
| `directory-template-master` | directory-template-master.pages.dev | Directory listing (Dubai Coffee) | ❌ |
| `template-master-onepage` | template-master-onepage.pages.dev | One-page café | ❌ |
| `cafe-model` | cafe-model.pages.dev | Café (Mokha 1450) | ✅ |
| `restaurant-cafe` | restaurant-cafe.pages.dev | Italian Restaurant | ❌ |

---

## techsites-hub-production — Internals

### Authentication Flow
```javascript
// JWT stored in HttpOnly cookie (not localStorage)
// 7-day expiry, HS256 signing

async function verifyAuth(request, env) {
  const cookie = request.headers.get('Cookie');
  const token = parseCookie(cookie, 'ts_session');
  if (!token) return null;
  
  // KV session lookup (faster than JWT verify for rate limiting)
  const session = await env.TS_HUB_KV.get(`session:${token}`, 'json');
  if (!session || session.expiresAt < Date.now()) return null;
  
  return session.userId;
}
```

### Stripe Integration
```javascript
// Webhooks validated via stripe-signature header
// Plans stored in TS_HUB_KV as "plan:{id}"
// Events: checkout.session.completed, subscription.updated, subscription.deleted
```

### Site Serving (Matrix Assembly)
See [`docs/matrix-system.md`](matrix-system.md) for the full assembly algorithm.

---

## Deployment Commands

```bash
# Deploy a specific Worker
cd workers/ts-builder-proxy
wrangler deploy

# Deploy with production vars
wrangler deploy --env production

# Tail logs in real-time
wrangler tail ts-builder-proxy

# Tail hub logs
wrangler tail techsites-hub-production

# KV operations
wrangler kv key list --namespace-id=<TS_SITES_KV_ID>
wrangler kv key get "site:client.techsites.ai" --namespace-id=<TS_SITES_KV_ID>
wrangler kv key put "site:client.techsites.ai" '{"seed":[2,5,1,4,0,3],"niche":"food-beverage"}' --namespace-id=<TS_SITES_KV_ID>

# Delete a site
wrangler kv key delete "site:client.techsites.ai" --namespace-id=<TS_SITES_KV_ID>
```

---

## Security Checklist

- [ ] All API keys stored as `secret_text` bindings (not `plain_text`)
- [ ] WYSIWYG Workers validate `Origin` header against per-site allowlist
- [ ] Hub Worker validates JWT on all `/api/*` routes
- [ ] Rate limiting on `/api/generate` (Cloudflare Rate Limiting rules)
- [ ] Content-Security-Policy injected on all client site responses
- [ ] No eval(), no innerHTML with user content
- [ ] Stripe webhooks validated via signature header
- [ ] CORS origins restricted per environment

---

## Monitoring

```bash
# Worker analytics in CF Dashboard
# Workers → Analytics → Select worker → Last 24h

# Tail specific request patterns
wrangler tail techsites-hub-production --format json | \
  jq 'select(.outcome != "ok")'

# KV usage
# CF Dashboard → Workers KV → Namespace → Usage tab
```

## Cost Estimates (Cloudflare)

| Resource | Usage | Monthly Cost |
|----------|-------|-------------|
| Worker requests | 10M req/month | $5 (included in Workers Paid) |
| KV reads | 100M/month | $10 |
| KV writes | 10M/month | $10 |
| R2 storage (templates) | 1GB | $0.015 |
| Total | — | ~$25/month (supports 10,000+ client sites) |
