/**
 * editor-client.js — TechSites Builder WYSIWYG Editor Client
 *
 * Injected into every client site by the Hub Worker.
 * Self-contained, zero dependencies, ~8KB gzipped.
 *
 * Usage: included automatically when Hub serves a client site.
 * Manual: <script src="https://wysiwyg.techsites.ai/editor-client.js"></script>
 *
 * @version 2.0.0
 */

(function (global) {
  'use strict';

  const WYSIWYG_BASE = 'https://wysiwyg.techsites.ai';

  // Read site key from meta tag: <meta name="ts-site-key" content="...">
  const SITE_KEY = document.querySelector('meta[name="ts-site-key"]')?.content;
  const PAGE = window.location.pathname.replace(/^\//, '') || 'index.html';

  if (!SITE_KEY) {
    console.debug('[TechSites Editor] No site key found — editor disabled');
    return;
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  let editMode = false;
  let pendingChanges = {};
  let saveTimer = null;
  let initialized = false;
  let floatBtn = null;
  let toolbar = null;

  // ─── Styles ────────────────────────────────────────────────────────────────
  const STYLES = `
    #ts-float-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--color-primary, #6C3FC5);
      color: white; border: none; cursor: pointer;
      font-size: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.30);
      z-index: 2147483646; transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    }
    #ts-float-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.35); }
    #ts-float-btn.active { background: #16a34a; }

    #ts-editor-toolbar {
      position: fixed; top: 0; left: 0; right: 0;
      background: rgba(10, 10, 20, 0.96);
      backdrop-filter: blur(12px);
      color: white; padding: 10px 20px;
      display: none; align-items: center; gap: 12px;
      z-index: 2147483647; font-family: system-ui, sans-serif;
      font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 2px 20px rgba(0,0,0,0.40);
    }
    #ts-editor-toolbar.visible { display: flex; }
    #ts-editor-toolbar .ts-tb-logo {
      font-weight: 700; font-size: 14px; letter-spacing: -0.3px;
      color: var(--color-primary, #6C3FC5);
      flex-shrink: 0;
    }
    #ts-editor-toolbar .ts-tb-status {
      font-size: 12px; color: rgba(255,255,255,0.60);
      margin-left: 4px;
    }
    #ts-editor-toolbar .ts-tb-status.saving { color: #facc15; }
    #ts-editor-toolbar .ts-tb-status.saved { color: #4ade80; }
    #ts-editor-toolbar .ts-tb-btn {
      padding: 6px 14px; border-radius: 6px; border: none;
      cursor: pointer; font-size: 12px; font-weight: 600;
      transition: background 0.15s;
    }
    #ts-editor-toolbar .ts-tb-save {
      background: var(--color-primary, #6C3FC5); color: white;
    }
    #ts-editor-toolbar .ts-tb-save:hover { opacity: 0.85; }
    #ts-editor-toolbar .ts-tb-exit {
      background: rgba(255,255,255,0.10); color: white; margin-left: auto;
    }
    #ts-editor-toolbar .ts-tb-exit:hover { background: rgba(255,255,255,0.18); }
    #ts-editor-toolbar .ts-tb-page {
      color: rgba(255,255,255,0.40); font-size: 11px;
      margin-left: auto;
    }

    [data-editable][contenteditable="true"] {
      outline: 2px dashed var(--color-primary, #6C3FC5) !important;
      outline-offset: 3px;
      border-radius: 3px;
      transition: outline 0.15s;
      cursor: text;
    }
    [data-editable][contenteditable="true"]:hover,
    [data-editable][contenteditable="true"]:focus {
      outline-color: #4ade80 !important;
      outline-style: solid !important;
    }
    [data-editable-type="image"] {
      outline: 2px dashed var(--color-primary, #6C3FC5);
      outline-offset: 3px;
      cursor: pointer;
      border-radius: 3px;
    }
    [data-editable-type="link"] {
      outline: 2px dashed #f97316;
      outline-offset: 3px;
      cursor: pointer;
      border-radius: 3px;
    }
    .ts-img-overlay {
      position: absolute; inset: 0;
      background: rgba(108,63,197,0.25);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
      border-radius: inherit; pointer-events: none;
      font-size: 28px;
    }
    [data-editable-type="image"]:hover .ts-img-overlay { opacity: 1; }
    .ts-link-dialog {
      position: fixed; inset: 0; background: rgba(0,0,0,0.70);
      display: flex; align-items: center; justify-content: center;
      z-index: 2147483647;
    }
    .ts-link-dialog-box {
      background: #1a1a2e; border-radius: 12px; padding: 24px;
      width: min(480px, 90vw); color: white;
    }
    .ts-link-dialog-box h4 { margin: 0 0 16px; font-size: 16px; }
    .ts-link-dialog-box input {
      width: 100%; padding: 10px 12px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.20);
      background: rgba(255,255,255,0.08); color: white;
      font-size: 14px; box-sizing: border-box;
    }
    .ts-link-dialog-box .ts-link-btns {
      display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;
    }
    .ts-link-dialog-box button {
      padding: 8px 16px; border-radius: 6px; border: none;
      cursor: pointer; font-size: 13px; font-weight: 600;
    }
    .ts-link-dialog-box .cancel { background: rgba(255,255,255,0.10); color: white; }
    .ts-link-dialog-box .confirm { background: var(--color-primary, #6C3FC5); color: white; }
  `;

  // ─── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (initialized) return;
    initialized = true;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    // Create toolbar
    toolbar = document.createElement('div');
    toolbar.id = 'ts-editor-toolbar';
    toolbar.innerHTML = `
      <span class="ts-tb-logo">✏️ TechSites Editor</span>
      <span class="ts-tb-status" id="ts-status">Edit mode active</span>
      <button class="ts-tb-btn ts-tb-save" id="ts-save-btn">💾 Save</button>
      <button class="ts-tb-btn ts-tb-exit" id="ts-exit-btn">✕ Exit</button>
      <span class="ts-tb-page">${PAGE}</span>
    `;
    document.body.appendChild(toolbar);

    // Create float button
    floatBtn = document.createElement('button');
    floatBtn.id = 'ts-float-btn';
    floatBtn.title = 'Edit this page';
    floatBtn.textContent = '✏️';
    floatBtn.addEventListener('click', toggleEditMode);
    document.body.appendChild(floatBtn);

    // Bind toolbar buttons
    document.getElementById('ts-save-btn').addEventListener('click', saveNow);
    document.getElementById('ts-exit-btn').addEventListener('click', exitEditMode);

    // Load saved state to display
    loadState().catch(() => {});
  }

  // ─── Toggle Edit Mode ───────────────────────────────────────────────────────
  async function toggleEditMode() {
    if (editMode) {
      await exitEditMode();
    } else {
      await enterEditMode();
    }
  }

  async function enterEditMode() {
    editMode = true;
    floatBtn.classList.add('active');
    floatBtn.textContent = '💾';
    toolbar.classList.add('visible');
    enableEditing();
    await loadState();
  }

  async function exitEditMode() {
    await saveNow();
    editMode = false;
    floatBtn.classList.remove('active');
    floatBtn.textContent = '✏️';
    toolbar.classList.remove('visible');
    disableEditing();
  }

  // ─── Load State ─────────────────────────────────────────────────────────────
  async function loadState() {
    try {
      const res = await fetch(`${WYSIWYG_BASE}/state?page=${encodeURIComponent(PAGE)}`, {
        headers: { 'X-Site-Key': SITE_KEY },
      });
      if (!res.ok) return;
      const { fields } = await res.json();
      applyFields(fields);
    } catch (err) {
      console.debug('[TechSites Editor] Load failed:', err.message);
    }
  }

  function applyFields(fields) {
    if (!fields?.length) return;
    fields.forEach(({ id, value }) => {
      const el = document.querySelector(`[data-editable="${id}"]`);
      if (!el) return;
      const type = el.dataset.editableType || 'text';
      if (type === 'text') el.textContent = value;
      else if (type === 'html') el.innerHTML = value;
      else if (type === 'image') el.src = value;
      else if (type === 'link') el.href = value;
      else if (type === 'color') el.style.color = value;
      else if (type === 'bg') el.style.background = value;
    });
  }

  // ─── Enable / Disable Editing ───────────────────────────────────────────────
  function enableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      const type = el.dataset.editableType || 'text';

      if (type === 'text' || type === 'html') {
        el.contentEditable = 'true';
        el.spellcheck = true;
        el.addEventListener('input', onFieldChange);
        el.addEventListener('paste', onPaste);
      } else if (type === 'image') {
        el.style.position = 'relative';
        addImageOverlay(el);
        el.addEventListener('click', onImageClick);
      } else if (type === 'link') {
        el.addEventListener('dblclick', onLinkClick);
      }
    });
  }

  function disableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      const type = el.dataset.editableType || 'text';
      if (type === 'text' || type === 'html') {
        el.contentEditable = 'false';
        el.removeEventListener('input', onFieldChange);
        el.removeEventListener('paste', onPaste);
      } else if (type === 'image') {
        el.removeEventListener('click', onImageClick);
      } else if (type === 'link') {
        el.removeEventListener('dblclick', onLinkClick);
      }
    });
    pendingChanges = {};
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────
  function onFieldChange(e) {
    const id = e.target.dataset.editable;
    const type = e.target.dataset.editableType || 'text';
    pendingChanges[id] = type === 'html' ? e.target.innerHTML : e.target.textContent;
    setStatus('saving');
    scheduleAutoSave();
  }

  function onPaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  function onImageClick(e) {
    e.preventDefault();
    const el = e.currentTarget;
    const id = el.dataset.editable;
    const label = el.dataset.editableLabel || 'image';
    const current = el.src || '';

    showDialog(`Update ${label}`, current, 'https://...', (newUrl) => {
      if (newUrl && newUrl !== current) {
        el.src = newUrl;
        pendingChanges[id] = newUrl;
        setStatus('saving');
        scheduleAutoSave();
      }
    });
  }

  function onLinkClick(e) {
    e.preventDefault();
    const el = e.currentTarget;
    const id = el.dataset.editable;
    const current = el.href || '';

    showDialog('Update link URL', current, 'https://...', (newUrl) => {
      if (newUrl !== null) {
        el.href = newUrl;
        pendingChanges[id] = newUrl;
        setStatus('saving');
        scheduleAutoSave();
      }
    });
  }

  // ─── Image Overlay ───────────────────────────────────────────────────────────
  function addImageOverlay(el) {
    if (el.parentElement.style.position !== 'relative') {
      el.parentElement.style.position = 'relative';
    }
    const overlay = document.createElement('div');
    overlay.className = 'ts-img-overlay';
    overlay.textContent = '🖼️';
    el.parentElement.appendChild(overlay);
  }

  // ─── Dialog ─────────────────────────────────────────────────────────────────
  function showDialog(title, current, placeholder, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'ts-link-dialog';
    overlay.innerHTML = `
      <div class="ts-link-dialog-box">
        <h4>${title}</h4>
        <input type="url" value="${current}" placeholder="${placeholder}" />
        <div class="ts-link-btns">
          <button class="cancel">Cancel</button>
          <button class="confirm">Update</button>
        </div>
      </div>
    `;

    const input = overlay.querySelector('input');
    overlay.querySelector('.cancel').onclick = () => overlay.remove();
    overlay.querySelector('.confirm').onclick = () => {
      onConfirm(input.value.trim());
      overlay.remove();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { onConfirm(input.value.trim()); overlay.remove(); }
      if (e.key === 'Escape') overlay.remove();
    });

    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 50);
  }

  // ─── Auto-Save ───────────────────────────────────────────────────────────────
  function scheduleAutoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 2000);
  }

  async function saveNow() {
    if (Object.keys(pendingChanges).length === 0) {
      setStatus('Edit mode active');
      return;
    }

    setStatus('Saving...');
    const fields = Object.entries(pendingChanges).map(([id, value]) => ({ id, value }));
    const snapshot = { ...pendingChanges };

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
        // Clear only successfully saved changes
        Object.keys(snapshot).forEach(k => {
          if (pendingChanges[k] === snapshot[k]) delete pendingChanges[k];
        });
        setStatus('saved');
        setTimeout(() => setStatus('Edit mode active'), 2000);
      } else {
        setStatus('Save failed — will retry');
        scheduleAutoSave();
      }
    } catch {
      setStatus('Offline — changes queued');
      scheduleAutoSave();
    }
  }

  // ─── Status ──────────────────────────────────────────────────────────────────
  function setStatus(msg) {
    const el = document.getElementById('ts-status');
    if (!el) return;
    el.textContent = msg === 'saved' ? '✅ Saved' :
                     msg === 'saving' ? '⏳ Saving...' : msg;
    el.className = 'ts-tb-status ' + (
      msg === 'saved' ? 'saved' :
      msg === 'saving' ? 'saving' : ''
    );
  }

  // ─── Start ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
