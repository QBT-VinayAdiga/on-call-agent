# Neumorphic UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the On-Call Copilot UI into a neumorphic design with a theme switcher for light and dark modes.

**Architecture:** Use CSS variables for theme-dependent colors and shadows. Implement a `theme` state in `App.tsx` that toggles a `.dark` class on the root element. Refactor existing components to use these variables for a cohesive neumorphic "extruded" or "pressed" look.

**Tech Stack:** React (TypeScript), Tailwind CSS, Lucide Icons.

---

## Chunk 1: Core Styles & Theme Logic

### Task 1: Update index.css with Neumorphic Variables

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Define CSS variables for both themes**

```css
@import "tailwindcss";

:root {
  --bg: #e0e5ec;
  --shadow-dark: #a3b1c6;
  --shadow-light: #ffffff;
  --text: #4a5568;
  --accent: #3b82f6;
}

.dark {
  --bg: #1a1f2c;
  --shadow-dark: #12161f;
  --shadow-light: #222839;
  --text: #e2e8f0;
  --accent: #10b981;
}

body {
  background-color: var(--bg);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Neumorphic Utilities */
.neu-flat {
  background: var(--bg);
  box-shadow: 9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light);
}

.neu-pressed {
  background: var(--bg);
  box-shadow: inset 9px 9px 16px var(--shadow-dark), inset -9px -9px 16px var(--shadow-light);
}

.neu-button {
  background: var(--bg);
  box-shadow: 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light);
  transition: all 0.2s ease;
}

.neu-button:active {
  box-shadow: inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light);
  transform: scale(0.98);
}
```

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/index.css
git commit -m "style: add neumorphic CSS variables and utility classes"
```

### Task 2: Implement Theme Toggle Logic in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add theme state and persistence**

```tsx
import { useState, useEffect } from 'react';

// Inside App component:
const [theme, setTheme] = useState<'light' | 'dark'>(
  () => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
);

useEffect(() => {
  document.documentElement.className = theme;
  localStorage.setItem('theme', theme);
}, [theme]);

const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
```

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add theme toggle logic and persistence"
```

---

## Chunk 2: Component Refactor

### Task 3: Refactor GlassCard to NeuCard

**Files:**
- Modify: `frontend/src/components/GlassCard.tsx` (Rename to `NeuCard.tsx`)
- Modify: `frontend/src/App.tsx` (Update imports)

- [ ] **Step 1: Rename file and update component**

```tsx
// frontend/src/components/NeuCard.tsx
import React from 'react';

interface NeuCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'flat' | 'pressed';
}

export const NeuCard = ({ children, title, className = "", variant = 'flat' }: NeuCardProps) => (
  <div className={`${variant === 'flat' ? 'neu-flat' : 'neu-pressed'} rounded-[30px] p-6 ${className}`}>
    {title && <h3 className="text-lg font-bold mb-4 opacity-80 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);
```

- [ ] **Step 2: Update imports in App.tsx and MagicBox.tsx**

- [ ] **Step 3: Commit changes**

```bash
git add frontend/src/components/NeuCard.tsx frontend/src/App.tsx frontend/src/components/MagicBox.tsx
git commit -m "refactor: replace GlassCard with NeuCard"
```

### Task 4: Update MagicBox for Neumorphism

**Files:**
- Modify: `frontend/src/components/MagicBox.tsx`

- [ ] **Step 1: Update scenario buttons and textarea**

- Use `neu-button` for scenario buttons.
- Use `neu-pressed` for the textarea container.
- Update colors to use `var(--text)` and `var(--accent)`.

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/components/MagicBox.tsx
git commit -m "style: update MagicBox with neumorphic elements"
```

---

## Chunk 3: Layout & Final Polish

### Task 5: Add ThemeToggle Component

**Files:**
- Create: `frontend/src/components/ThemeToggle.tsx`

- [ ] **Step 1: Create the toggle button component**

```tsx
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ theme, onToggle }: { theme: 'light' | 'dark', onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="fixed top-8 right-8 p-4 rounded-full neu-button text-accent z-50"
  >
    {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
  </button>
);
```

- [ ] **Step 2: Add ThemeToggle to App.tsx**

- [ ] **Step 3: Commit changes**

```bash
git add frontend/src/components/ThemeToggle.tsx frontend/src/App.tsx
git commit -m "feat: add ThemeToggle component"
```

### Task 4: Final Layout Adjustments

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Remove aurora background and update header/container styles**

- Use `var(--text)` for typography.
- Ensure all gradients and hardcoded colors are replaced with theme-aware classes or variables.

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/App.tsx
git commit -m "style: final layout polish for neumorphic UI"
```
