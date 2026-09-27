/**
 * Isolated TechSites CWB trial editor gateway.
 *
 * Deploy this as a separate Worker only on /cwb-trial/*; do not add these
 * routes or credentials to the universal editor Worker.
 */

const SITE_ID = 'dHJpYWwuY3diLnNpdGU';
const PAGE_KEY = `${SITE_ID}:page:index.html`;
const ALLOWED_ORIGIN = 'https://trial.cwb.site';
const PREVIEW_URL = 'https://trial.cwb.site';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_VALUE_CHARS = 500;
const FIELD_IDS = [
  'hero-title',
  'hero-lead',
  'dish-01-title',
  'dish-01-description',
  'dish-02-title',
  'dish-02-description',
  'dish-03-title',
  'dish-03-description',
];
const DEFAULT_FIELDS = {
  'hero-title': 'Uma mesa que faz parte de Curitiba.',
  'hero-lead': 'De três mesas em Santa Felicidade a um dos nomes mais conhecidos da gastronomia curitibana. Conheça a história da Família Madalosso a partir de informações publicadas pelo próprio restaurante.',
  'dish-01-title': 'Polenta frita',
  'dish-01-description': 'O cardápio oficial descreve a polenta como frita, crocante e servida entre os acompanhamentos do rodízio.',
  'dish-02-title': 'Lasanha na manteiga',
  'dish-02-description': 'Camadas de massa fina com um leve molho de manteiga, segundo o cardápio da matriz.',
  'dish-03-title': 'Gnocchi de batata-salsa',
  'dish-03-description': 'Gnocchi de batata-salsa servido com molho alfredo no rodízio da matriz.',
};
const FIELD_ID_SET = new Set(FIELD_IDS);
const jwksCache = new Map();

function responseHeaders(extra = {}) {
  return {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  };
}

function json(data, status = 200, cors = false) {
  const headers = responseHeaders({ 'Content-Type': 'application/json; charset=utf-8' });
  if (cors) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
    headers.Vary = 'Origin';
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function textResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: responseHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-src https://trial.cwb.site",
      'X-Frame-Options': 'DENY',
    }),
  });
}

function getExpiry(env) {
  if (!env.TRIAL_EXPIRES_AT) return null;
  const expiresAtMs = Date.parse(env.TRIAL_EXPIRES_AT);
  if (!Number.isFinite(expiresAtMs)) throw new Error('Invalid TRIAL_EXPIRES_AT configuration');
  return { iso: new Date(expiresAtMs).toISOString(), ms: expiresAtMs };
}

function normalizeFields(fields) {
  const values = new Map();
  if (Array.isArray(fields)) {
    for (const field of fields) {
      if (field && FIELD_ID_SET.has(field.id) && typeof field.value === 'string') {
        values.set(field.id, field.value);
      }
    }
  }
  return FIELD_IDS.filter(id => values.has(id)).map(id => ({ id, value: values.get(id) }));
}

function fieldsWithDefaults(fields) {
  const values = new Map(FIELD_IDS.map(id => [id, DEFAULT_FIELDS[id]]));
  for (const field of fields) values.set(field.id, field.value);
  return FIELD_IDS.map(id => ({ id, value: values.get(id) }));
}

