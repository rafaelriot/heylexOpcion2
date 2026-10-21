---
name: Sovereign Shield Access
colors:
  surface: '#f8f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f8f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#42474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#737780'
  outline-variant: '#c3c6d0'
  surface-tint: '#3a608d'
  primary: '#002546'
  on-primary: '#ffffff'
  primary-container: '#0d3b66'
  on-primary-container: '#81a6d7'
  inverse-primary: '#a4c9fc'
  secondary: '#576500'
  on-secondary: '#ffffff'
  secondary-container: '#d4f034'
  on-secondary-container: '#5d6b00'
  tertiary: '#1e252b'
  on-tertiary: '#ffffff'
  tertiary-container: '#343b41'
  on-tertiary-container: '#9ea5ac'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#a4c9fc'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#204874'
  secondary-fixed: '#d4f034'
  secondary-fixed-dim: '#b9d307'
  on-secondary-fixed: '#191e00'
  on-secondary-fixed-variant: '#414c00'
  tertiary-fixed: '#dce3eb'
  tertiary-fixed-dim: '#c0c7cf'
  on-tertiary-fixed: '#151c22'
  on-tertiary-fixed-variant: '#41484e'
  background: '#f8f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 4.25rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.875rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Montserrat
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
  body-lg:
    fontFamily: Montserrat
    fontSize: 1.0625rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Montserrat
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Montserrat
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Montserrat
    fontSize: 0.875rem
    fontWeight: '700'
    lineHeight: 1.25rem
    letterSpacing: 0.06em
  label-md:
    fontFamily: Montserrat
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Montserrat
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system sets the benchmark for enterprise-grade automated access control and physical security technology. Built to inspire unconditional trust among corporate enterprise buyers, gated residential developers, and municipal parking operators, the aesthetic merges authoritative institutional precision with high-tech forward velocity.

### Design Movement: Modern Corporate Precision with Controlled Glassmorphism
The visual execution relies on an architectonic framework:
- **Structural Foundations:** Crisp, sharp geometry balanced with micro-rounded fillets (Level 1) to convey impenetrable defense infrastructure without appearing dated.
- **Glassmorphic HUD Accents:** Subtly frosted transits (`backdrop-filter: blur(12px)`) across overlays, status monitors, and real-time sensor panels, evoking telemetry windshields, scanner glass, and high-frequency monitoring interfaces.
- **Tension & Contrast:** Deep oceanic midnight navy anchors the structural integrity, while electric lime accents pinpoint telemetry status, active clearance indicators, and conversion vectors.

### Brand Tenets & Sensory Direction
- **Zero-Latency Trust:** Surfaces must project rock-solid uptime, deterministic latency, and compliance rigor (SOC2, ISO 27001 posture).
- **Executive Clarity:** Information density is disciplined; operations centers can scan real-time license plate recognitions (LPR), vehicle transits, and gate actuators without cognitive strain.
- **Premium Industrial Tech:** Tactile digital panels echo physical anodized aluminum barriers, sensor housings, and optical verification hardware.

## Colors

The color system establishes a commanding hierarchy calibrated for B2B procurement clarity, bright daylight outdoor readability, and dark mission-control monitor legibility.

### Primary Canvas & Functional Tokens
- **Primary Navy (`#0D3B66`):** The institutional anchor. Used for high-emphasis interaction states, navigation headers, structural frames, and primary command buttons. It communicates uncompromised defense, governance, and institutional stability.
- **Secondary Signal Lime (`#B6D000`):** High-visibility optical telemetry color. Reserved for verified clearance states, open-gate indicators, active sensor nodes, primary data visualizations, and high-conversion landing CTA highlights. Never used for long text blocks; deployed strictly as a precision signal against navy and neutral backdrops.
- **Dark Industrial Gray (`#333A40`):** Provides mechanical weight. Applied to high-contrast body typography, architectural borders, icon fills, and perimeter container framing.
- **Neutral Light Floor (`#E6E8EB`):** Foundation base for light mode surfaces, subtle structural dividing lines, table zebra-striping, and de-emphasized container backgrounds.
- **Clean Foundation Surface (`#FFFFFF`):** High-clarity white for cards, active data tables, and input wells to maintain pristine B2B data legibility.

