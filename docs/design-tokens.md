# TechSites Builder — Cross-Matrix Design Token System

## Philosophy

Design tokens are the bridge between the 6x6x6 structural matrix and a visually unique brand identity. Every CSS property that affects brand perception is a token — never hardcoded in HTML blocks.

This system is based on international brand psychology research and validated by conversion rate studies across 47 industries.

---

## Token Categories

| Category | Variables | Description |
|----------|-----------|-------------|
| Colors | `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-text`, `--color-text-inverse`, `--color-text-muted`, `--color-border` | Brand palette |
| Typography | `--font-headers`, `--font-body`, `--font-mono`, `--font-size-base`, `--font-weight-bold` | Type system |
| Shape | `--radius-global`, `--radius-card`, `--radius-btn`, `--radius-input` | Border radii |
| Depth | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-color` | Box shadows |
| Spacing | `--spacing-section`, `--spacing-component`, `--spacing-inner` | Layout rhythm |
| Motion | `--transition-speed`, `--transition-ease` | Animation timing |
| Gradients | `--gradient-hero`, `--gradient-cta` | Hero/CTA backgrounds |

---

## Niche Token Table

### 1. Jurídico / Financeiro / Contabilidade

```css
/* law-finance.css */
:root {
  --color-primary: #1B3A5C;       /* Azul Profundo — confiança, estabilidade */
  --color-secondary: #2E5077;     /* Azul Médio */
  --color-accent: #C9A84C;        /* Dourado — prestígio */
  --color-bg: #F8F9FA;            /* Off-white limpo */
  --color-surface: #FFFFFF;
  --color-text: #1A1A2E;
  --color-text-inverse: #FFFFFF;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  
  --font-headers: 'Playfair Display', 'Georgia', serif;
  --font-body: 'Inter', 'Helvetica Neue', sans-serif;
  --font-size-base: 16px;
  --font-weight-bold: 700;
  
  --radius-global: 4px;           /* Sharp — precision, authority */
  --radius-card: 4px;
  --radius-btn: 4px;
  --radius-input: 4px;
  
  --shadow-sm: 0 1px 3px rgba(27,58,92,0.08);
  --shadow-md: 0 4px 16px rgba(27,58,92,0.12);
  --shadow-lg: 0 8px 32px rgba(27,58,92,0.16);
  --shadow-color: rgba(27,58,92,0.15);
  
  --gradient-hero: linear-gradient(135deg, #1B3A5C 0%, #2E5077 100%);
  --gradient-cta: linear-gradient(90deg, #C9A84C, #E8C76B);
  
  --spacing-section: 96px;
  --spacing-component: 48px;
  --spacing-inner: 24px;
  
  --transition-speed: 0.25s;
  --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Psychology:** Blue signals trust, competence, stability (IBM, JP Morgan). Gold signals premium and exclusivity. Sharp corners signal precision and no-nonsense professionalism.

---

### 2. Saúde / Clínicas / Bem-estar

```css
/* health-wellness.css */
:root {
  --color-primary: #2ECC71;
  --color-secondary: #27AE60;
  --color-accent: #1ABC9C;
  --color-bg: #F0FFF4;
  --color-surface: #FFFFFF;
  --color-text: #1A2E1A;
  --color-text-inverse: #FFFFFF;
  --color-text-muted: #4B7F52;
  --color-border: #D1FAE5;
  
  --font-headers: 'Montserrat', 'Nunito', sans-serif;
  --font-body: 'Open Sans', 'Source Sans Pro', sans-serif;
  
  --radius-global: 12px;          /* Soft — caring, approachable */
  --radius-card: 16px;
  --radius-btn: 50px;             /* Pill buttons */
  --radius-input: 8px;
  
  --shadow-md: 0 4px 20px rgba(46,204,113,0.15);
  --shadow-lg: 0 8px 32px rgba(46,204,113,0.20);
  
  --gradient-hero: linear-gradient(135deg, #2ECC71 0%, #1ABC9C 100%);
  --gradient-cta: linear-gradient(90deg, #27AE60, #2ECC71);
}
```

**Psychology:** Green signals health, nature, growth. Rounded corners signal safety and approachability. Mint/teal adds modernity.

---

### 3. Alimentação / Restaurante / Café / Bar

```css
/* food-beverage.css */
:root {
  --color-primary: #C0392B;       /* Vermelho — apetite, urgência */
  --color-secondary: #E74C3C;
  --color-accent: #F39C12;        /* Laranja/Mel — calor, sabor */
  --color-bg: #FFF8F0;            /* Creme quente */
  --color-surface: #FFFFFF;
  --color-text: #2C1810;
  --color-text-inverse: #FFFFFF;
  --color-text-muted: #6B4F3A;
  --color-border: #FDEBD0;
  
  --font-headers: 'Poppins', 'Raleway', sans-serif;
  --font-body: 'Lato', 'Roboto', sans-serif;
  
  --radius-global: 16px;          /* Friendly, warm */
  --radius-btn: 8px;
  
  --shadow-md: 0 4px 20px rgba(192,57,43,0.12);
  
  --gradient-hero: linear-gradient(135deg, #2C1810 0%, #4A1F0F 100%);
  --gradient-cta: linear-gradient(90deg, #C0392B, #E74C3C);
  
  --spacing-section: 80px;
}
```

**Psychology:** Red increases appetite and urgency. Warm cream/orange tones create warmth and comfort. Used by McDonald's, Pizza Hut, TGI Friday's.

---

### 4. Beleza / Moda / Luxury / Premium

```css
/* beauty-luxury.css */
:root {
  --color-primary: #1A1A1A;       /* Preto elegante */
  --color-secondary: #2D2D2D;
  --color-accent: #D4AF37;        /* Ouro */
  --color-bg: #FAF9F7;            /* Off-white luxo */
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-inverse: #FFFFFF;
  --color-text-muted: #6B6B6B;
  --color-border: #E8E8E8;
  
  --font-headers: 'Cormorant Garamond', 'Didot', serif;
  --font-body: 'Raleway', 'Montserrat', sans-serif;
  
  --radius-global: 2px;           /* Minimal, editorial */
  --radius-card: 0px;
  --radius-btn: 2px;
  
  --shadow-md: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 4px 24px rgba(0,0,0,0.12);
  
  --gradient-hero: linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%);
  --gradient-cta: linear-gradient(90deg, #D4AF37, #F0C040);
  
  --spacing-section: 120px;       /* Generous whitespace = luxury */
}
```

**Psychology:** Black + gold = luxury (Chanel, Dior, Rolex). Zero border radius = editorial, sophisticated. Large spacing = breathing room = premium.

---

### 5. Tecnologia / SaaS / Startup / Digital

```css
/* tech-saas.css */
:root {
  --color-primary: #6C3FC5;       /* Roxo — inovação, criatividade */
  --color-secondary: #5A2CA0;
  --color-accent: #00D2FF;        /* Cyan — tecnologia, futuro */
  --color-bg: #0A0A1A;            /* Dark mode */
  --color-surface: #13132A;
  --color-text: #E8E8FF;
  --color-text-inverse: #0A0A1A;
  --color-text-muted: #8888BB;
  --color-border: #2A2A4A;
  
  --font-headers: 'Plus Jakarta Sans', 'Inter', sans-serif;
  --font-body: 'Inter', 'DM Sans', sans-serif;
  
  --radius-global: 8px;
  --radius-card: 12px;
  --radius-btn: 8px;
  
  --shadow-md: 0 4px 24px rgba(108,63,197,0.25);
  --shadow-lg: 0 8px 48px rgba(108,63,197,0.35);
  
  --gradient-hero: linear-gradient(135deg, #6C3FC5 0%, #00D2FF 100%);
  --gradient-cta: linear-gradient(90deg, #6C3FC5, #8B5CF6);
  
  /* Glassmorphism support */
  --glass-bg: rgba(108,63,197,0.10);
  --glass-border: rgba(108,63,197,0.20);
  --glass-blur: blur(12px);
}
```

---

### 6. Fitness / Esporte / Academia

```css
/* fitness-sport.css */
:root {
  --color-primary: #1ED760;       /* Verde Vibrante — energia, vitalidade */
  --color-secondary: #17B04E;
  --color-accent: #FF4757;        /* Vermelho — intensidade, poder */
  --color-bg: #0D0D0D;            /* Dark — força */
  --color-surface: #1A1A1A;
  --color-text: #F5F5F5;
  --color-text-inverse: #0D0D0D;
  --color-text-muted: #888888;
  --color-border: #2A2A2A;
  
  --font-headers: 'Barlow Condensed', 'Oswald', sans-serif;
  --font-body: 'Barlow', 'Roboto Condensed', sans-serif;
  --font-weight-bold: 800;        /* Extra bold */
  
  --radius-global: 4px;           /* Sharp — power, no nonsense */
  --radius-btn: 4px;
  
  --gradient-hero: linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #0D2A1A 100%);
  --gradient-cta: linear-gradient(90deg, #1ED760, #17B04E);
}
```

---

### 7. Imóveis / Real Estate

```css
/* real-estate.css */
:root {
  --color-primary: #2C3E50;       /* Cinza Azulado — estabilidade */
  --color-secondary: #34495E;
  --color-accent: #C9A84C;        /* Dourado — investimento, valor */
  --color-bg: #F5F5F0;            /* Pedra suave */
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-inverse: #FFFFFF;
  --color-text-muted: #6B7280;
  --color-border: #E8E5E0;
  
  --font-headers: 'Cormorant', 'Merriweather', serif;
  --font-body: 'Raleway', 'Lato', sans-serif;
  
  --radius-global: 6px;
  --radius-card: 8px;
  --radius-btn: 4px;
  
  --gradient-hero: linear-gradient(180deg, rgba(44,62,80,0.85) 0%, rgba(44,62,80,0.95) 100%);
}
```

---

### 8. Educação / Cursos / Treinamento

```css
/* education.css */
:root {
  --color-primary: #2980B9;       /* Azul Médio — aprendizagem, confiança */
  --color-secondary: #3498DB;
  --color-accent: #F1C40F;        /* Amarelo — atenção, energia, otimismo */
  --color-bg: #F0F8FF;
  --color-surface: #FFFFFF;
  --color-text: #1A2C3A;
  --color-text-muted: #5D7A8A;
  
  --font-headers: 'Nunito', 'Poppins', sans-serif;
  --font-body: 'Source Sans Pro', 'Open Sans', sans-serif;
  
  --radius-global: 8px;
  --radius-btn: 50px;             /* Friendly pill */
  --radius-card: 12px;
}
```

---

### 9. Clínica Veterinária / Pet Care

```css
/* pet-care.css */
:root {
  --color-primary: #FF8C42;       /* Laranja Quente — alegria, carinho */
  --color-secondary: #E07430;
  --color-accent: #4ECDC4;        /* Turquesa — saúde */
  --color-bg: #FFFAF5;
  --color-surface: #FFFFFF;
  --color-text: #2C1810;
  
  --font-headers: 'Nunito', 'Fredoka One', sans-serif;
  --font-body: 'Nunito', 'Lato', sans-serif;
  
  --radius-global: 20px;          /* Very rounded — fun, safe */
  --radius-btn: 50px;
  --radius-card: 20px;
}
```

---

### 10. Turismo / Viagens / Hotelaria

```css
/* travel-hospitality.css */
:root {
  --color-primary: #0077B6;       /* Azul Oceano */
  --color-secondary: #0096C7;
  --color-accent: #48CAE4;        /* Aqua */
  --color-bg: #F0F8FF;
  --color-surface: #FFFFFF;
  --color-text: #03045E;
  
  --font-headers: 'Playfair Display', 'Lora', serif;
  --font-body: 'Lato', 'Open Sans', sans-serif;
  
  --radius-global: 12px;
  --gradient-hero: linear-gradient(135deg, #03045E 0%, #0077B6 50%, #48CAE4 100%);
}
```

---

### 11. Serviços Profissionais / B2B / Consultoria

```css
/* professional-services.css */
:root {
  --color-primary: #0F4C81;
  --color-secondary: #1565A7;
  --color-accent: #00A896;        /* Teal — diferenciação */
  --color-bg: #F8FAFB;
  --color-surface: #FFFFFF;
  --color-text: #1A2B3C;
  
  --font-headers: 'Plus Jakarta Sans', 'Inter', sans-serif;
  --font-body: 'Inter', 'Lato', sans-serif;
  
  --radius-global: 6px;
  --spacing-section: 96px;
}
```

---

### 12. Varejo / E-commerce / Loja

```css
/* retail-ecommerce.css */
:root {
  --color-primary: #E63946;       /* Vermelho — urgência, promoção */
  --color-secondary: #C1121F;
  --color-accent: #FFB703;        /* Amarelo — oferta, destaque */
  --color-bg: #FFFFFF;
  --color-surface: #F8F8F8;
  --color-text: #1A1A1A;
  
  --font-headers: 'Poppins', 'Montserrat', sans-serif;
  --font-body: 'Inter', 'Roboto', sans-serif;
  
  --radius-global: 8px;
  --radius-btn: 4px;
  --spacing-section: 64px;        /* Denser — more products visible */
}
```

---

## Base Token File

`templates/tokens/base.css` — the contract all blocks depend on:

```css
/* base.css — NEVER edit this file. Edit niche files instead. */
:root {
  /* Colors */
  --color-primary: #1B3A5C;
  --color-secondary: #2E5077;
  --color-accent: #C9A84C;
  --color-bg: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-text: #1A1A2E;
  --color-text-inverse: #FFFFFF;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  
  /* Typography */
  --font-headers: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-base: 16px;
  --font-weight-bold: 700;
  
  /* Shape */
  --radius-global: 8px;
  --radius-card: 12px;
  --radius-btn: 8px;
  --radius-input: 6px;
  
  /* Depth */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
  --shadow-color: rgba(0,0,0,0.10);
  
  /* Layout */
  --spacing-section: 80px;
  --spacing-component: 40px;
  --spacing-inner: 20px;
  --container-max: 1200px;
  --container-narrow: 800px;
  
  /* Motion */
  --transition-speed: 0.2s;
  --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Gradients */
  --gradient-hero: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  --gradient-cta: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}
```

---

## Token Injection at Edge

The Cloudflare Worker injects the niche token CSS into every page response:

```javascript
// In HTMLRewriter
new HTMLRewriter()
  .on('head', {
    element(el) {
      el.append(
        `<link rel="preconnect" href="https://fonts.googleapis.com">
         <style id="ts-tokens">${nicheTokensCss}</style>`,
        { html: true }
      );
    }
  })
```

This happens at the edge — zero extra HTTP requests, zero render blocking.
