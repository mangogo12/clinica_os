---
name: Clinical Excellence System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dad7f3'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e5ff'
  surface-container-highest: '#e2e0fc'
  on-surface: '#1a1a2e'
  on-surface-variant: '#444654'
  inverse-surface: '#2f2e43'
  inverse-on-surface: '#f2efff'
  outline: '#747686'
  outline-variant: '#c4c5d6'
  surface-tint: '#3052d2'
  primary: '#1a40c2'
  on-primary: '#ffffff'
  primary-container: '#3b5bdb'
  on-primary-container: '#e2e5ff'
  inverse-primary: '#b8c3ff'
  secondary: '#4855b7'
  on-secondary: '#ffffff'
  secondary-container: '#8c98ff'
  on-secondary-container: '#1d2a8e'
  tertiary: '#a30108'
  on-tertiary: '#ffffff'
  tertiary-container: '#c7251f'
  on-tertiary-container: '#ffdfdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001355'
  on-primary-fixed-variant: '#0736ba'
  secondary-fixed: '#dfe0ff'
  secondary-fixed-dim: '#bcc2ff'
  on-secondary-fixed: '#000a63'
  on-secondary-fixed-variant: '#2f3b9e'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930006'
  background: '#fcf8ff'
  on-background: '#1a1a2e'
  surface-variant: '#e2e0fc'
typography:
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 260px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style
This design system is engineered for high-stakes healthcare environments where clarity, speed of cognition, and professional trust are paramount. The brand personality is **reliable, precise, and calm**, balancing a clinical institutional feel with modern SaaS efficiency. 

The aesthetic follows a **Modern Corporate** direction with a focus on high-clarity information architecture. It utilizes a structured depth model—clean white surfaces against a soft, tinted background—to reduce visual fatigue for practitioners who interact with the interface for extended periods. The distinction between the internal management environment (authoritative dark sidebar) and the public booking interface (approachable and light) ensures the system scales from complex data entry to patient-facing simplicity.

## Colors
The color palette is anchored by a deep Indigo primary, signaling authority and stability. 
- **Core Palette:** The primary blue is used for actions and branding, while the secondary navy is reserved for high-level navigation (sidebar) to create a strong visual anchor.
- **Functional Colors:** Success, Error, and Warning colors follow industry standards for immediate recognition in medical contexts.
- **Surface Strategy:** We use a logic of "Tinted Ground." The background is a soft blue-grey wash (#F0F2FF), allowing white surface cards (#FFFFFF) to "pop" without the harshness of pure black-on-white contrast.
- **Data Visualization:** Charts utilize a high-contrast triad of primary blue, success green, and a soft pink to ensure categorical distinction in patient metrics and clinic performance reports.

## Typography
The system relies exclusively on **Inter**, a typeface designed for maximum legibility on digital screens. 
- **Hierarchical Contrast:** We use tight tracking (letter spacing) on headlines to maintain a compact, modern feel, while labels utilize slightly increased tracking and medium weights for immediate scanning.
- **Intentionality:** H1 is reserved for page titles and critical dashboard summaries. H2 serves as the primary header for card sections and modal titles.
- **Readability:** Body text is set at 14px to maximize information density—critical for patient records—without sacrificing legibility, supported by a 20px line height to prevent line-crowding.

## Layout & Spacing
The layout employs a **Fluid Grid** for the internal dashboard and a **Fixed Centered Grid** for the public booking page.
- **Dashboard Layout:** Utilizes a fixed left-hand sidebar (260px) in a deep navy (#1E2B8F). The main content area uses a flexible grid with 24px margins and gutters, allowing cards to reflow based on the number of data columns.
- **Public Booking:** Transitions to a clean, institutional "No-Sidebar" layout. Content is constrained to a 1200px max-width container, centered on the screen to provide a focused, calm experience for patients.
- **Spacing Rhythm:** All dimensions follow a 4px baseline grid. Internal card padding is consistently 24px (lg) to ensure a "generous" and high-end feel.

## Elevation & Depth
Depth is created through a combination of **Tonal Layering** and **Ambient Shadows**.
- **Level 0 (Background):** The base layer (#F0F2FF) is flat and non-interactive.
- **Level 1 (Cards/Surfaces):** Main content areas use white surfaces (#FFFFFF) with a very soft, diffused shadow (`0 2px 8px rgba(0,0,0,0.06)`). This creates a subtle lift that distinguishes interactive zones from the background.
- **Level 2 (Modals/Popovers):** Higher elevation elements use a more pronounced shadow (`0 12px 24px rgba(26, 26, 46, 0.08)`) to pull focus and create a clear modal overlay.
- **Interaction:** On hover, interactive cards may slightly "lift" by increasing shadow spread, signaling clickability.

## Shapes
The shape language is defined by **rounded precision**. 
- **Cards:** Use a 16px (rounded-lg) radius to soften the clinical feel and make the software feel modern and accessible.
- **Standard Components:** Buttons and Input fields use an 8px radius, providing a professional, sturdy appearance that fits within the card containers.
- **Status Indicators:** Badges and chips use a "Full Pill" (999px) radius. This distinct shape differentiates "status" (e.g., Confirmed, Cancelled) from "action" (buttons), reducing cognitive load during rapid scanning.

## Components
- **Buttons:** Primary buttons are #3B5BDB with white text. They should include a subtle transition to a darker indigo on hover. Secondary buttons use a transparent background with a 1px border of the primary color.
- **Sidebar:** The navigation must use white icons with 0.8 opacity. Active states should be indicated by a solid white bar on the left edge and a slight background highlight (light blue at 0.1 opacity).
- **Status Badges:** Use a "Soft Palette" approach. For example, a "Success" badge uses a light green background at 15% opacity with dark green text (#12B76A).
- **Input Fields:** Use a 1px border (#E5E7EB) that shifts to Primary Blue on focus. Labels should always sit above the field in the `label-md` style.
- **Cards:** Every card must have a white background, 16px border-radius, and the specified ambient shadow. Header sections within cards should be separated by a light 1px divider if the content is data-heavy.
- **Booking Progress:** On public pages, use a horizontal stepper with large, circular numeric indicators to guide patients through the appointment flow.