### Semantic Status Matrix
- **Authorized / Secure:** `#B6D000` (Signal Lime) - Gate cycle clear, authenticated visitor.
- **Security Alert / Breach:** `#D32F2F` (Crimson) - Unauthorized tailgating, barrier forced, blacklisted vehicle.
- **Telemetry Pending / Review:** `#F59E0B` (Amber Shield) - LPR manual confirmation, visitor queue pending.
- **System Neutral / Idle:** `#333A40` on `#E6E8EB` - Gate down, lane calibrated, offline bay.

## Typography

The design system exclusively utilizes **Montserrat** across all hierarchy tiers, leveraging its architectural geometric proportion, wide apertures, and robust horizontal crossbars to reinforce precision engineering.

### Type Application Directives
- **Display & Large Headlines:** Rendered in Extra-Bold (`800`) and Bold (`700`) with tight letter spacing (`-0.02em` to `-0.03em`). This treatment mimics clean CNC-milled identification plates and authoritative physical infrastructure signage.
- **Labels, Telemetry, and Badges:** Set in `label-lg`, `label-md`, and `label-sm` using Medium to Bold weights with positive tracking (`0.06em` to `0.1em`) and uppercase formatting. This ensures instant legibility on dense monitoring dashboards, gate-state pills, and license plate displays.
- **Body & Tabular Readouts:** Kept strictly balanced at Regular (`400`) and Medium (`500`) to maximize scanability across lengthy audit logs, compliance reports, and SLA metrics. Numeric data fields within tables must enable monospace numerals (`font-variant-numeric: tabular-nums`).

## Layout & Spacing

Layout geometry follows an industrial 8pt rhythmic grid, built to accommodate real-time enterprise monitoring alongside corporate lead-generation structures.

### Grid Framework & Form Factors
- **Desktop (1200px+):** 12-column dynamic fluid grid bounded by a max-width container of `1440px`. Column gutters remain locked at `1.5rem` (`gutter`), outer screen canvas margins set at `3rem` (`margin`). Layout handles multi-lane camera feeds, operations feeds, and telemetry sidebars simultaneously.
- **Tablet (768px - 1199px):** 8-column layout. Gutters compress to `1.25rem`, canvas margins to `2rem`. Collapses auxiliary sensor drawers into overlay sheets.
- **Mobile Handheld (320px - 767px):** 4-column layout. Gutters tighten to `1rem` (`gutter-mobile`), margins to `1.25rem` (`margin-mobile`). Single-lane monitoring, full-width verification action buttons, and pinned bottom execution drawers.

### Spacing Tokens Usage
- `space-xs` (0.25rem): Inline icon-to-label offsets, status badge dot buffers.
- `space-sm` (0.5rem): Dense list item gaps, tag clusters, segmented switch padding.
- `space-md` (1rem): Form input fields, button horizontal and vertical offsets, metric group spacing.
- `space-lg` (1.5rem): Card inner padding, module separations, section internal boundaries.
- `space-xl` (2.5rem): Macro section gaps on dashboards, structural row intervals on marketing showcases.

## Elevation & Depth

To reflect physical access infrastructure and advanced sensor optics, depth is rendered through razor-sharp mechanical borders, ambient navy-tinted drop shadows, and frosted translucent glass panels.

### Elevation Levels

1. **Flat / Base Layer (Elevation 0):**
   - Background canvas `#E6E8EB` or deep navy `#0D3B66` canvas for enterprise night-monitoring mode. No shadow. Border: `1px solid rgba(51, 58, 64, 0.12)`.
2. **Surface Deck (Elevation 1 - Operational Cards & Grids):**
   - Pure `#FFFFFF` fill. Border: `1px solid #E6E8EB`.
   - Shadow: `0 1px 3px rgba(13, 59, 102, 0.06), 0 1px 2px rgba(13, 59, 102, 0.04)`.
3. **Glassmorphic Telemetry HUD (Elevation 2 - Floating Overlays & Status Panels):**
   - Fill: `rgba(255, 255, 255, 0.85)` in light mode, or `rgba(13, 59, 102, 0.85)` in dark operational states.
   - Blur: `backdrop-filter: blur(12px) saturate(180%)`.
   - Top highlight line: `inset 0 1px 0 0 rgba(255, 255, 255, 0.4)`.
   - Shadow: `0 8px 24px -4px rgba(13, 59, 102, 0.12), 0 2px 6px -1px rgba(13, 59, 102, 0.08)`.
