# Design Spec: Neumorphic UI Refresh & Theme Switcher

## Goal
Transform the existing glassmorphism-based UI into a cohesive neumorphic design with support for both light and dark modes, including a persistent theme switcher.

## Architecture
- **Theme Management**: Use a `ThemeProvider` (React Context) or a simpler local state in `App.tsx` that toggles a `.dark` class on the `<html>` or `<body>` element.
- **Styling**: Utilize Tailwind CSS for layout and custom CSS variables for neumorphic shadows and colors.

## Visual Design
### Colors & Shadows
| Mode  | Background | Dark Shadow | Light Shadow | Accent |
| :--- | :--- | :--- | :--- | :--- |
| **Light** | `#e0e5ec` | `#a3b1c6` | `#ffffff` | Blue/Emerald |
| **Dark** | `#1a1f2c` | `#12161f` | `#222839` | Emerald/Purple |

### Components
1. **NeuCard (Replaces GlassCard)**:
   - `flat` variant: Standard elevated look.
   - `pressed` variant: Inset look for active states or text inputs.
   - Props for `title`, `className`, and `variant`.
2. **NeuButton**:
   - Elevated state by default.
   - `active:shadow-inner` to simulate a physical press.
   - Hover states with subtle color transitions.
3. **MagicBox Updates**:
   - The textarea will use a `pressed` (concave) shadow to feel like a recessed field.
   - Scenario buttons will be small neumorphic pills.
4. **Theme Switcher**:
   - A neumorphic toggle button (sun/moon icon) fixed in the top right.

## Data Flow
- `theme` state (light | dark) persisted in `localStorage`.
- CSS variables updated dynamically based on the active theme.

## Testing Strategy
- **Visual Verification**: Confirm shadows render correctly in both light and dark modes.
- **Persistence**: Ensure theme choice survives page reload.
- **Accessibility**: Verify contrast ratios for text on the neumorphic backgrounds.

## Implementation Phases
1. **Variables & Core Styles**: Define neumorphic utility classes in `index.css`.
2. **Theme Switcher**: Add toggle logic and persistence.
3. **Component Refactor**: Update `NeuCard` and `MagicBox`.
4. **App Layout**: Polish the overall command center look.
