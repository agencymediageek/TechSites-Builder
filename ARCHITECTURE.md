# TechSites Builder — Architecture

## Design Philosophy

**Edge-first, framework-zero, token-driven.**

Every architectural decision optimizes for:
1. **TTFB < 10ms** — Cloudflare Workers run at 300+ edge locations. No cold starts, no origin round trips.
2. **Zero attack surface** — no PHP, no npm packages, no plugin ecosystem = no known CVEs
3. **Infinite scale per client** — KV reads are O(1) regardless of client count
4. **Human-editable output** — every generated HTML file is readable and editable by a junior developer

---

## System Topology

```
┌────────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE NETWORK                              │
│                                                                      │
│  techsites.ai ────────────────────────────────► techsites-hub-prod  │
│  hub.techsites.ai ─────────────────────────────► techsites-hub-prod │
│  *.techsites.ai (client sites) ────────────────► techsites-hub-prod │
│  ts-builder-proxy.workers.dev ─────────────────► ts-builder-proxy   │
│  wysiwyg.techsites.ai ─────────────────────────► wysiwyg-universal  │
│                                                                      │
│  KV Namespaces:                                                      │
│    TS_HUB_KV  — hub auth, sessions, plans                           │
│    TS_SITES_KV — per-client site state                              │
│    TS_WYSIWYG_KV — per-client per-page editable content             │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
         │                          │                    │
         ▼                          ▼                    ▼
   xAI Grok 3 mini           N8N Automation        VPS API Server
   (site structure AI)       (orchestration)       (wp-techsites backend)
```

---

## Worker Inventory (22 total)

### Core Platform Workers

| Worker | Route | Purpose |
|--------|-------|---------|
| `techsites-hub-production` | `hub.techsites.ai/*`, `techsites.ai/*` | SaaS hub dashboard, JWT auth, Stripe, KV-backed multi-tenant |
| `ts-builder-proxy` | internal | Grok 3 mini: briefing → site structure (Markdown) |
| `wysiwyg-universal` | `wysiwyg.techsites.ai/*` | Multi-tenant WYSIWYG editor API (KV-backed) |
| `techsites-proxy` | various | General request proxy layer |
| `techsites-dxb-wildcard-router` | `*.techsites.ai/*` | Routes wildcards to correct client Worker |

### WYSIWYG Workers (to be consolidated into `wysiwyg-universal`)

| Worker | Client | Status |
|--------|--------|--------|
| `mokha-wysiwyg-standalone-api` | cafe-model.pages.dev | Active → migrate |
| `agency-wysiwyg-standalone-review-api` | agency template | Active → migrate |
| `dentist-wysiwyg-standalone-review-api` | dentist template | Active → migrate |
| `real-estate-model-wysiwyg-api` | real estate template | Active → migrate |
| `trial-model-dubai-wysiwyg-api` | Dubai trial | Active → migrate |
| `techsites-wysiwyg-sandbox-api` | sandbox | Active → migrate |
| `techsites-editor-api` | base | Active → migrate |
| `techsites-editor-api-production` | production base | Active → migrate |

### Builder AI

| Worker | Purpose |
|--------|---------|
| `ts-builder-proxy` | POST `{ messages }` → Grok 3 mini → site structure markdown |

---

## Hub Worker Architecture (`techsites-hub-production`)

```
Request → [JWT Middleware]
            │
            ├── GET  /                  → Marketing landing (KV: hub:landing)
            ├── GET  /dashboard         → SaaS dashboard SPA
            ├── GET  /api/auth/login    → JWT issue
            ├── GET  /api/auth/register → New client registration
            ├── GET  /api/sites         → List client's sites
            ├── POST /api/sites         → Provision new site
            ├── GET  /api/sites/:id     → Site detail + matrix seed
            ├── POST /api/generate      → Queue site generation (N8N webhook)
            ├── POST /api/payments/stripe/* → Stripe checkout
            └── GET  /sites/:domain    → Serve client site (Matrix assembly)

Client site serving:
  1. Read KV: TS_SITES_KV.get(domain)
     → { seed: [2,5,1,4,0,3], niche: "food-beverage", content: {...} }
  2. Read 6 HTML blocks from KV or R2:
     → components/menus/menu-2.html
     → components/homes/home-5.html
     → ... (3 more)
     → components/footers/footer-3.html
  3. Read CSS tokens: tokens/niches/food-beverage.css
  4. HTMLRewriter: inject tokens + assemble blocks
  5. Return complete HTML in <10ms
```

---

## KV Schema

### `TS_HUB_KV`
| Key | Value | Description |
|-----|-------|-------------|
| `user:{email}` | `{ id, passwordHash, plan, createdAt }` | User account |
| `session:{token}` | `{ userId, expiresAt }` | Auth session |
| `plan:{id}` | `{ name, price, features }` | Plan definition |
| `hub:landing` | HTML string | Cached landing page |

### `TS_SITES_KV`
| Key | Value | Description |
|-----|-------|-------------|
| `site:{domain}` | `{ seed, niche, plan, userId, content, createdAt }` | Full site config |
| `site:{domain}:draft` | Same | Unpublished draft |