async function revisionFor(fields, updatedAt) {
  const source = JSON.stringify({ fields, updatedAt: updatedAt || null });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return `initial-${[...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function readState(env) {
  if (!env.TS_WYSIWYG_KV) throw new Error('Missing TS_WYSIWYG_KV binding');
  const stored = await env.TS_WYSIWYG_KV.get(PAGE_KEY, 'json');
  const fields = normalizeFields(stored?.fields);
  const updatedAt = typeof stored?.updatedAt === 'string' ? stored.updatedAt : null;
  const revision = typeof stored?.revision === 'string' && stored.revision
    ? stored.revision
    : await revisionFor(fields, updatedAt);
  return { fields, updatedAt, revision };
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function decodeJwtPart(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value)));
}

async function loadJwks(issuer, forceRefresh = false) {
  const jwksUrl = `${issuer.replace(/\/+$/, '')}/cdn-cgi/access/certs`;
  const cached = jwksCache.get(jwksUrl);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.keys;
  const response = await fetch(jwksUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Unable to load Access signing keys');
  const data = await response.json();
  if (!Array.isArray(data.keys)) throw new Error('Invalid Access signing keys response');
  jwksCache.set(jwksUrl, { keys: data.keys, expiresAt: Date.now() + 5 * 60 * 1000 });
  return data.keys;
}

async function verifyAccessJwt(request, env) {
  const issuer = env.ACCESS_ISSUER;
  const audience = env.ACCESS_AUD;
  const token = request.headers.get('CF-Access-Jwt-Assertion');
  if (!issuer || !audience || !token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const header = decodeJwtPart(parts[0]);
    const claims = decodeJwtPart(parts[1]);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return false;

    let keys = await loadJwks(issuer);
    let jwk = keys.find(key => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) {
      keys = await loadJwks(issuer, true);
      jwk = keys.find(key => key.kid === header.kid && key.kty === 'RSA');
    }
    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlDecode(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!verified) return false;

    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    return claims.iss === issuer
      && audiences.includes(audience)
      && Number.isFinite(claims.exp)
      && claims.exp > now
      && (claims.nbf === undefined || (Number.isFinite(claims.nbf) && claims.nbf <= now));
  } catch {
    return false;
  }
}

async function handleAdminPage(env) {
  const expiry = getExpiry(env);
  return textResponse(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Editor da prévia CWB</title>
  <style>
    :root{color-scheme:light;font:15px/1.5 system-ui,sans-serif;color:#182126;background:#f4f6f5}
    *{box-sizing:border-box}body{margin:0}header{background:#122722;color:#fff;padding:18px 24px}
    header h1{font-size:20px;margin:0}main{max-width:1280px;margin:24px auto;padding:0 20px}
    .layout{display:grid;grid-template-columns:minmax(320px,460px) minmax(0,1fr);gap:20px}
    .panel{background:#fff;border:1px solid #dce3df;border-radius:12px;padding:20px;box-shadow:0 4px 18px #13241a0b}
    label{display:block;font-weight:650;margin:14px 0 5px}input,textarea,select,button{font:inherit}
    input,textarea{width:100%;padding:10px 12px;border:1px solid #bdc9c2;border-radius:7px}
    textarea{min-height:75px;resize:vertical}button{border:0;border-radius:7px;padding:10px 16px;font-weight:700;cursor:pointer}
    #save{color:#fff;background:#167348;margin-top:18px}.secondary{color:#18372a;background:#e4eee8}
    .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.status{min-height:24px;margin-top:10px}
    .muted{color:#58665f;font-size:13px}.advanced-only[hidden]{display:none}.preview{width:100%;height:75vh;min-height:480px;border:1px solid #dce3df;border-radius:8px}
    @media(max-width:850px){.layout{grid-template-columns:1fr}.preview{height:68vh}}
  </style>
</head>
<body>
  <header><h1>Editor da prévia CWB</h1></header>
  <main><div class="layout">
    <section class="panel" aria-label="Conteúdo da prévia">
      <div class="actions">
        <label for="mode" style="margin:0">Modo de edição</label>
        <select id="mode"><option value="normal">Simples</option><option value="advanced">Avançado</option></select>
        <button class="secondary" id="refetch" type="button">Atualizar do servidor</button>
      </div>
      <p class="muted">Suas mudanças só entram no ar quando você clicar em salvar. Depois, a página busca os dados atualizados no servidor.</p>
      <p id="countdown" class="muted"${expiry ? '' : ' hidden'}></p>
      <form id="editor">
        <label for="hero-title">Título principal</label><input id="hero-title" maxlength="500">
        <label for="hero-lead">Texto de abertura</label><textarea id="hero-lead" maxlength="500"></textarea>
        <label for="dish-01-title">Nome do prato 1</label><input id="dish-01-title" maxlength="500">
        <div class="advanced-only" hidden><label for="dish-01-description">Descrição do prato 1</label><textarea id="dish-01-description" maxlength="500"></textarea></div>
        <label for="dish-02-title">Nome do prato 2</label><input id="dish-02-title" maxlength="500">
        <div class="advanced-only" hidden><label for="dish-02-description">Descrição do prato 2</label><textarea id="dish-02-description" maxlength="500"></textarea></div>
        <label for="dish-03-title">Nome do prato 3</label><input id="dish-03-title" maxlength="500">
        <div class="advanced-only" hidden><label for="dish-03-description">Descrição do prato 3</label><textarea id="dish-03-description" maxlength="500"></textarea></div>
        <div class="actions"><button id="save" type="submit">Salvar mudanças</button><span id="revision" class="muted"></span></div>
      </form>
      <div id="status" class="status" role="status" aria-live="polite"></div>
    </section>
    <section class="panel" aria-label="Prévia ao vivo"><iframe id="site-preview" class="preview" src="${PREVIEW_URL}" title="Prévia do site"></iframe></section>
  </div></main>
  <script>
    (() => {
      const ids = ${JSON.stringify(FIELD_IDS)};
      let revision = null;
      const status = document.getElementById('status');
      const setStatus = message => { status.textContent = message; };
      const showFields = () => {
        const advanced = document.getElementById('mode').value === 'advanced';
        document.querySelectorAll('.advanced-only').forEach(el => { el.hidden = !advanced; });
      };
      async function refetch() {
        setStatus('Buscando os dados do servidor…');
        try {
          const response = await fetch('/cwb-trial/admin/state', { cache: 'no-store' });
          if (!response.ok) throw new Error('Não foi possível atualizar os dados (' + response.status + ').');
          const state = await response.json();
          ids.forEach(id => { document.getElementById(id).value = state.fields.find(field => field.id === id)?.value ?? ''; });
          revision = state.revision;
          document.getElementById('revision').textContent = 'Versão: ' + revision;
          setStatus('Pronto! Esses são os dados atuais.');
        } catch (error) { setStatus(error.message || 'Não foi possível atualizar os dados.'); }
      }
      document.getElementById('mode').addEventListener('change', showFields);
      document.getElementById('refetch').addEventListener('click', refetch);
      document.getElementById('editor').addEventListener('submit', async event => {
        event.preventDefault();
        if (!revision) { setStatus('Atualize os dados do servidor antes de salvar.'); return; }
        const fields = ids.map(id => ({ id, value: document.getElementById(id).value }));
        setStatus('Salvando…');
        try {
          const response = await fetch('/cwb-trial/admin/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revision, fields }),
          });
          const result = await response.json();
          if (!response.ok) {
            const message = response.status === 409
              ? 'Outra edição foi salva. Copie seus textos antes de recarregar os dados do servidor.'
              : response.status === 410
                ? 'O prazo de edição desta prévia terminou.'
                : 'Não foi possível salvar as mudanças (' + response.status + ').';
            throw new Error(message);
          }
          await refetch();
          document.getElementById('site-preview').src = ${JSON.stringify(PREVIEW_URL)};
          setStatus('Tudo certo! As mudanças foram salvas e atualizadas.');
        } catch (error) { setStatus(error.message || 'Não foi possível salvar as mudanças.'); }
      });
      ${expiry ? `const expiry = new Date(${JSON.stringify(expiry.iso)}).getTime();
      const countdown = document.getElementById('countdown');
      const updateCountdown = () => {
        const remaining = Math.max(0, expiry - Date.now());
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        countdown.textContent = remaining ? 'O prazo para editar termina em ' + hours + 'h ' + minutes + 'min.' : 'O prazo para editar esta prévia terminou.';
      };
      updateCountdown(); setInterval(updateCountdown, 60000);` : ''}
      showFields();
      refetch();
    })();
  </script>
</body>
</html>`);
}

