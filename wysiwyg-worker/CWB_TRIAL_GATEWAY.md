# CWB trial editor gateway

`cwb-trial-gateway.js` is a narrowly scoped adapter in the canonical
TechSites repository. It uses the universal WYSIWYG KV contract without
exposing the legacy browser key or changing `index.js`. Deploy with
`wrangler.cwb-trial.toml`; the dedicated
`https://wysiwyg.techsites.ai/cwb-trial/*` route is more specific than
the existing universal Worker route.

## Required configuration

- Bind `TS_WYSIWYG_KV` to the existing canonical WYSIWYG KV namespace. The
  gateway reads and updates the existing
  `dHJpYWwuY3diLnNpdGU:page:index.html` record.
- Protect the admin route and its children with one zone-scoped Cloudflare
  Access application limited to an Agency operator. The operator email
  belongs only in the Access policy, never in source. Configure the Worker
  with `ACCESS_AUD` (the exact Access application audience tag) and
  `ACCESS_ISSUER` (the exact issuer URL). The Worker independently verifies
  `CF-Access-Jwt-Assertion` against the issuer's
  `/cdn-cgi/access/certs` JWKS, including signature, issuer, audience, expiry,
  and not-before claims. Missing or invalid config/token fails closed.
- `TRIAL_EXPIRES_AT` is set to `2026-10-04T01:03:49Z`, the approved seven-day
  trial window. The admin editor shows a countdown, and saves are rejected
  after the configured timestamp. An invalid timestamp fails closed.

Do not put an Access token, permanent browser key, or other secret in the page.
Admin requests rely on the Access-protected request header. The public state
route is read-only; it emits wildcard CORS so the Replit preview can load
the same public fields. It never allows cross-origin writes or credentials.

## Endpoint shapes

- `GET /cwb-trial/state` → `{ "fields": [{"id":"hero-title","value":"..."}], "updatedAt": "... or null", "revision": "...", "serverNow": "...", "expiresAt": "..." }`.
  The response is sparse: it contains only allowlisted fields explicitly saved
  in KV. With no KV record, `fields` is empty, so the public page keeps its own
  canonical content defaults. `serverNow` is the gateway's current UTC time;
  `expiresAt` is the configured expiry (or `null` if not configured). Responses
  are `no-store` and retain wildcard CORS. This endpoint is read-only.
- `GET /cwb-trial/admin` → self-contained form/preview UI; normal mode shows
  hero fields and dish titles, advanced mode reveals dish descriptions. The UI
  is in Brazilian Portuguese, and its HTML response sets a restrictive CSP
  (`frame-ancestors 'none'`) plus `X-Frame-Options: DENY`.
- `GET /cwb-trial/admin/state` → state shape with all eight controls populated.
  For fields not yet saved, controls use the vetted defaults copied from
  `TrialSite.tsx`; those defaults are only written to KV after an explicit save.
  Includes `expiresAt` when configured.
- `GET /cwb-trial/admin/source-review` requires the same verified Cloudflare
  Access JWT as the other admin endpoints. It requests only the fixed official
  Madalosso history, unit, and menu URLs, with an eight-second timeout and a
  512 KiB per-response read cap. It returns `checkedAt` and topic snippets for
   history, polenta, lasanha, gnocchi, menu, hours, and address as
  `{ "sources": [{ "topic": "...", "title": "...", "url": "...", "excerpt": "...", "status": "..." }] }`.
  Snippets are extracted from page text around matching terms, not treated as
  verified facts or confirmed changes. Inaccessible pages report an explicit
  per-source status. Source review performs no KV writes and never publishes.
- `POST /cwb-trial/admin/save` accepts JSON
  `{ "revision": "...", "fields": [{"id":"hero-title","value":"..."}] }` and
  returns `{ "ok": true, "updatedAt": "...", "revision": "..." }`.
  All eight fields are required; values are plain text, at most 500 Unicode
  code points, with angle brackets disallowed. Request size is capped at 16 KB.
  Stale revisions receive HTTP 409 and the current revision.
  Requests must have the exact `Origin: https://wysiwyg.techsites.ai` header
  in addition to a valid Access JWT.

Each successful save writes an immutable revision snapshot in KV under
`dHJpYWwuY3diLnNpdGU:trial:cwb:revision:<revision>` before replacing the
canonical page record. Cloudflare KV has no atomic compare-and-swap, so the
optimistic revision check reduces accidental overwrites but cannot guarantee
serialization for truly simultaneous saves. Initial records without a stored
revision receive a deterministic content-derived revision token.

No personal data is collected or written by this gateway. Cloudflare Access
may maintain its own authentication logs according to account configuration.

The admin button “Recarregar edições salvas” only reloads KV-backed content.
Official-source review is a separate editorial aid; links and plain-text
snippets are rendered as text, and a human must review the official source
before changing descriptions. Three separate review textareas feed a
preview-only message to the `https://trial.cwb.site` iframe. That test does not
change the main form, save a draft, or call the save endpoint; it is discarded
when the page is navigated away from or refreshed. Saving remains an explicit
separate action and remains blocked after expiry.

Run `node --test cwb-trial-gateway.test.mjs` and `node --check
cwb-trial-gateway.js` before deployment. The public response is sparse until
the first save, so the candidate page keeps its vetted defaults.