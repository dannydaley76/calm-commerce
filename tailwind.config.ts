import type { Config } from 'tailwindcss';

/**
 * Tailwind v4 — colour palette registration.
 *
 * This file is loaded by globals.css via the `@config` directive, giving
 * Tailwind v4 the concrete hex values it needs to generate utility classes
 * like `bg-cobalt-600`, `text-ink-900`, `bg-surface-raised`, etc.
 *
 * Rule of thumb
 * ─────────────
 * • Colours live HERE so `theme.extend.colors` is the single source.
 * • The same values are mirrored as CSS custom properties in `:root`
 *   (globals.css) so non-Tailwind code can also use them at runtime.
 * • `@theme inline` in globals.css is kept only for font registration;
 *   it no longer defines colours to avoid the double-variable indirection
 *   that was preventing utility class generation.
 *
 * Safelist
 * ────────
 * Dynamic class strings (e.g. conditional active/inactive state in
 * CanvasTabs) are safelisted with regex patterns so they survive the
 * content scanner even if they only appear in template expressions.
 */

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  /*
   * No safelist needed: every token-based class appears as a complete string
   * in source files (no string-interpolated colour segments) so the content
   * scanner picks them all up.  The @layer utilities shadow-card / shadow-card-hover
   * classes defined in globals.css are always emitted regardless of scanning.
   */

  theme: {
    extend: {
      colors: {
        /** Neutral type + border scale — teal-shifted greys */
        ink: {
          900: '#0B2A39',
          700: '#1F4456',
          500: '#4A6B7A',
          300: '#8AA2AE',
          100: '#D4DEE3',
        },

        /** Surface levels */
        surface: {
          canvas:   '#EAF1F5',   // page / app shell
          raised:   '#FFFFFF',   // cards, modals, menus
          sunken:   '#DDE6EC',   // grouped panels, recessed wells
          emphasis: '#0B2A39',   // dark surfaces (tooltips, dark badges)
          warm:     '#F4ECDC',   // warm accent surfaces
        },

        /** Cobalt — primary interactive colour */
        cobalt: {
          700: '#0036A8',
          600: '#0049CF',
          500: '#1A5BE0',
          100: '#D4E0FA',
        },

        /** Teal — success / completion signals only */
        teal: {
          700: '#00574F',
          600: '#00756A',
          500: '#0E9A8C',
          100: '#CDEAE5',
        },

        /** Amber — warning / attention */
        amber: {
          700: '#7a4b00',   // kept from v1 for text on amber-100
          500: '#E89527',
          100: '#FBE7C7',
        },

        /** Semantic aliases */
        success: {
          600: '#137F4B',
          100: '#CFEAD9',
        },
        warning: {
          600: '#B7791F',
          100: '#F6E2B7',
        },
        danger: {
          600: '#B42318',
          100: '#F8D7D2',
        },
      },

      /** Card shadows (also defined as .shadow-card in @layer utilities) */
      boxShadow: {
        card:        '0 1px 2px rgba(11,42,57,0.06), 0 4px 12px rgba(11,42,57,0.06)',
        'card-hover':'0 2px 4px rgba(11,42,57,0.08), 0 8px 24px rgba(11,42,57,0.10)',
      },
    },
  },

  plugins: [],
};

export default config;
