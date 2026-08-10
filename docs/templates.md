# TechSites Builder — Template Audit & Component Inventory

## Current Template Portfolio (August 2026)

5 production templates deployed on Cloudflare Pages, representing the source material for the 6x6x6 matrix components.

---

## Template 1: Directory Master (Dubai Coffee Guide)

**URL:** `directory-template-master.pages.dev`  
**Niche:** Local Directory / Business Listings  
**Design System:** Dark premium, editorial

### Visual Identity
- **Background:** Deep charcoal `#1A1A1A` / Pure black `#0D0D0D`
- **Accent:** Luxury gold `#D4AF37` + amber `#F59E0B`
- **Typography:** `Cormorant Garamond` (headers) + `Raleway` (body)
- **Special elements:** Sponsored Amazon listing cards, star ratings, map integration

### Key Sections
| Section | Description | Reusable as block? |
|---------|-------------|-------------------|
| Hero | Full-screen dark hero + search bar overlay | `home-2` variant |
| Filter Bar | Category tabs + city selector | Unique to directory |
| Listing Cards | Business cards with rating, address, photos | `about-5` (team grid variant) |
| Sponsored Listings | Amazon affiliate cards with yellow badge | Directory-specific |
| Interactive Map | Leaflet/Mapbox integration | `contact-0` variant |
| Footer | 3-column dark footer | `footer-1` |

### Performance
- Lighthouse: 91/100 (images not lazy-loaded yet)
- LCP: 1.2s
- No JavaScript frameworks

---

## Template 2: One-Page Café (Brunch & Cake)

**URL:** `template-master-onepage.pages.dev`  
**Niche:** Food & Beverage / Casual Dining  
**Design System:** Warm, minimal, earthy

### Visual Identity
- **Background:** Warm off-white `#FFF8F0` + cream `#FAF0E6`
- **Primary:** Warm brown `#8B4513` / Terracotta `#C17F59`
- **Accent:** Orange `#FF8C42`
- **Typography:** `Poppins` (headers) + `Lato` (body)
- **Character:** Artisanal, handcrafted feeling

### Key Sections
| Section | Description | Matrix block |
|---------|-------------|-------------|
| Nav | Minimal transparent → solid on scroll | `menu-0` |
| Hero | Split screen: large food photo right, tagline left | `home-1` variant |
| About | Story text + 3 value pills | `about-0` |
| Menu Preview | 4-item card grid with prices | `howto-0` (adapted) |
| Gallery | 3-column masonry photos | Special — not in matrix |
| Contact | Centered form + opening hours | `contact-1` |
| Footer | Minimal 2-column | `footer-0` |

---

## Template 3: Restaurante Italiano (Forno & Co)

**URL:** `restaurant-cafe.pages.dev`  
**Niche:** Restaurant / Upscale Dining  
**Design System:** Classic Italian, dark, warm

### Visual Identity
- **Background:** Dark linen `#2C1A0E` / Warm black `#1A0F0A`
- **Primary:** Deep red `#8B0000` / Crimson `#DC143C`
- **Accent:** Warm gold `#D4AF37`
- **Typography:** `Playfair Display` (headers) + `Lato` (body)
- **Special:** Reservation widget (OpenTable-style)

### Key Sections
| Section | Description | Matrix block |
|---------|-------------|-------------|
| Nav | Dark sticky, centered logo, white links | `menu-1` variant |
| Hero | Full-screen video background + CTA | `home-5` |
| About | Left text, right chef photo | `about-2` (founder variant) |
| Menu | 3-tab menu (Starters/Mains/Desserts) | `howto-3` (tabs) |
| Reservations | Widget with calendar date picker | `contact-4` (multi-step) |
| Testimonials | Horizontal scroll quote cards | Part of `home-5` |
| Footer | Dark 3-column | `footer-1` |

---

## Template 4: Coach / Consultant (AurumCoach)

**URL:** `coach-consultant.pages.dev`  
**Niche:** Professional Services / Coaching / B2B  
**Design System:** Executive, teal accent, clean white

### Visual Identity
- **Background:** Pure white `#FFFFFF` + light gray `#F8FAFB`
- **Primary:** Executive teal `#00A896` / Dark navy `#0F4C81`
- **Accent:** Gold `#C9A84C`
- **Typography:** `Plus Jakarta Sans` (headers) + `Inter` (body)
- **Special:** Category filter search (all coaching specialties)

### Key Sections
| Section | Description | Matrix block |
|---------|-------------|-------------|
| Nav | White sticky, logo left, CTA right | `menu-0` variant |
| Hero | Centered, large type, trust badges below | `home-0` |
| Filter Search | Specialty filter pills (Leadership, Sales, etc.) | Special |
| Services | 3-column card grid with icons | `howto-0` (3-step adapted) |
| About | Founder bio + credentials | `about-2` |
| Testimonials | 2-column testimonial cards | `about-4` (before/after adapted) |
| Contact | Split form | `contact-2` |
| Footer | Clean 4-column | `footer-2` |