**Site KV value schema:**
```json
{
  "domain": "client.techsites.ai",
  "seed": [2, 5, 1, 4, 0, 3],
  "niche": "food-beverage",
  "plan": "pro",
  "userId": "user@email.com",
  "content": {
    "business_name": "Café Mokha",
    "tagline": "The finest Ethiopian specialty coffee",
    "phone": "+55 11 9999-9999",
    "address": "Rua das Flores, 123, São Paulo",
    "hero_cta": "Reserve a table",
    "about_text": "Since 2018, we have been...",
    "services": ["Specialty Coffee", "Full Brunch", "Private Events"]
  },
  "createdAt": "2026-08-10T00:00:00Z",
  "publishedAt": "2026-08-10T00:05:00Z"
}
```

### `TS_WYSIWYG_KV`
| Key | Value | Description |
|-----|-------|-------------|
| `{domain}:page:{page}` | `{ fields: [{id, value}], updatedAt }` | Per-page editable content |
| `{domain}:pages` | `["index.html", "about.html", ...]` | Page index |

---

## Matrix Assembly — Request Flow

```
GET https://client.techsites.ai/
    │
    ▼
techsites-hub-production Worker
    │
    ├─ 1. Extract domain from Host header: client.techsites.ai
    ├─ 2. KV lookup: TS_SITES_KV.get("site:client.techsites.ai")
    │       → { seed: [2,5,1,4,0,3], niche: "food-beverage", content: {...} }
    │
    ├─ 3. Resolve 6 block URLs:
    │       → kv["block:menu:2"] or r2["components/menus/menu-2.html"]
    │       → kv["block:home:5"] or r2["components/homes/home-5.html"]
    │       → ... (all 6 in parallel with Promise.all)
    │
    ├─ 4. Fetch CSS tokens:
    │       → kv["tokens:food-beverage"] → CSS string
    │
    ├─ 5. HTMLRewriter pipeline:
    │       new HTMLRewriter()
    │         .on('head', inject <style> with tokens)
    │         .on('#menu-slot', replace with menu-2.html content)
    │         .on('#home-slot', replace with home-5.html content)
    │         ... (all 6 slots)
    │         .on('[data-editable]', inject data-field-id for WYSIWYG)
    │
    └─ 6. Return complete HTML response
            Content-Type: text/html
            Cache-Control: public, max-age=300 (5 min CDN cache)
            CF-Cache-Status: HIT (second request)
```

---

## ts-builder-proxy Worker

The AI generator for site structure. Receives a chat history and returns a structured site plan in Markdown.

**System Prompt:**
```
You are Apex, the TechSites AI assistant specialized in building professional websites.
When given a brief, you generate:
- Hero section with compelling headline and subheadline
- Key sections (About, Services, Portfolio, Testimonials, CTA, Contact)
- Color palette and typography recommendations
- SEO meta title and description
- Conversion-focused copy for each section
- Call-to-action buttons text
Format in clear Markdown with sections.
After the structure, add "⚡ Next Steps" explaining TechSites AI will build this in 24 hours.
```

**API:**
```
POST https://ts-builder-proxy.workers.dev/
Content-Type: application/json

{ "messages": [{ "role": "user", "content": "I run a dental clinic in São Paulo..." }] }
```

**Response:**
```json
{ "content": "# Dental Clinic Site Structure\n\n## Hero\n**Headline:** ..." }
```

---

## N8N Automation Layer

N8N at `n8n.mediageek.io` orchestrates long-running operations that don't belong in a CF Worker:

| Workflow | Trigger | Action |
|---------|---------|--------|
| Site Generation | POST /api/generate | APEX CORE → copy gen → KV write → notification |
| Client Onboarding | New registration | Welcome email, trial activation, analytics event |
| DNS Provisioning | POST /api/sites | CF API → add DNS record → verify propagation |
| Daily Report | Cron | Pull KV stats → format → send to Slack/email |

---

## Security Architecture

1. **JWT auth in Hub** — HS256, 7-day expiry, stored in HttpOnly cookie (not localStorage)
2. **WYSIWYG origin validation** — Universal Worker validates `Origin` header against KV allowlist
3. **No secrets in Worker env** — all keys stored as `secret_text` CF bindings (not `plain_text`)
4. **Rate limiting** — CF Rate Limiting rules on `/api/generate` (10 req/min per IP)
5. **Content Security Policy** — injected by HTMLRewriter on every site response
6. **No eval, no innerHTML** — WYSIWYG uses `textContent` + `src` attribute updates only

---

## Performance Benchmarks

| Metric | Value | Method |
|--------|-------|--------|
| TTFB (CDN hit) | < 5ms | CF Dashboard analytics |
| TTFB (Worker cold) | < 50ms | Wrangler tail logs |
| First Contentful Paint | < 800ms | Lighthouse |
| Lighthouse Performance | 98/100 | No JS frameworks |
| KV read latency | < 2ms | CF KV analytics |
| Sites per Worker | Unlimited | Multi-tenant via KV key |
