# Design Specification: On-Call Copilot UI (Command Center)

**Status**: Draft
**Date**: 2026-03-15
**Feature**: Active Incident Response Dashboard
**Tech Stack**: Vite 8 + React (TypeScript) + Tailwind CSS

---

## 1. Overview
A high-density, real-time dashboard for on-call engineers to triage incidents using raw data inputs (logs, alerts, metrics). The UI follows a **Glassmorphism** aesthetic, emphasizing transparency, blur, and vibrant accents against a dark theme.

## 2. User Experience (UX)
### 2.1 Primary Workflow: "The Magic Box"
1.  **Input**: User pastes raw, unstructured text (mixed logs, JSON alerts, terminal output) into a large centered "Magic Box" text area.
2.  **AI-Assisted Structuring**: On submission, the UI shows a "Scanning & Structuring" animation. 
    - *Client Side*: Prepares the request.
    - *Backend (New)*: A pre-processing step uses Gemini to map the raw text to the `INCIDENT_INPUT_SCHEMA`.
3.  **Analysis**: The structured JSON is automatically invoked via the LangGraph `/invoke` endpoint.
4.  **Results**: A 2x2 grid of "Agent Cards" populates with the analysis results.

## 3. Visual Design (Glassmorphism)
### 3.1 Global Styles
- **Background**: `bg-slate-950` with subtle "Aurora" gradients (`blur-3xl`, `opacity-20`) in primary colors (blue, purple, red).
- **Cards**: `bg-white/10`, `backdrop-blur-md`, `border border-white/20`, `shadow-xl`.
- **Accents**: 
    - SEV1: `text-red-400`, `shadow-red-500/50`
    - SEV2: `text-orange-400`, `shadow-orange-500/50`
    - Actions: `text-emerald-400`

## 4. Components
### 4.1 MagicBox (Input)
- **State**: Empty, Typing, Processing, Result.
- **UI**: Large translucent `textarea`. Focus adds a glowing `ring-2` with the severity color.
- **Action**: `Cmd+Enter` or "Analyze Incident" button.

### 4.2 AgentGrid (2x2)
- **Card A: Triage Agent**
    - List of "Immediate Actions" with status checkboxes.
    - "Root Causes" with confidence progress bars (`bg-emerald-500/20` fill).
- **Card B: Summary Agent**
    - "What Happened" narrative block.
    - Status Badge: `ONGOING`, `MITIGATED`, etc.
- **Card C: Comms Agent**
    - Tabs: `Slack Update`, `Stakeholder Update`.
    - One-click "Copy to Clipboard" buttons.
- **Card D: PIR Agent**
    - Vertical timeline of incident events.
    - "Prevention Actions" table.

## 5. Technical Implementation
### 5.1 Project Structure
```text
frontend/
├── src/
│   ├── components/
│   │   ├── GlassCard.tsx
│   │   ├── MagicBox.tsx
│   │   ├── AgentGrid/
│   │   └── Layout/
│   ├── hooks/
│   │   └── useIncidentAnalysis.ts
│   ├── services/
│   │   └── api.ts
│   └── App.tsx
├── tailwind.config.js
└── vite.config.ts
```

### 5.2 Key Dependencies
- `vite`: ^8.0.0
- `tailwindcss`: ^4.0.0
- `lucide-react`: For iconography.
- `framer-motion`: For Glassmorphism entrance animations and "Processing" states.

## 6. Success Criteria
- [ ] Raw logs/alerts are successfully structured into JSON by the AI.
- [ ] Dashboard populates 4 agents in under 10 seconds.
- [ ] User can copy a Slack update with a single click.
- [ ] UI remains performant with large log datasets (up to 100 lines).
