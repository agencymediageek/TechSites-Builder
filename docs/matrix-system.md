# TechSites Builder — 6x6x6 Design Matrix System

## Overview

The Design Matrix is the core intellectual property of TechSites Builder. It transforms a single license key into a deterministic, unique website structure — without any database queries, randomness, or AI calls at render time.

**Result:** 6⁶ = **46,656 unique site combinations** from 36 HTML blocks.

---

## Mathematical Foundation

### Seed Generation

```javascript
/**
 * Converts a license key into a 6-element base-6 array.
 * Deterministic: same key always produces same indices.
 * 
 * @param {string} licenseKey - e.g. "TS-A3F9-B2K1-9XZ4"
 * @returns {number[]} - e.g. [2, 5, 1, 4, 0, 3]
 */
function getSiteMatrixIndices(licenseKey) {
  // 1. Hash the key to a stable 32-bit integer
  let hash = 0;
  for (let i = 0; i < licenseKey.length; i++) {
    const char = licenseKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  
  // 2. Ensure positive
  hash = Math.abs(hash);
  
  // 3. Extract 6 base-6 digits
  const indices = [];
  let remaining = hash;
  for (let i = 0; i < 6; i++) {
    indices.push(remaining % 6);
    remaining = Math.floor(remaining / 6);
  }
  
  return indices; // [menu_idx, home_idx, about_idx, howto_idx, contact_idx, footer_idx]
}
```

### Index → Component Mapping

| Position | Section | Maps to | Values |
|----------|---------|---------|--------|
| `indices[0]` | Navigation/Menu | `components/menus/menu-{n}.html` | 0-5 |
| `indices[1]` | Hero/Home | `components/homes/home-{n}.html` | 0-5 |
| `indices[2]` | About/Story | `components/abouts/about-{n}.html` | 0-5 |
| `indices[3]` | How It Works | `components/howtos/howto-{n}.html` | 0-5 |
| `indices[4]` | Contact/CTA | `components/contacts/contact-{n}.html` | 0-5 |
| `indices[5]` | Footer | `components/footers/footer-{n}.html` | 0-5 |

### Example

```javascript
getSiteMatrixIndices("TS-A3F9-B2K1-9XZ4")
// → [2, 5, 1, 4, 0, 3]

// Resulting assembly:
// <nav>     = components/menus/menu-2.html   (Sticky dark, hamburger mobile)
// <main>    = components/homes/home-5.html   (Split-screen, video bg right)
// <section> = components/abouts/about-1.html (Timeline layout, founder photo left)
// <section> = components/howtos/howto-4.html (Numbered steps, icon cards)
// <section> = components/contacts/contact-0.html (Full-width map + form)
// <footer>  = components/footers/footer-3.html (3-column, social, newsletter)
```

---

## Component Specifications

### Menu Variants (0-5)

| Variant | Style | Mobile | Features |
|---------|-------|--------|---------|
| 0 | Transparent top, scrolls to solid | Hamburger slide-out | CTA button right |
| 1 | Centered logo, links split left/right | Bottom tab bar | Minimal, clean |
| 2 | Sticky dark with blur backdrop | Hamburger, overlay | Logo + CTA |
| 3 | Side drawer (always visible desktop) | Burger → full-screen | Multi-level nav |
| 4 | Mega-menu on hover, elegant | Off-canvas | Category grouping |
| 5 | Top bar announcement + main nav | Collapsible | Sale/promo aware |

### Home/Hero Variants (0-5)

| Variant | Layout | Background | CTA Style |
|---------|--------|-----------|----------|
| 0 | Centered text, full-height | Gradient + particle dots | Two buttons (primary + ghost) |
| 1 | Left text, right image/mockup | White/light | One primary CTA + trust badges |
| 2 | Full-screen image/video overlay | Dark with tint | Centered, large |
| 3 | Split screen 50/50 | Contrasting halves | Inline CTA + scroll arrow |
| 4 | Text left, animated illustration right | Light/white | CTA + email capture |
| 5 | Full-bleed video background | Video + dark overlay | Minimal text, large CTA |

### About Variants (0-5)

| Variant | Layout | Key Element |
|---------|--------|------------|
| 0 | Story text + stats bar | Key numbers (years, clients, etc.) |
| 1 | Timeline vertical | Milestone events |
| 2 | Founder photo left + bio right | Personal trust |
| 3 | Mission/Vision/Values 3 cards | Corporate |
| 4 | Before/After comparison | Transformation story |
| 5 | Team grid with hover bios | People-first |

### HowTo Variants (0-5)

| Variant | Style |
|---------|-------|
| 0 | 3-step horizontal with icons |
| 1 | Numbered vertical list with descriptions |
| 2 | Alternating icon + text rows |
| 3 | Tabs/accordion (FAQ style) |
| 4 | Interactive stepper with progress |
| 5 | Video embed + text steps |

### Contact Variants (0-5)

| Variant | Style |
|---------|-------|
| 0 | Full-width map left + form right |
| 1 | Centered form, clean white card |
| 2 | Split: info left, form right |
| 3 | Floating card over hero image |
| 4 | Multi-step form wizard |
| 5 | WhatsApp/social CTA + email form |

