---
name: ChronoFlow
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h2-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The brand personality is rooted in **focus, calm, and high-productivity**. It aims to reduce the cognitive load of time-management through a **Minimalist** design style. The interface leverages expansive whitespace, a disciplined color application, and precise typography to create an environment where the user’s schedule is the hero. The emotional response should be one of "controlled momentum"—the feeling of having a clear plan without being overwhelmed by the tool itself.

## Colors
The palette is functional and semantic. The **Primary Indigo** drives core actions and navigation, while the **Secondary Amber** is used sparingly for highlights or "in-progress" states. 

A specialized set of **Category Colors** is provided specifically for time-blocks. These should be used with high transparency (8-12% opacity) for block backgrounds and 100% opacity for the leading indicator or text to maintain the minimalist aesthetic while ensuring clear visual separation between task types.

## Typography
This design system utilizes **Inter** for its systematic, utilitarian clarity. The hierarchy is tight; headline levels use slight negative letter-spacing to appear more compact and authoritative. The `label` style is reserved for small metadata or section headers in the sidebar, utilizing an uppercase transform to create a distinct visual texture compared to body text.

## Layout & Spacing
The layout follows a **4px base grid**. For the main calendar or "flow" view, a **fluid grid** is used to maximize the visibility of the timeline. 

- **Desktop:** 12-column grid with 32px side margins. The sidebar is fixed at 280px.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 16px margins. 

Vertical spacing between task cards should strictly follow the `sm` (8px) or `md` (16px) increments to maintain a rhythmic, organized feel.

## Elevation & Depth
Depth is created primarily through **Tonal Layers** rather than heavy shadows. 
- **Level 0 (Background):** #F8FAFC - The base of the application.
- **Level 1 (Cards/Surfaces):** #FFFFFF - Uses a very subtle ambient shadow (0 1px 2px rgba(0,0,0,0.05)) to separate the content from the background.
- **Interactive States:** On hover, cards should transition to a slightly deeper shadow or a 1px border using the Primary color at 10% opacity.
- **Modals/Overlays:** Use a backdrop blur (8px) with a 20% opacity black overlay to keep the focus on the task entry.

## Shapes
The shape language balances approachability with professional precision. 
- **Cards & Containers:** 8px radius provides a modern, soft feel without appearing childish.
- **Interactive Inputs:** 4px radius offers a more technical, precise look for data entry.
- **Chips & Status Indicators:** Fully rounded (999px) to distinguish them clearly from interactive buttons or task cards.

## Components

### Buttons
- **Primary:** Solid Indigo background, White text. 8px radius.
- **Ghost:** No background, Indigo text. Used for secondary actions like "Cancel" or "Add Subtask."
- **Size:** 36px height for standard, 44px for mobile-friendly touch targets.

### Time-Blocks (Cards)
- **Background:** Use the category color at 10% opacity.
- **Border:** A 2px solid left-border using the category color at 100% opacity.
- **Content:** Title in `body` bold, time range in `body-sm`.

### Inputs
- **Style:** 1px solid border (#E2E8F0). Focus state uses a 1px Indigo border with a 3px Indigo glow at 10% opacity.
- **Icons:** Lucide outline style, 2px stroke. Icons should be colored #64748B (Secondary Text) unless active.

### Chips
- **Usage:** For tags or category labels.
- **Style:** 999px pill shape. 12px font size. Background #F1F5F9 with #475569 text.

### Progress Indicators
- Use a thin 4px track for progress bars within time-blocks, utilizing the Secondary Amber color to show completion percentage.