async function handleSave(request, env) {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().split(';')[0].trim().match(/^application\/json$/)) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }
  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Request body exceeds 16 KB' }, 413);
  }
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Request body is required' }, 400);
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return json({ error: 'Request body exceeds 16 KB' }, 413);
    }
    chunks.push(value);
  }
  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let rawBody;
  try {
    rawBody = new TextDecoder('utf-8', { fatal: true }).decode(bodyBytes);
  } catch {
    return json({ error: 'Request body must be valid UTF-8 JSON' }, 400);
  }
  let body;
  try { body = JSON.parse(rawBody); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || typeof body.revision !== 'string' || !Array.isArray(body.fields)) {
    return json({ error: 'revision and fields are required' }, 400);
  }
  const expiry = getExpiry(env);
  if (expiry && expiry.ms <= Date.now()) return json({ error: 'Trial editing window has expired' }, 410);

  const seen = new Set();
  const nextValues = new Map();
  for (const field of body.fields) {
    if (!field || typeof field !== 'object' || !FIELD_ID_SET.has(field.id)) {
      return json({ error: 'Field id is not editable' }, 400);
    }
    if (seen.has(field.id)) return json({ error: 'Duplicate field id' }, 400);
    if (typeof field.value !== 'string' || [...field.value].length > MAX_VALUE_CHARS) {
      return json({ error: 'Field values must be text of at most 500 characters' }, 400);
    }
    if (/[<>]/.test(field.value)) return json({ error: 'HTML and markup characters are not allowed' }, 400);
    nextValues.set(field.id, field.value);
    seen.add(field.id);
  }
  if (seen.size !== FIELD_IDS.length) return json({ error: 'All editable fields must be supplied' }, 400);

  const current = await readState(env);
  if (body.revision !== current.revision) {
    return json({ error: 'Revision conflict; refetch state before saving', revision: current.revision }, 409);
  }
  const updatedAt = new Date().toISOString();
  const revision = crypto.randomUUID();
  const fields = FIELD_IDS.map(id => ({ id, value: nextValues.get(id) }));
  const snapshot = { fields, updatedAt, revision };
  await env.TS_WYSIWYG_KV.put(
    `${SITE_ID}:trial:cwb:revision:${current.revision}`,
    JSON.stringify({ fields: current.fields, updatedAt: current.updatedAt, revision: current.revision }),
  );
  const snapshotKey = `${SITE_ID}:trial:cwb:revision:${revision}`;
  await env.TS_WYSIWYG_KV.put(snapshotKey, JSON.stringify(snapshot));
  await env.TS_WYSIWYG_KV.put(PAGE_KEY, JSON.stringify(snapshot));
  return json({ ok: true, updatedAt, revision });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/cwb-trial/')) return json({ error: 'Not found' }, 404);

    if (url.pathname === '/cwb-trial/state') {
      const origin = request.headers.get('Origin');
      if (origin && origin !== ALLOWED_ORIGIN) return json({ error: 'Origin not allowed' }, 403);
      if (request.method === 'OPTIONS') {
        if (origin !== ALLOWED_ORIGIN) return json({ error: 'Origin not allowed' }, 403);
        return new Response(null, {
          status: 204,
          headers: responseHeaders({
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            Vary: 'Origin',
          }),
        });
      }
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, true);
      try {
        return json(await readState(env), 200, true);
      } catch (error) {
        return json({ error: error.message === 'Missing TS_WYSIWYG_KV' ? error.message : 'Unable to read trial state' }, 500, true);
      }
    }

    if (!['/cwb-trial/admin', '/cwb-trial/admin/state', '/cwb-trial/admin/save'].includes(url.pathname)) {
      return json({ error: 'Not found' }, 404);
    }
    if (!(await verifyAccessJwt(request, env))) return json({ error: 'Cloudflare Access authentication required' }, 401);

    try {
      if (url.pathname === '/cwb-trial/admin' && request.method === 'GET') {
        return await handleAdminPage(env);
      }
      if (url.pathname === '/cwb-trial/admin/state' && request.method === 'GET') {
        const state = await readState(env);
        const expiry = getExpiry(env);
        const adminState = { ...state, fields: fieldsWithDefaults(state.fields) };
        return json(expiry ? { ...adminState, expiresAt: expiry.iso } : adminState);
      }
      if (url.pathname === '/cwb-trial/admin/save' && request.method === 'POST') {
        if (request.headers.get('Origin') !== 'https://wysiwyg.techsites.ai') {
          return json({ error: 'Origin not allowed' }, 403);
        }
        return await handleSave(request, env);
      }
      return json({ error: 'Method not allowed' }, 405);
    } catch (error) {
      return json({ error: error.message === 'Invalid TRIAL_EXPIRES_AT configuration'
        ? error.message
        : 'Unable to process trial editor request' }, 500);
    }
  },
};