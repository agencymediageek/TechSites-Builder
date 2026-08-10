/**
 * wysiwyg-universal — TechSites Builder Universal WYSIWYG Editor Worker
 *
 * Multi-tenant inline editor API backed by Cloudflare KV.
 * Replaces 8+ per-site WYSIWYG Workers with a single multi-tenant solution.
 *
 * Bindings required (wrangler.toml):
 *   TS_WYSIWYG_KV  — KV namespace for all per-site content
 *   TS_SITES_KV    — KV namespace for site configs (origin validation)
 *
 * API:
 *   GET  /state?page=index.html       — Load saved fields for a page
 *   POST /save                        — Save fields for a page
 *   GET  /pages                       — List all pages with content
 *   GET  /healthz                     — Health check
 *
 * Auth: X-Site-Key header (per-site secret stored in KV)
 *
 * @version 2.0.0 — Universal multi-tenant edition
 * @license Proprietary — MediaGeek Agency
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FIELDS_PER_PAGE = 700;
const MAX_FIELD_VALUE_BYTES = 12_288; // 12KB per KV value limit
const MAX_PAGES_PER_SITE = 100;
const KV_TTL = undefined; // Persistent (no TTL on paid KV tier)

// ─── CORS Helper ─────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Site-Key, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status = 200, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

// ─── Site ID from Domain ──────────────────────────────────────────────────────
function getSiteId(domain) {
  // URL-safe base64 of the domain
  return btoa(domain).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ─── Matrix Seed from License Key ────────────────────────────────────────────
function getSiteMatrixIndices(licenseKey) {
  let hash = 0;
  for (let i = 0; i < licenseKey.length; i++) {
    const char = licenseKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  hash = Math.abs(hash);
  const indices = [];
  let remaining = hash;
  for (let i = 0; i < 6; i++) {
    indices.push(remaining % 6);
    remaining = Math.floor(remaining / 6);
  }
  return indices; // [menu, home, about, howto, contact, footer]
}

// ─── Origin Validation ────────────────────────────────────────────────────────
async function validateOrigin(request, env, siteId) {
  const origin = request.headers.get('Origin');
  if (!origin) return { valid: true, origin: null }; // Server-side calls allowed

  // Always allow hub admin panel
  const alwaysAllowed = [
    'https://hub.techsites.ai',
    'https://techsites.ai',
    'https://wp.techsites.ai',
  ];
  if (alwaysAllowed.some(a => origin.startsWith(a))) {
    return { valid: true, origin };
  }

  // Load site config from KV to get allowed origins
  const config = await env.TS_SITES_KV.get(`site:${siteId}`, 'json');
  if (!config) {
    // Allow during development if no config yet
    if (origin.includes('localhost') || origin.includes('pages.dev')) {
      return { valid: true, origin };
    }
    return { valid: false, origin };
  }

  // Build allowlist
  const allowed = [
    `https://${config.domain}`,
    `http://${config.domain}`,
    ...(config.customDomains || []).map(d => `https://${d}`),
    ...(config.customDomains || []).map(d => `http://${d}`),
  ];

  const valid = allowed.some(a => origin.startsWith(a));
  return { valid, origin };
}

// ─── Validate X-Site-Key ──────────────────────────────────────────────────────
async function validateSiteKey(request, env) {
  const siteKey = request.headers.get('X-Site-Key');
  if (!siteKey) return null;

  // Look up which site this key belongs to
  const siteId = await env.TS_WYSIWYG_KV.get(`key:${siteKey}`);
  return siteId;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /state?page=index.html
async function handleGetState(request, env, siteId) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || 'index.html';

  // Sanitize page name
  const safePage = page.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 100);

  const kvKey = `${siteId}:page:${safePage}`;
  const stored = await env.TS_WYSIWYG_KV.get(kvKey, 'json');

  return {
    page: safePage,
    fields: stored?.fields || [],
    updatedAt: stored?.updatedAt || null,
    matrixSeed: stored?.matrixSeed || null,
  };
}

// POST /save
async function handleSave(request, env, siteId) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { error: 'Invalid JSON body' };
  }

  const { page, fields } = body;
  if (!page || !Array.isArray(fields)) {
    return { error: 'page (string) and fields (array) are required' };
  }

  const safePage = page.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 100);

  // Validate field count
  if (fields.length > MAX_FIELDS_PER_PAGE) {
    return { error: `Too many fields. Max ${MAX_FIELDS_PER_PAGE} per page.` };
  }

  // Validate and sanitize fields
  const sanitizedFields = [];
  for (const field of fields) {
    if (!field.id || typeof field.id !== 'string') continue;
    if (field.value === undefined) continue;

    const value = String(field.value);
    const valueBytes = new TextEncoder().encode(value).length;

    if (valueBytes > MAX_FIELD_VALUE_BYTES) {
      return { error: `Field "${field.id}" exceeds ${MAX_FIELD_VALUE_BYTES} byte limit.` };
    }

    sanitizedFields.push({
      id: field.id.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100),
      value,
    });
  }

  // Merge with existing fields (only update changed ones)
  const kvKey = `${siteId}:page:${safePage}`;
  const existing = await env.TS_WYSIWYG_KV.get(kvKey, 'json');
  const existingMap = Object.fromEntries(
    (existing?.fields || []).map(f => [f.id, f.value])
  );

  sanitizedFields.forEach(f => { existingMap[f.id] = f.value; });
  const mergedFields = Object.entries(existingMap).map(([id, value]) => ({ id, value }));

  const savedAt = new Date().toISOString();
  await env.TS_WYSIWYG_KV.put(kvKey, JSON.stringify({
    fields: mergedFields,
    updatedAt: savedAt,
  }));

  // Update page index
  const indexKey = `${siteId}:pages`;
  const pageIndex = await env.TS_WYSIWYG_KV.get(indexKey, 'json') || [];
  if (!pageIndex.includes(safePage)) {
    if (pageIndex.length < MAX_PAGES_PER_SITE) {
      pageIndex.push(safePage);
      await env.TS_WYSIWYG_KV.put(indexKey, JSON.stringify(pageIndex));
    }
  }

  return { ok: true, savedAt, fieldCount: mergedFields.length };
}

// GET /pages
async function handleGetPages(env, siteId) {
  const indexKey = `${siteId}:pages`;
  const pages = await env.TS_WYSIWYG_KV.get(indexKey, 'json') || [];

  // Enrich with metadata
  const enriched = await Promise.all(
    pages.map(async (page) => {
      const data = await env.TS_WYSIWYG_KV.get(`${siteId}:page:${page}`, 'json');
      return {
        page,
        fieldCount: data?.fields?.length || 0,
        updatedAt: data?.updatedAt || null,
      };
    })
  );

  return { pages: enriched };
}

// GET /matrix — return matrix seed for the site
async function handleGetMatrix(env, siteId) {
  const config = await env.TS_SITES_KV.get(`site:${siteId}`, 'json');
  if (!config) return { error: 'Site not found' };

  const { seed, niche, license } = config;
  const computed = license ? getSiteMatrixIndices(license) : seed;

  return {
    seed: computed,
    niche: niche || 'professional-services',
    components: [
      `menu-${computed?.[0] ?? 0}`,
      `home-${computed?.[1] ?? 0}`,
      `about-${computed?.[2] ?? 0}`,
      `howto-${computed?.[3] ?? 0}`,
      `contact-${computed?.[4] ?? 0}`,
      `footer-${computed?.[5] ?? 0}`,
    ],
  };
}

// ─── Main Fetch Handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get('Origin');

    // ── CORS Preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // ── Health Check ────────────────────────────────────────────────────────
    if (pathname === '/healthz') {
      return json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
    }

    // ── Auth: Resolve site from X-Site-Key ──────────────────────────────────
    const siteKey = request.headers.get('X-Site-Key');
    if (!siteKey) {
      return json({ error: 'X-Site-Key header is required' }, 401, origin);
    }

    let siteId;
    
    // Check if it's a test/health-check key
    if (siteKey === 'health-check') {
      siteId = 'health-check';
    } else {
      // Look up site ID from key registry
      siteId = await env.TS_WYSIWYG_KV.get(`key:${siteKey}`);
      if (!siteId) {
        return json({ error: 'Invalid site key' }, 401, origin);
      }
    }

    // ── Origin Validation ───────────────────────────────────────────────────
    const { valid, origin: validatedOrigin } = await validateOrigin(request, env, siteId);
    if (!valid) {
      return json({
        error: 'Origin not allowed',
        origin,
        help: 'Contact TechSites support to add your domain to the allowlist',
      }, 403, origin);
    }

    // ── Route to Handler ────────────────────────────────────────────────────
    try {
      let result;

      if (pathname === '/state' && request.method === 'GET') {
        result = await handleGetState(request, env, siteId);

      } else if (pathname === '/save' && request.method === 'POST') {
        result = await handleSave(request, env, siteId);

      } else if (pathname === '/pages' && request.method === 'GET') {
        result = await handleGetPages(env, siteId);

      } else if (pathname === '/matrix' && request.method === 'GET') {
        result = await handleGetMatrix(env, siteId);

      } else {
        return json({
          error: 'Not found',
          available: ['GET /state', 'POST /save', 'GET /pages', 'GET /matrix', 'GET /healthz'],
        }, 404, origin);
      }

      // Return error if handler returned an error object
      if (result?.error) {
        const status = result.error.includes('not found') ? 404 :
                       result.error.includes('required') ? 400 :
                       result.error.includes('Too many') ? 400 : 500;
        return json(result, status, origin);
      }

      return json(result, 200, origin);

    } catch (err) {
      console.error('[wysiwyg-universal] Error:', err.message);
      return json({ error: 'Internal server error' }, 500, origin);
    }
  },
};
