import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import { webcrypto } from 'node:crypto';

Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });

const sourcePath = fileURLToPath(new URL('./cwb-trial-gateway.js', import.meta.url));
const source = await readFile(sourcePath, 'utf8');
const gatewayUrl = `data:text/javascript,${encodeURIComponent(source)}`;
const { default: gateway } = await import(gatewayUrl);

const issuer = 'https://access.test.invalid';
const audience = 'test-audience';
const allowedOrigin = 'https://trial.cwb.site';
const adminOrigin = 'https://wysiwyg.techsites.ai';
const pageKey = 'dHJpYWwuY3diLnNpdGU:page:index.html';
const fieldIds = [
  'hero-title',
  'hero-lead',
  'dish-01-title',
  'dish-01-description',
  'dish-02-title',
  'dish-02-description',
  'dish-03-title',
  'dish-03-description',
];

const signingKeys = await webcrypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  true,
  ['sign', 'verify'],
);
const publicJwk = {
  ...(await webcrypto.subtle.exportKey('jwk', signingKeys.publicKey)),
  kid: 'test-key',
  alg: 'RS256',
  use: 'sig',
};
const previousFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  assert.equal(String(url), `${issuer}/cdn-cgi/access/certs`, 'only mocked JWKS requests are allowed');
  return new Response(JSON.stringify({ keys: [publicJwk] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
after(() => {
  globalThis.fetch = previousFetch;
});

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function makeAccessToken() {
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: issuer,
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 300,
  }));
  const signingInput = `${header}.${claims}`;
  const signature = await webcrypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signingKeys.privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${Buffer.from(signature).toString('base64url')}`;
}

class MapKV {
  constructor(backing) {
    this.backing = backing;
  }

  async get(key, type) {
    const value = this.backing.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.backing.set(key, value);
  }
}

function envFor(backing, extra = {}) {
  return {
    TS_WYSIWYG_KV: new MapKV(backing),
    ACCESS_ISSUER: issuer,
    ACCESS_AUD: audience,
    ...extra,
  };
}

async function call(path, { method = 'GET', headers = {}, body } = {}, env) {
  return gateway.fetch(new Request(`https://worker.test${path}`, {
    method,
    headers,
    body,
  }), env);
}

test('trial gateway public state, authenticated editing, and write protections', async () => {
  const backing = new Map();
  const env = envFor(backing);

  const initialResponse = await call('/cwb-trial/state', {
    headers: { Origin: allowedOrigin },
  }, env);
  assert.equal(initialResponse.status, 200);
  assert.equal(initialResponse.headers.get('Access-Control-Allow-Origin'), allowedOrigin);
  assert.equal(initialResponse.headers.get('Cache-Control'), 'no-store');
  const initialState = await initialResponse.json();
  assert.deepEqual(initialState.fields, [], 'public state stays sparse before an explicit save');
  assert.equal(initialState.updatedAt, null);
  assert.match(initialState.revision, /^initial-[a-f0-9]{64}$/);

  const preflight = await call('/cwb-trial/state', {
    method: 'OPTIONS',
    headers: { Origin: allowedOrigin },
  }, env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), allowedOrigin);
  assert.equal(preflight.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');

  const deniedResponse = await call('/cwb-trial/admin/state', {}, env);
  assert.equal(deniedResponse.status, 401);

  const accessToken = await makeAccessToken();
  const adminHeaders = { 'CF-Access-Jwt-Assertion': accessToken };
  const adminResponse = await call('/cwb-trial/admin/state', {
    headers: adminHeaders,
  }, env);
  assert.equal(adminResponse.status, 200);
  const adminState = await adminResponse.json();
  assert.deepEqual(adminState.fields.map(field => field.id), fieldIds);
  assert.equal(adminState.fields.length, 8);
  assert.equal(adminState.revision, initialState.revision);
  assert.equal(backing.has(pageKey), false, 'reading admin defaults does not persist them');

  const saveFields = adminState.fields;
  const saveResponse = await call('/cwb-trial/admin/save', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      Origin: adminOrigin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revision: initialState.revision, fields: saveFields }),
  }, env);
  assert.equal(saveResponse.status, 200);
  const saveResult = await saveResponse.json();
  assert.equal(saveResult.ok, true);
  assert.ok(saveResult.updatedAt);
  assert.ok(saveResult.revision);

  // Rebind the same backing map to simulate a fresh KV binding after reload.
  const reloadedEnv = envFor(backing);
  const persistedResponse = await call('/cwb-trial/state', {}, reloadedEnv);
  assert.equal(persistedResponse.status, 200);
  const persistedState = await persistedResponse.json();
  assert.deepEqual(persistedState.fields, saveFields);
  assert.equal(persistedState.revision, saveResult.revision);
  assert.equal(persistedState.updatedAt, saveResult.updatedAt);

  const staleFields = saveFields.map((field, index) => (
    index === 0 ? { ...field, value: 'A stale edit' } : field
  ));
  const staleResponse = await call('/cwb-trial/admin/save', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      Origin: adminOrigin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revision: initialState.revision, fields: staleFields }),
  }, reloadedEnv);
  assert.equal(staleResponse.status, 409);
  const stateAfterStale = await (await call('/cwb-trial/state', {}, reloadedEnv)).json();
  assert.deepEqual(stateAfterStale, persistedState, 'stale revision does not discard saved state');

  const htmlFields = saveFields.map((field, index) => (
    index === 0 ? { ...field, value: '<b>markup</b>' } : field
  ));
  const htmlResponse = await call('/cwb-trial/admin/save', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      Origin: adminOrigin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revision: saveResult.revision, fields: htmlFields }),
  }, reloadedEnv);
  assert.equal(htmlResponse.status, 400);
  assert.match((await htmlResponse.json()).error, /HTML and markup/);
  assert.deepEqual(
    await (await call('/cwb-trial/state', {}, reloadedEnv)).json(),
    persistedState,
    'rejected markup does not alter persisted state',
  );

  const expiredEnv = envFor(backing, { TRIAL_EXPIRES_AT: '2000-01-01T00:00:00.000Z' });
  const expiredResponse = await call('/cwb-trial/admin/save', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      Origin: adminOrigin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revision: saveResult.revision, fields: saveFields }),
  }, expiredEnv);
  assert.equal(expiredResponse.status, 410);
  assert.deepEqual(
    await (await call('/cwb-trial/state', {}, reloadedEnv)).json(),
    persistedState,
    'expired trial blocks writes without changing state',
  );
});