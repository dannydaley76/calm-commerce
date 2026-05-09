# Calm Commerce — Design System & Brand Guidelines

## Logo & Brand Assets

### Asset inventory

All brand SVGs live in `public/brand/`. Use these files everywhere — never recreate the mark in code or rasterise for web use.

| File | Usage |
|------|-------|
| `calm-commerce-logo-horizontal.svg` | Default primary logo — headers, marketing, onboarding |
| `calm-commerce-logo-stacked.svg` | Narrow headers, compact layouts (< 200 px wide) |
| `calm-commerce-icon.svg` | App nav, tab icons, 24 px+ contexts |
| `calm-commerce-logo-reverse.svg` | Dark/ink surfaces only |
| `calm-commerce-nav-24.svg` | 24 px app nav icon |
| `calm-commerce-favicon-16.svg` | Browser favicon (16 px) |
| `scout-logo.svg` | Scout main lockup — marketing, onboarding |
| `scout-extension-tile.svg` | Chrome Web Store tile |
| `scout-by-calm-commerce.svg` | Endorsed promo lockup — co-branded surfaces |

**Minimum sizes**

| Asset | Min width |
|-------|-----------|
| Full lockup (horizontal) | 120 px |
| Stacked lockup | 88 px |
| App nav icon | 24 px |
| Favicon | 16 px |

> **Internal padding note:** The horizontal and reverse SVGs contain ~74 px of built-in top/bottom
> whitespace inside their 160 px-tall viewBox. The visible wordmark only occupies ~55% of the
> rendered height. To reach legible text (~17 px rendered), use **height ≥ 56 px** in practice —
> the `<CalmCommerceLogo>` component default is set accordingly.

### Approved colours

| Name | Hex | Role |
|------|-----|------|
| Ink 900 | `#0B2A39` | Primary text, dark surfaces |
| Cobalt 600 | `#0049CF` | Primary brand, interactive |
| Teal 600 | `#00756A` | Signal/accent inside icon mark |
| White | `#FFFFFF` | Reversed logos, light surfaces |

### Clear space

Maintain clear space equal to **0.5× the icon width** on all sides of every logo variant.

### Usage rules

- Use the **horizontal lockup** as the default primary logo.
- Use the **stacked lockup** in narrow headers and compact layouts.
- Use the **icon-only mark** for app nav, tabs, favicons, and compact UI.
- Use the **reversed version** on dark ink surfaces only.
- **Never** stretch, squash, or rotate the mark.
- **Never** change the approved colours.
- **Never** separate the inner signal from the outer C frame.
- **Never** add gradients, shadows, outlines, or effects.
- Keep proportions and corner radii consistent.
- Use SVG as the default source asset. Export PNG fallbacks for 16 px, 24 px, 32 px, and 48 px icons.
- Keep stroke weight and geometry consistent across all variants.

### Scout sub-brand

Scout is an endorsed product sub-brand.

- Use **"Scout by Calm Commerce"** in marketing, onboarding, and extension surfaces.
- Use **"Calm Commerce"** as the master brand in product-wide navigation and brand-level materials.
- Use the Scout icon in Chrome extension tiles and app contexts where the Scout product is the primary surface.

---

## App implementation

### In-app logo (`CalmCommerceLogo` component)

`src/components/calm-commerce-logo.tsx` exports a `<CalmCommerceLogo>` component that renders the correct variant based on context.

```tsx
// Default — horizontal lockup (header)
<CalmCommerceLogo />

// Compact contexts
<CalmCommerceLogo variant="icon" size={24} />

// Dark/reversed surfaces
<CalmCommerceLogo variant="reverse" />
```

### Favicon

`src/app/layout.tsx` wires the SVG favicon through Next.js metadata:

```ts
export const metadata: Metadata = {
  icons: {
    icon: "/brand/calm-commerce-favicon-16.svg",
    shortcut: "/brand/calm-commerce-favicon-16.svg",
  },
};
```

---

## Colour tokens

Defined in `tailwind.config.ts` and `globals.css`.

| Token | Hex |
|-------|-----|
| `cobalt-600` | `#0049CF` |
| `teal-600` | `#00756A` |
| `ink-900` | `#0B2A39` |
| `surface-canvas` | `#EAF1F5` |

---

## Typography

- **Headings**: Manrope (700 / semibold)
- **UI / body**: System stack via Geist Sans variable
- **Monospace**: Geist Mono

---

*Last updated: May 2026. Refer to the Logo Assets & Usage Rules master sheet for the authoritative source.*