### Footer Variants (0-5)

| Variant | Columns | Features |
|---------|---------|---------|
| 0 | 2 columns | Logo + links + copyright |
| 1 | 3 columns | Links + contact + social |
| 2 | 4 columns | Full sitemap |
| 3 | Logo centered + links row | Minimal |
| 4 | Dark with newsletter signup | Email capture |
| 5 | Mega footer with map | Full info |

---

## HTML Block Structure

Every HTML block follows these conventions:

```html
<!-- components/homes/home-2.html -->
<!-- 
  BLOCK: home-2
  STYLE: Full-screen image/video overlay, centered text
  NICHE: All (universal)
  DEPS: None (self-contained)
-->
<section id="home" class="ts-home ts-home--overlay" data-block="home-2">
  
  <!-- Background (replaced by WYSIWYG or content KV) -->
  <div class="ts-home__bg">
    <img 
      src="[hero_image_url]" 
      alt="[hero_image_alt]"
      data-editable="hero_image"
      data-editable-type="image"
    />
    <div class="ts-home__overlay"></div>
  </div>
  
  <!-- Content (editable via WYSIWYG) -->
  <div class="ts-home__content">
    <h1 class="ts-home__title" data-editable="hero_title">
      [hero_title]
    </h1>
    <p class="ts-home__subtitle" data-editable="hero_subtitle">
      [hero_subtitle]
    </p>
    <a href="#contact" class="ts-btn ts-btn--primary" data-editable="hero_cta">
      [hero_cta]
    </a>
  </div>
  
</section>
```

### Data Attribute Conventions

| Attribute | Purpose | Values |
|-----------|---------|--------|
| `data-block` | Identifies this block type | `home-2`, `menu-0`, etc. |
| `data-editable` | Marks a field as editable | Unique field ID (snake_case) |
| `data-editable-type` | How the field is edited | `text`, `image`, `link`, `html`, `color` |
| `data-editable-label` | Human label in editor UI | `"Hero Title"`, `"Button Text"` |

### CSS Class Conventions (BEM)

```
ts-{block}                — block root
ts-{block}--{modifier}    — block modifier (variant, state)
ts-{block}__{element}     — element within block
```

All colors, fonts, spacing use CSS custom properties:
```css
.ts-home__title {
  color: var(--color-text-inverse);
  font-family: var(--font-headers);
  font-size: clamp(2rem, 5vw, 4rem);
  border-radius: var(--radius-global);
}
```

**Never** use hardcoded color values in block HTML. All visual properties must come from CSS tokens.

---

## Worker Assembly Code

```javascript
// In techsites-hub-production Worker

async function assembleClientSite(domain, env) {
  // 1. Load site config from KV
  const siteConfig = await env.TS_SITES_KV.get(`site:${domain}`, 'json');
  if (!siteConfig) return new Response('Site not found', { status: 404 });
  
  const { seed, niche, content } = siteConfig;
  
  // 2. Block names from seed
  const blockNames = [
    `menus/menu-${seed[0]}`,
    `homes/home-${seed[1]}`,
    `abouts/about-${seed[2]}`,
    `howtos/howto-${seed[3]}`,
    `contacts/contact-${seed[4]}`,
    `footers/footer-${seed[5]}`,
  ];
  
  // 3. Fetch all blocks + tokens in parallel
  const [shell, tokens, ...blocks] = await Promise.all([
    env.TS_SITES_KV.get('template:shell'),
    env.TS_SITES_KV.get(`tokens:${niche}`),
    ...blockNames.map(name => env.TS_SITES_KV.get(`block:${name}`)),
  ]);
  
  // 4. Inject content placeholders → actual content
  const hydratedBlocks = blocks.map(block => 
    block.replace(/\[(\w+)\]/g, (_, key) => content[key] || '')
  );
  
  // 5. Assemble full HTML
  const fullHtml = shell
    .replace('<!-- TOKENS -->', `<style>${tokens}</style>`)
    .replace('<!-- MENU -->', hydratedBlocks[0])
    .replace('<!-- HOME -->', hydratedBlocks[1])
    .replace('<!-- ABOUT -->', hydratedBlocks[2])
    .replace('<!-- HOWTO -->', hydratedBlocks[3])
    .replace('<!-- CONTACT -->', hydratedBlocks[4])
    .replace('<!-- FOOTER -->', hydratedBlocks[5]);
  
  return new Response(fullHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-TechSites-Seed': seed.join(','),
      'X-TechSites-Niche': niche,
    },
  });
}
```

---

## Uniqueness Guarantee

For any two license keys A and B:
- P(A produces same combination as B) = 1/46,656 ≈ 0.002%
- With 1,000 clients: expected duplicate pairs ≈ 10 (negligible, different niches make visual identity unique anyway)
- With niche tokens applied: visual identity is unique even for same structural seed (different colors/fonts)
- Combined uniqueness: 46,656 structures × 12 niches = **559,872 visually distinct sites**

---

## Future: 12x12x12 Matrix (Phase 2)

When 12 variants per component are built:
- 12⁶ = **2,985,984 unique combinations**
- With 12 niches: **35,831,808 visually distinct sites**
- Target: Year 2 milestone