---

## Template 5: Café Premium (Mokha 1450) — WITH WYSIWYG ✅

**URL:** `cafe-model.pages.dev`  
**Niche:** Specialty Café / Coffee Shop  
**Design System:** Warm beige, terracotta, editorial  
**Special:** Only template with WYSIWYG editor active

### Visual Identity
- **Background:** Warm beige `#F5F0E8` / Linen `#FAF6EE`
- **Primary:** Deep espresso `#3D1C02` / Dark brown `#2C1A0E`
- **Accent:** Terracotta `#C4622D` / Warm orange `#E07B39`
- **Typography:** `Cormorant Garamond` (headers) + `Lato` (body)
- **Character:** Ethiopian/Middle Eastern specialty coffee culture

### WYSIWYG Integration
- **Worker:** `mokha-wysiwyg-standalone-api` (will migrate to `wysiwyg-universal`)
- **Floating button:** Bottom-right, terracotta circle with ✏️ icon
- **Fields:** hero_title, hero_subtitle, hero_cta, about_text, tagline, phone, address, hours
- **Persistence:** Cloudflare KV, per-page state

### Key Sections
| Section | Description | Matrix block | WYSIWYG fields |
|---------|-------------|-------------|----------------|
| Nav | Transparent, logo centered, sticky | `menu-1` | logo_url, nav_cta |
| Hero | Full-screen warm photo + overlay | `home-2` | hero_title, hero_subtitle, hero_cta, hero_image |
| About | Story text + coffee origin | `about-0` | about_title, about_text |
| Process | 4 steps: Source → Roast → Brew → Serve | `howto-1` | step_1..4_title, step_1..4_text |
| Menu Preview | Grid 4 items | `howto-0` adapted | menu_item_1..4 |
| Contact | Map + form + hours | `contact-0` | address, phone, hours, map_embed |
| Footer | 2-column minimal | `footer-0` | social links |

---

## Component Matrix — Current Status

### ✅ Components derived from existing templates

| Block | Variant | Source Template | Status |
|-------|---------|----------------|--------|
| menu-0 | Transparent → solid on scroll | Coach, One-Page | Extract needed |
| menu-1 | Sticky dark, centered logo | Mokha, Restaurant | Extract needed |
| home-0 | Centered hero, trust badges | Coach | Extract needed |
| home-1 | Split screen L/R | One-Page | Extract needed |
| home-2 | Full-screen overlay | Mokha | Extract needed |
| home-5 | Full-screen video BG | Restaurant | Extract needed |
| about-0 | Story + stats | One-Page, Mokha | Extract needed |
| about-2 | Founder photo L + bio R | Restaurant, Coach | Extract needed |
| howto-0 | 3-step horizontal icons | Coach | Extract needed |
| howto-1 | Numbered vertical list | Mokha | Extract needed |
| howto-3 | Tabs/accordion | Restaurant | Extract needed |
| contact-0 | Map + form | Directory, Mokha | Extract needed |
| contact-1 | Centered form card | One-Page | Extract needed |
| contact-2 | Split info + form | Coach | Extract needed |
| footer-0 | Minimal 2-column | Mokha, One-Page | Extract needed |
| footer-1 | 3-column dark | Directory, Restaurant | Extract needed |
| footer-2 | 4-column full | Coach | Extract needed |

### ⬜ Components to create (no template source yet)

| Block | Description | Priority |
|-------|-------------|---------|
| menu-2..5 | 4 more nav variants | High |
| home-3, home-4 | More hero layouts | High |
| about-1, 3, 4, 5 | Timeline, values, before/after, team | Medium |
| howto-2, 4, 5 | Alternating, interactive, video | Medium |
| contact-3, 4, 5 | Floating card, multi-step, WhatsApp | Medium |
| footer-3, 4, 5 | More footer styles | Low |

---

## Extraction Process (per template)

To create a reusable block from an existing template section:

1. **Copy the section HTML** from the template
2. **Replace all hardcoded values** with `[placeholder]` tokens
3. **Replace all hardcoded colors** with CSS custom properties (`var(--color-primary)`, etc.)
4. **Replace all hardcoded fonts** with `var(--font-headers)`, `var(--font-body)`
5. **Add `data-block="name-variant"`** to the root element
6. **Add `data-editable="field_id"`** to all text, images, links
7. **Test with base.css tokens** (should look correct with any niche)
8. **Test with all 12 niche token files** (should remain beautiful)
9. **Save to `components/{section}/name-variant.html`**
