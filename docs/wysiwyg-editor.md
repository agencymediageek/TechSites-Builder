# TechSites Builder — WYSIWYG Editor

## Architecture Overview

The TechSites WYSIWYG editor is a **floating inline editor** that allows clients to edit their site content without any backend, coding, or developer involvement. All state persists in Cloudflare KV at the edge.

```
Client opens their site
        │
        ▼
Floating ✏️ button (bottom-right)
        │ click
        ▼
Editor mode activates
  → contenteditable="true" on [data-editable] elements
  → Image click → upload/URL dialog
  → Color fields → color picker
        │
        │ (changes)
        ▼
Auto-save every 2s + manual Save button
  POST /save { page, fields: [{id, value}] }
        │
        ▼
wysiwyg-universal Worker
  → Validates Origin header vs KV allowlist
  → Writes TS_WYSIWYG_KV.put(`${siteId}:page:${page}`, fields)
        │
        ▼
Next page load: GET /state?page=index.html
  → Returns saved field values
  → Worker hydrates [data-editable] elements before serving
```

---

## Universal Worker API

**Base URL:** `https://wysiwyg.techsites.ai`  
**Auth:** `X-Site-Key` header (unique per client site)

### `GET /state`

Load all saved field values for a page.

**Query params:**
- `page` — page filename (e.g. `index.html`, `about.html`)

**Response:**
```json
{
  "page": "index.html",
  "fields": [
    { "id": "hero_title", "value": "The Best Coffee in São Paulo" },
    { "id": "hero_subtitle", "value": "Open 7 days a week" },
    { "id": "hero_image", "value": "https://images.unsplash.com/..." }
  ],
  "updatedAt": "2026-08-10T14:30:00Z"
}
```

### `POST /save`

Save field values for a page.

**Request:**
```json
{
  "page": "index.html",
  "fields": [
    { "id": "hero_title", "value": "Updated Title" },
    { "id": "cta_button", "value": "Book Now" }
  ]
}
```

**Response:**
```json
{ "ok": true, "savedAt": "2026-08-10T14:31:00Z" }
```

**Limits:**
- Max 700 fields per page
- Max 12KB per field value
- Max 100 pages per site

### `GET /pages`

List all pages with editable content.

**Response:**
```json
{
  "pages": [
    { "page": "index.html", "fieldCount": 24, "updatedAt": "..." },
    { "page": "about.html", "fieldCount": 12, "updatedAt": "..." }
  ]
}
```

---

## Editor Client JavaScript

The editor JS is injected into every client site by the Hub Worker. It's a self-contained module (~8KB gzipped, no dependencies):

