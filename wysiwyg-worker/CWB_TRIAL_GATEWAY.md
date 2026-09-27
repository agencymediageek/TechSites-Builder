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
- Optionally set `TRIAL_EXPIRES_AT` to an ISO-8601 timestamp. The editor shows
  a countdown only when this value is configured, and saves are rejected after
  it passes. An invalid configured timestamp fails closed. Do not invent a
  deadline before the trial duration is approved.

Do not put an Access token, permanent browser key, or other secret in the page.
Admin requests rely on the Access-protected request header. The public state
route is read-only; it emits wildcard CORS so the Replit preview can load
the same public fields. It never allows cross-origin writes or credentials.

## Endpoint shapes

- `GET /cwb-trial/state` → `{ "fields": [{"id":"hero-title","value":"..."}], "updatedAt": "... or null", "revision": "..." }`.
  The response is sparse: it contains only allowlisted fields explicitly saved
  in KV. With no KV record, `fields` is empty, so the public page keeps its own
  canonical content defaults. Responses are `no-store`.
- `GET /cwb-trial/admin` → self-contained form/preview UI; normal mode shows
  hero fields and dish titles, advanced mode reveals dish descriptions. The UI
  is in Brazilian Portuguese, and its HTML response sets a restrictive CSP
  (`frame-ancestors 'none'`) plus `X-Frame-Options: DENY`.
- `GET /cwb-trial/admin/state` → state shape with all eight controls populated.
  For fields not yet saved, controls use the vetted defaults copied from
  `TrialSite.tsx`; those defaults are only written to KV after an explicit save.
  Includes `expiresAt` only when configured.
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

Run `node --test cwb-trial-gateway.test.mjs` before a deployment. The public
response is sparse until the first save, so the candidate page keeps its
vetted defaults. The admin reload button fetches saved content, not updates
from external sources. The optional countdown depends on server configuration.