4. **Command & Critical Interventions (Elevation 3 - Modals, Manual Gate Override Overlays):**
   - Border: `1px solid rgba(13, 59, 102, 0.25)`.
   - Shadow: `0 20px 40px -8px rgba(13, 59, 102, 0.22), 0 0 0 1px rgba(13, 59, 102, 0.05)`.

## Shapes

The design system enforces **Roundedness Level 1 (Soft)**.

Curvature is intentionally restricted to micro-radii to emulate milled hardware units, server chassis, and secure institutional keycards. Overly rounded or playful shapes are strictly prohibited to protect the B2B defense and procurement posture.

### Geometry Specifications
- **Base Components (`rounded` = 0.25rem / 4px):** Standard inputs, primary buttons, pill tags, data table rows, drop-down panels, and sensor chips.
- **Card Enclosures (`rounded-lg` = 0.5rem / 8px):** Primary content cards, monitoring viewports, camera telemetry screens, and modal frames.
- **Master Structures (`rounded-xl` = 0.75rem / 12px):** Top-level dashboard viewports, application shell containers, and full-screen hero overlays.

## Components

### Buttons
- **Primary Action (Command State):** Deep Navy background (`#0D3B66`), crisp white typography (`#FFFFFF`), `font-weight: 700`, uppercase tracking (`0.06em`), height `44px` (desktop) / `48px` (mobile). Micro-radius `0.25rem`. Hover introduces an energetic micro-edge: `box-shadow: 0 0 0 2px #B6D000`.
- **Secondary Signal (Telemetry / High-Conversion Action):** Signal Lime fill (`#B6D000`), Dark Industrial Gray text (`#333A40`), `font-weight: 700`. Designed for critical conversions ("Solicitar Demo", "Abrir Barrera"). Hover shifts fill to `hsl(68, 100%, 38%)`.
- **Outline / Operational:** Transparent fill, `1px solid #333A40`, text `#333A40`. Hover transitions to `#333A40` with white text.

### Inputs & LPR Search Fields
- Standard height `44px`, base background `#FFFFFF`, border `1px solid #E6E8EB`, radius `0.25rem`.
- **Active / Focus:** Border switches to `#0D3B66` with a precision ring: `box-shadow: 0 0 0 2px rgba(13, 59, 102, 0.15)`.
- **License Plate Reader (LPR) Specialized Input:** Monospaced letter spacing, uppercase transformation, embedded right-aligned camera icon reflecting OCR scan status.

### Status Chips & Access Badges
- Compact height (`24px`), uppercase `label-sm` tracking (`0.1em`).
- **Authorized / Lane Clear:** Signal Lime surface tint `rgba(182, 208, 0, 0.15)`, text `#0D3B66`, solid `#B6D000` 6px pulsating status dot.
- **Denied / Intrusion:** Deep Crimson surface tint `rgba(211, 47, 47, 0.12)`, text `#D32F2F`, solid `#D32F2F` 6px status dot.
- **Visitor / Pending Authorization:** Dark Gray surface tint `rgba(51, 58, 64, 0.08)`, text `#333A40`.

### Cards & Telemetry Panels
- Surface `#FFFFFF`, border `1px solid #E6E8EB`, radius `0.5rem`.
- In telemetry views, cards utilize a continuous header bar with an accent edge: `border-left: 3px solid #0D3B66`. If the lane triggers an active alert, the accent line shifts instantly to `#B6D000` (authorized pass) or `#D32F2F` (unauthorized pass).

### Form Controls (Checkboxes & Radios)
- Radius `2px` for checkboxes, circular for radios.
- Unchecked: `1px solid #333A40`, surface `#FFFFFF`.
- Checked: Fill `#0D3B66` with clean white checkmark / inner dot. Focus state displays `0 0 0 2px rgba(182, 208, 0, 0.5)`.

### Specialized Domain Component: Live Lane Actuator Control
- High-visibility toggles dedicated to remote barrier actuation. Composed of a segmented pill controller: left segment `#0D3B66` ("BARRERA ABAJO"), right segment `#B6D000` with dark text ("ABRIR ACCESO"). Protected with a 200ms press-and-hold confirmation animation to prevent accidental triggering.