```javascript
// ts-editor.js — injected by Hub Worker when ?edit=1 or via floating button
(function() {
  'use strict';
  
  const WYSIWYG_BASE = 'https://wysiwyg.techsites.ai';
  const SITE_KEY = document.querySelector('meta[name="ts-site-key"]')?.content;
  const PAGE = window.location.pathname.replace(/^\//, '') || 'index.html';
  
  let editMode = false;
  let pendingChanges = {};
  let saveTimer = null;
  
  // ─── Floating Button ──────────────────────────────────────────────
  function createFloatingButton() {
    const btn = document.createElement('button');
    btn.id = 'ts-edit-btn';
    btn.innerHTML = '✏️';
    btn.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--color-primary, #6C3FC5);
      color: white; border: none; cursor: pointer;
      font-size: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 99999; transition: transform 0.2s, box-shadow 0.2s;
    `;
    btn.onclick = toggleEditMode;
    document.body.appendChild(btn);
    return btn;
  }
  
  // ─── Edit Mode Toggle ─────────────────────────────────────────────
  async function toggleEditMode() {
    editMode = !editMode;
    
    if (editMode) {
      await loadState();
      enableEditing();
      showToolbar();
    } else {
      await saveChanges();
      disableEditing();
      hideToolbar();
    }
  }
  
  // ─── Enable Editing ───────────────────────────────────────────────
  function enableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      const type = el.dataset.editableType || 'text';
      
      if (type === 'text' || type === 'html') {
        el.contentEditable = 'true';
        el.style.outline = '2px dashed var(--color-primary, #6C3FC5)';
        el.style.outlineOffset = '4px';
        el.addEventListener('input', onFieldChange);
      } else if (type === 'image') {
        el.style.cursor = 'pointer';
        el.style.outline = '2px dashed var(--color-primary, #6C3FC5)';
        el.addEventListener('click', onImageClick);
      } else if (type === 'color') {
        el.style.cursor = 'pointer';
        el.addEventListener('click', onColorClick);
      } else if (type === 'link') {
        el.style.outline = '2px dashed var(--color-primary, #6C3FC5)';
        el.addEventListener('dblclick', onLinkEdit);
      }
    });
  }
  
  // ─── Field Change Handler ─────────────────────────────────────────
  function onFieldChange(e) {
    const field = e.target.dataset.editable;
    const type = e.target.dataset.editableType || 'text';
    const value = type === 'html' ? e.target.innerHTML : e.target.textContent;
    
    pendingChanges[field] = value;
    scheduleSave();
  }
  
  // ─── Auto-Save ────────────────────────────────────────────────────
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveChanges, 2000);
  }
  
  async function saveChanges() {
    if (Object.keys(pendingChanges).length === 0) return;
    
    const fields = Object.entries(pendingChanges).map(([id, value]) => ({ id, value }));
    
    try {
      const res = await fetch(`${WYSIWYG_BASE}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Site-Key': SITE_KEY,
        },
        body: JSON.stringify({ page: PAGE, fields }),
      });
      
      if (res.ok) {
        pendingChanges = {};
        showSaved();
      }
    } catch (err) {
      console.error('[TechSites Editor] Save failed:', err);
    }
  }
  
  // ─── Load State ───────────────────────────────────────────────────
  async function loadState() {
    const res = await fetch(`${WYSIWYG_BASE}/state?page=${PAGE}`, {
      headers: { 'X-Site-Key': SITE_KEY },
    });
    
    if (!res.ok) return;
    
    const { fields } = await res.json();
    
    fields.forEach(({ id, value }) => {
      const el = document.querySelector(`[data-editable="${id}"]`);
      if (!el) return;
      
      const type = el.dataset.editableType || 'text';
      if (type === 'text') el.textContent = value;
      else if (type === 'html') el.innerHTML = value;
      else if (type === 'image') el.src = value;
      else if (type === 'link') el.href = value;
    });
  }
  
  // ─── Init ─────────────────────────────────────────────────────────
  if (SITE_KEY) {
    createFloatingButton();
  }
})();
```

---

## KV Storage Schema

### Key Format
```
{siteId}:page:{page}    → JSON: { fields: [{id, value}], updatedAt }
{siteId}:pages          → JSON: string[] (page index)
```

### Site ID
The site ID is derived from the domain:
```javascript
const siteId = btoa(domain).replace(/=/g, ''); // URL-safe base64
// "client.techsites.ai" → "Y2xpZW50LnRlY2hzaXRlcy5haQ"
```

### Field Limits
| Limit | Value | Reason |
|-------|-------|--------|
| Max fields per page | 700 | KV value size limit (25MB total, but 12KB per value) |
| Max value size | 12KB | KV single value limit |
| Max pages per site | 100 | KV key count per namespace |
| TTL | None | Persistent (paid KV tier) |

---

## Origin Validation

The universal WYSIWYG Worker validates every request origin against a per-site allowlist:

```javascript
async function validateOrigin(request, env, siteId) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  
  // Load allowlist from KV
  const config = await env.TS_SITES_KV.get(`site:${siteId}`, 'json');
  if (!config) return false;
  
  const allowed = [
    `https://${config.domain}`,
    `https://hub.techsites.ai`,       // Admin panel
    `https://techsites.ai`,           // Landing preview
    ...(config.customDomains || []),  // Custom domains
  ];
  
  return allowed.some(a => origin.startsWith(a));
}
```

---

## Migration from Per-Site Workers

Legacy per-site Workers (mokha-wysiwyg-standalone-api, etc.) store data in their own KV namespaces. Migration script:

```bash
# scripts/migrate-wysiwyg.sh
# Migrates all legacy WYSIWYG Worker data to universal Worker

WORKERS=(
  "mokha-wysiwyg-standalone-api:cafe-model.pages.dev"
  "agency-wysiwyg-standalone-review-api:agency-review.pages.dev"
  "dentist-wysiwyg-standalone-review-api:dentist-review.pages.dev"
)

for entry in "${WORKERS[@]}"; do
  worker="${entry%%:*}"
  domain="${entry##*:}"
  
  echo "Migrating $worker ($domain)..."
  
  # Export data from legacy Worker KV
  wrangler kv key list --namespace-id=<LEGACY_KV_ID> --binding=STORE | \
    jq -r '.[].name' | while read key; do
      value=$(wrangler kv key get "$key" --namespace-id=<LEGACY_KV_ID>)
      # Write to universal KV under site-namespaced key
      wrangler kv key put "${domain}:${key}" "$value" \
        --namespace-id=<UNIVERSAL_KV_ID>
    done
  
  echo "✅ $worker migrated"
done
```
