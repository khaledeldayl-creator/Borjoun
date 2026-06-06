---
name: Borjoun AI-Web3
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e1e7ff'
  surface-container-highest: '#dae2fc'
  on-surface: '#131b2e'
  on-surface-variant: '#4a4456'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#712aec'
  primary: '#4600a2'
  on-primary: '#ffffff'
  primary-container: '#6100dc'
  on-primary-container: '#ccb4ff'
  inverse-primary: '#d1bcff'
  secondary: '#00677e'
  on-secondary: '#ffffff'
  secondary-container: '#00d2fd'
  on-secondary-container: '#005669'
  tertiary: '#013087'
  on-tertiary: '#ffffff'
  tertiary-container: '#27499f'
  on-tertiary-container: '#abbeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d1bcff'
  on-primary-fixed: '#24005b'
  on-primary-fixed-variant: '#5800c8'
  secondary-fixed: '#b4ebff'
  secondary-fixed-dim: '#3cd7ff'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#1c4197'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fc'
  glass-bg: rgba(255, 255, 255, 0.7)
  glass-border: rgba(255, 255, 255, 0.8)
  success-green: '#16a34a'
  paypal-blue: '#003087'
  accent-glow: rgba(123, 46, 255, 0.15)
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  code-sm:
    fontFamily: Sora
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  base: 8px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 24px
---

## Brand & Style
The brand identity, **Borjoun**, is a high-tech, futuristic intersection of Web3 and Artificial Intelligence. It targets a tech-savvy audience looking for "smart" financial opportunities. 

The visual style is **Glassmorphism mixed with Cyber-Grid minimalism**. It evokes a sense of transparency, high-status wealth, and technological sophistication. The UI relies on deep blur effects, vibrant neon accents against a pristine "ice-white" background, and subtle digital patterns (grids and glows) to create an immersive, futuristic environment that feels both premium and secure.

## Colors
The palette is rooted in a **High-Fidelity Light Mode**.
- **Primary Purple (#6100dc):** Used for core actions, branding, and status indicators. It represents the "AI" intelligence layer.
- **Secondary Cyan (#00d4ff):** Used as a gradient partner to the primary, representing the fluid nature of Web3 and digital currencies.
- **Surface (#faf8ff):** An "Ice White" base that prevents the starkness of pure white while maintaining a clean, medical-grade tech aesthetic.
- **Glass Effects:** Surfaces are predominantly semi-transparent with heavy backdrop blurs to create depth without clutter.

## Typography
The system exclusively uses **Sora**, a geometric sans-serif with a technical, futuristic edge. 
- **Hierarchy:** Dramatic scale shifts between Display and Body text to emphasize high-value stats.
- **Gradients:** Display text often utilizes a linear gradient from Primary to Secondary to draw immediate attention.
- **Arabic Context:** The system pairs Sora with **Noto Sans Arabic** for RTL support, ensuring the geometric weights feel consistent across languages.

## Layout & Spacing
The design uses a **Fixed-Width Centered Grid** on desktop (max-width 1280px) and a **Fluid Grid** on mobile.
- **Margins:** Generous 64px horizontal margins on desktop to create a premium, "breathable" feel.
- **Bento Grid Logic:** For partner sections and stats, a Bento-style grid is used where elements have uniform gutters (24px) but varying heights.
- **Vertical Rhythm:** Large sections are separated by `xl` (80px) padding to maintain clear content boundaries.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional drop shadows.
- **Base Level:** The background grid is the lowest layer.
- **Surface Level:** Content sections use a subtle `surface-container-low` tint.
- **Glass Cards:** Floating elements use `white/70` backgrounds with `20px` backdrop blur and a extremely soft, tinted shadow (`rgba(123, 46, 255, 0.08)`).
- **Glow Elements:** High-priority items (like CTA buttons or verified badges) feature a `glow-soft` effect using a spread-out purple shadow to simulate light emission.

## Shapes
The shape language is **distinctly rounded and organic**.
- **Cards:** Use a large `rounded-3xl` (24px-32px) radius to soften the technical aesthetic.
- **Buttons:** Primary CTAs are often fully rounded (Pills) or `rounded-xl` (12px) for secondary actions.
- **Containers:** Dashboard previews and hero visuals use an ultra-rounded `40px` radius for a "vessel" look.

## Components
- **Buttons:** 
    - *Primary:* Pill-shaped, gradient or solid purple, with a soft glow shadow.
    - *Secondary:* `rounded-xl`, white background with a thin `outline-variant` border.
- **Cards (Glass):** Semi-transparent white, 1px white border (simulating a rim light), and 20px backdrop blur.
- **Ticker:** A full-width, low-contrast horizontal bar with live-scrolling "proof" notifications.
- **Badges:** Small, fully rounded chips with 10% opacity backgrounds of the text color (e.g., green text on light green background).
- **Tables:** Minimalist, with `surface-container-high` headers and thin horizontal dividers.
- **HUD Elements:** Small, floating glass cards containing a single icon and a metric, used to provide context to visual imagery.