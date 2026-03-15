# Design Specification: On-Call Copilot UI (Material Design 3)

**Status**: Active
**Date**: 2026-03-15
**Feature**: Active Incident Response Dashboard
**Tech Stack**: Vite 8 + React (TypeScript) + Tailwind CSS 4

---

## 1. Overview
A professional, high-density command center for on-call engineers to triage incidents. The UI follows **Material Design 3 (M3)** principles, emphasizing clarity, elevation-based hierarchy, and a sophisticated color system for both Light and Dark modes.

## 2. User Experience (UX)
### 2.1 Primary Workflow: "The Magic Box"
1.  **Input**: User pastes raw, unstructured text (logs, alerts, metrics) into the "Magic Box".
2.  **Scenarios**: One-tap buttons for common incident types (Checkout Latency, DB Timeout, API Spike).
3.  **Analysis**: AI-powered synthesis across four specialized agents: Triage, Summary, Comms, and PIR.
4.  **Results**: An adaptive grid of M3 Elevated Cards providing actionable insights.

## 3. Visual Design (Material Design 3)
### 3.1 Color System
- **Primary**: Brand identity and main actions.
- **Secondary/Tertiary**: Complementary roles and specialized agent accents.
- **Surface**: Adaptive background for containers (Elevated, Filled, Outlined).
- **Error**: High-visibility alerts and critical status.

### 3.2 Elevation & Surfaces
- **Level 1 (Elevated)**: Default state for Agent Cards and the Magic Box.
- **Level 2 (Hover)**: Interaction feedback for cards.
- **Tonal Surfaces**: Background variants for grouping and hierarchy (e.g., scenarios buttons).

### 3.3 Typography & Geometry
- **Font**: Inter Variable (System-ui fallback).
- **Rounding**: 
    - Buttons: 100px (Full)
    - Small Containers: 12px (M3 Medium)
    - Large Cards: 16px (M3 Large)
    - Header Accents: 28px (M3 Extra Large)

## 4. Components
### 4.1 MagicBox (Input)
- **Style**: Elevated M3 Card with a Tonal surface for the text area.
- **Actions**: "Analyze Incident" (Filled Button) and "Clear" (Icon Button).
- **Feedback**: Pulse animation during "Synthesizing" state.

### 4.2 Agent Cards (Grid)
- **Triage**: Remediation steps with status checkboxes and priority badges.
- **Summary**: Executive narrative with a high-visibility status badge.
- **Comms**: Mono-spaced update templates with integrated "Copy to Clipboard" feedback.
- **PIR**: Vertical timeline with M3-styled markers and event details.

## 5. Technical Implementation
### 5.1 Project Structure
```text
frontend/
├── src/
│   ├── components/
│   │   ├── M3Card.tsx       # Core M3 Container
│   │   ├── MagicBox.tsx     # Incident Input
│   │   ├── ThemeToggle.tsx  # Icon Button
│   │   └── ...
│   ├── hooks/
│   │   └── useIncidentAnalysis.ts
│   └── App.tsx              # Main Layout & Grid
├── index.css                # M3 Tokens & Utilities
└── vite.config.ts
```

### 5.2 Key Dependencies
- `tailwindcss`: ^4.2.1 (Using @theme block for M3 tokens)
- `lucide-react`: Iconography.
- `framer-motion`: Transition and entrance animations.

## 6. Success Criteria
- [x] Full support for Light and Dark modes using M3 color tokens.
- [x] Responsive grid adapting from 1 to 2 columns.
- [x] Clear visual hierarchy using elevation instead of high-contrast borders.
- [x] Accessible interaction states (hover, active, disabled) on all buttons.
