# TechSites Builder — Product Vision

## The Problem We're Solving

**The biggest pain on the internet is building a perfect website.**

- **WordPress:** Powers 43% of all websites but is responsible for 87% of all hacked CMS sites. Requires plugins for everything. Average site has 20+ plugins. Each plugin is a security liability, a performance drain, and a maintenance burden.
- **Wix/Squarespace/Hostinger:** Beautiful drag-and-drop, but every site looks identical. No differentiation. No real ownership.
- **AI generators (Framer AI, Wix ADI, etc.):** Generate generic layouts with hallucinated copy. No brand voice. No real business understanding.
- **Agencies:** Cost $5,000–$50,000+ per site. 4–12 week delivery. Client has zero editorial control after launch.

**The market:** 2.14 billion websites exist. 500,000 new ones are created daily. 95% are mediocre. The tools haven't fundamentally changed in 15 years.

---

## Our Solution: The Design Matrix

We've cracked a genuinely hard problem: **how to generate a unique, beautiful, high-converting website for any business in under 10 minutes, for under $50/month, with zero technical knowledge required.**

The answer is a 6x6x6 Design Matrix:
- **6 structural components** (navigation, hero, about, how-it-works, contact, footer)
- **6 variants** of each component (different layouts, visual styles, interaction patterns)
- **6^6 = 46,656 unique structural combinations**
- **× 12 niche design token sets** = **559,872 visually distinct sites**

Every site is:
1. **Structurally unique** — your license key deterministically generates your site's structure
2. **Visually branded** — niche-matched CSS tokens applied at the edge
3. **Copy-perfect** — APEX CORE AI generates business-specific copy from a 10-minute briefing
4. **Instantly editable** — floating WYSIWYG editor, no backend, no developer
5. **Blazing fast** — pure HTML served from Cloudflare edge in <10ms

---

## Competitive Positioning

### vs WordPress
| Dimension | WordPress | TechSites Builder |
|-----------|-----------|-------------------|
| Setup time | 2–8 hours | 10 minutes |
| Security | 87% of hacked CMSes | Zero CVEs (no PHP, no plugins) |
| Performance | 65–75 Lighthouse avg | 98/100 Lighthouse |
| Monthly cost | $20–200 (hosting + plugins) | $49/month (all-in) |
| Editing | Gutenberg (complex) | Floating inline editor |
| Updates | Manual plugin updates forever | Automatic (edge-served) |
| Unique design | Shared themes | 46,656+ unique combinations |

### vs Wix/Squarespace
| Dimension | Wix/Squarespace | TechSites Builder |
|-----------|-----------------|-------------------|
| AI copy | Basic/generic | APEX CORE (briefing-driven) |
| Uniqueness | Template shared by thousands | Unique to your license key |
| Performance | 60–80 Lighthouse | 98/100 Lighthouse |
| White-label | ❌ | ✅ (full reseller program) |
| API/integration | Limited | Full REST API + N8N automation |
| Data ownership | Platform lock-in | Export anytime, pure HTML |

### vs AI Generators (Framer AI, etc.)
| Dimension | AI Generators | TechSites Builder |
|-----------|---------------|-------------------|
| Copy quality | Hallucinated | Real briefing → APEX CORE |
| Structure | Random | Deterministic matrix |
| Editing | Re-generate (destructive) | Inline WYSIWYG (non-destructive) |
| Brand consistency | Poor | CSS token system |
| Speed | 30s–2min | <10ms (edge-served) |

---

## Revenue Model

### Direct B2C
| Plan | Price | Target |
|------|-------|--------|
| Starter | $29/month | Local business, 1 site |
| Pro | $79/month | Agency, 5 sites |
| Business | $149/month | Multi-location, 20 sites |
| Enterprise | $499/month | White-label reseller, unlimited |

### White-Label Reseller (B2B2C)
- Resellers purchase a reseller license ($999/year)
- Provision client sites under their own brand
- Revenue share: 70% reseller / 30% TechSites
- Target: marketing agencies, web design studios

### Embedded in SaaS Portfolio
TechSites Builder's site generation engine is embedded in:
- **WP TechSites** — WordPress client dashboard
- **APEX CORE** — AI meeting co-pilot (post-meeting: "build the site")
- **AI Suite** — Multi-tool platform (coming Q4 2026)
- **MediaGeek AI** — Creator platform (branded site for every creator)

---

## Market Opportunity

| Market | TAM | Notes |
|--------|-----|-------|
| Website builders | $13.8B (2026) | Growing 8.5% YoY |
| Web hosting | $94B (2026) | TechSites eliminates hosting costs |
| Web design services | $43B (2026) | We replace 90% of this work |
| **Combined addressable** | **~$150B** | **We compete on all 3** |

---

## 3-Year Roadmap

### Year 1 (2026) — Foundation
- [x] 5 template sets (directory, one-page, restaurant, coach, café)
- [x] WYSIWYG editor (per-site Workers)
- [ ] 36 HTML blocks (6 components × 6 variants)
- [ ] Universal WYSIWYG Worker (multi-tenant)
- [ ] 12-niche CSS token system
- [ ] Questions Card onboarding UI
- [ ] 1,000 paying clients

### Year 2 (2027) — Scale
- [ ] 12×12×12 matrix (2.9M combinations)
- [ ] White-label reseller portal
- [ ] Multilingual sites (auto-translated by AI)
- [ ] E-commerce blocks (product cards, cart, checkout)
- [ ] 10,000 paying clients
- [ ] Series A funding target

### Year 3 (2028) — Dominance
- [ ] Site analytics built-in (no Google Analytics needed)
- [ ] AI-powered A/B testing (auto-optimizes conversions)
- [ ] Marketplace: sell block packages
- [ ] 100,000 clients across 50 countries
- [ ] IPO readiness

---

## White-Label Integration Guide

TechSites Builder is designed to be embedded in any SaaS product:

```javascript
// Embed the Questions Card in your SaaS
<iframe 
  src="https://hub.techsites.ai/embed/questions-card?key=YOUR_RESELLER_KEY&locale=pt"
  width="100%" 
  height="600"
  frameborder="0"
/>

// Listen for completion event
window.addEventListener('message', (e) => {
  if (e.data.type === 'ts:site-ready') {
    const { siteUrl, domain, seed } = e.data;
    // Your SaaS now has a site URL for this client
  }
});
```

---

## Why We Win

1. **Speed:** 10 minutes to a live site. Competitors take days or weeks.
2. **Uniqueness:** 559,872 unique sites. No two clients get the same design.
3. **Performance:** 98/100 Lighthouse. 3× faster than WordPress average.
4. **Security:** Zero plugins = zero CVEs. Pure HTML is unhackable.
5. **Ecosystem:** Not just a builder — APEX CORE, WP TechSites, AI Suite all feed into it.
6. **White-label ready:** Agencies can resell under their brand from day one.
7. **Edge-native:** Built for Cloudflare's global network — not retrofitted.

---

*"We're not building a better WordPress. We're building the successor to the entire concept of how websites are made."*
— MediaGeek Agency, 2026
