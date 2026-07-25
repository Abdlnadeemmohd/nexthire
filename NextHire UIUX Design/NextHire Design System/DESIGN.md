---
name: NextHire Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for a premium, AI-driven recruitment experience. It balances high-performance technology with human-centric professionalism. The aesthetic is **Corporate Modernism**—utilizing ample whitespace, precise geometric alignment, and a sophisticated color palette to instill trust in both enterprise recruiters and high-level candidates.

The visual direction avoids unnecessary decorative flourishes, focusing instead on clarity, speed, and intelligence. The emotional response should be one of "effortless capability," where the AI's power is felt through a seamless and organized interface rather than overwhelming data visualizations.

## Colors
This design system utilizes a high-contrast palette to distinguish between action, brand, and status.

- **Primary (Royal Blue):** Used for primary actions, active states, and brand-critical touchpoints. It represents the "intelligence" of the platform.
- **Secondary (Midnight):** Used for deep backgrounds, primary text, and navigation sidebars. It provides the "corporate" grounding.
- **Tertiary (Emerald):** Reserved specifically for "Success" states, "Match" indicators, and "Hired" statuses, emphasizing positive growth and AI-verified matches.
- **Surface & Neutral:** A range of Slate grays (#F8FAFC to #1E293B) are used to create subtle depth and hierarchy without relying on heavy borders.

## Typography
The typography system uses a dual-font strategy. **Poppins** is the voice of the brand, used for headings to provide a modern, geometric, and friendly appearance. **Hanken Grotesk** is the utilitarian workhorse used for all body text, data points, and interface labels, chosen for its exceptional legibility and professional "Tech-SaaS" feel.

Headlines should always use SemiBold (600) weights to maintain the geometric character. Body text should remain at Regular (400) for long-form reading, with Medium (500) or SemiBold (600) reserved for emphasis and functional UI labels.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. A strict 8px spacing power-of-two scale is applied to all margins, paddings, and component dimensions to ensure mathematical harmony.

- **Desktop:** 1280px max-width container, 24px gutters, 40px outer margins.
- **Tablet:** Fluid width, 20px gutters, 24px outer margins.
- **Mobile:** Fluid width, 16px gutters, 16px outer margins.

Information density is "Balanced." While whitespace is prioritized to maintain a premium feel, data-heavy views (like applicant lists) should utilize a tighter 8px internal padding to maximize screen real estate.

## Elevation & Depth
Depth in this design system is conveyed through **Tonal Layering** and **Soft Ambient Shadows**. 

1.  **Level 0 (Base):** The default background color (#F8FAFC).
2.  **Level 1 (Card/Surface):** White (#FFFFFF) surfaces with a subtle 1px border (#E2E8F0).
3.  **Level 2 (Interactive):** Elements that require focus use an extremely soft, large-radius shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.05)`.
4.  **Level 3 (Overlays):** Modals and dropdowns use a high-diffused shadow to simulate significant elevation: `0px 20px 25px -5px rgba(15, 23, 42, 0.1)`.

Avoid high-contrast shadows or solid black; all shadows should be tinted with the Secondary color (Midnight) to keep them integrated with the palette.

## Shapes
This design system uses a **Rounded** geometry to soften the corporate professional tone. 

- **Components (Buttons, Inputs):** 0.5rem (8px) base radius.
- **Containers (Cards, Modals):** 1rem (16px) radius.
- **Interactive Accents (Chips):** 3rem (48px) for a full pill-shape, emphasizing their status as removable or selectable objects.

Iconography should follow this rounded logic, utilizing "Soft" or "Rounded" icon sets rather than sharp, square-ended icons.

## Components
Consistent component styling reinforces the premium recruitment experience:

- **Buttons:** Primary buttons are Royal Blue with white text. They should have a subtle scale-down effect (98%) on click. Secondary buttons are outlined with a 1px Slate border.
- **Input Fields:** Use a 48px height for a substantial, premium feel. Focus states must use a 2px Royal Blue ring with a subtle 4px outer glow.
- **Cards:** White background, 16px border-radius, and a 1px Slate-200 border. No shadow in resting state; shadow appears on hover to indicate interactivity.
- **Chips/Badges:** Use Tertiary (Emerald) for "High Match" scores. For neutral tags, use a light Slate-100 background with Slate-700 text.
- **Candidate List Item:** A flat-vector style list item with clear horizontal separation. Include a "Match Score" circle that uses a radial progress bar in Emerald.
- **AI "NextSteps" Sidebar:** A distinct surface with a slight blue tint (#EFF6FF) to differentiate AI-generated suggestions from user-generated content.