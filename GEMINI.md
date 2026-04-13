# Transcript & School Documents Navigator — Project Context

## Project Identity

**Name**: Transcript & School Documents Navigator
**Purpose**: A static helper that walks Minerva applicants and school counselors through a short decision flow so they can identify likely school documents, likely submitter responsibilities, common blockers, and practical next steps.
**Audience**: Minerva applicants plus counselors and school officials who need a plain-language orientation before checking official admissions requirements.
**Human context**: This app reduces confusion around transcripts and school-submitted records, helps people catch missing-school edge cases earlier, and supports better human follow-up without pretending to be official admissions policy.

**GitHub repo**: Local project currently cloned from `bhwilkoff/Minerva-GeminiCLI-Context-Template`; update this once the app has its own repository.
**Live URL**: To be set when the project is published to GitHub Pages

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript — no framework, no build step
- **Hosting**: GitHub Pages (static only — no server-side code, no databases)
- **Data / Auth**: `localStorage` only for non-sensitive questionnaire progress and checklist state
- **Cost**: $0


## Key Files and Directories

```
index.html          Main application entry point
css/styles.css      All styles (mobile-first, custom properties)
js/app.js           Questionnaire logic, results generation, local storage
SCRATCHPAD.md       Session state, milestone log, open questions
DECISIONS.md        Architecture decision record (append-only)
GEMINI.md           This file — project context and standing instructions
```

### Interactive Setup Protocol (For New Projects)

If the student indicates they are starting a new project (e.g., "Start," "Setup," or "I have an idea"), follow this stepwise workflow:

1. **Project Identity**: Gather the Name, Purpose, Audience, and Human Context.
2. **Milestone Planning**: Turn their goals into M1, M2, and M3 in `SCRATCHPAD.md`.
3. **Deployment**: Ask for the GitHub username or repo details needed for Pages deployment.
4. **Automatic Formatting**: Update `GEMINI.md` and `SCRATCHPAD.md` so the repo context stays current.

---

### Tutor Mode (Always On)

For students with varying technical backgrounds:
- **Explain the "Why"**: Before making a code change, briefly explain the purpose of the implementation choice in 1-2 sentences.
- **Invite Questions**: Occasionally ask whether they want a specific part of the code explained.
- **Code Clarity**: Use descriptive variable names and comments only where they materially improve readability.

---

## Conventions

- Milestones are numbered M1, M2, M3... in `SCRATCHPAD.md`
- Every significant technical or design choice is logged in `DECISIONS.md`
- At the end of every session, update the "Current State" block in `SCRATCHPAD.md`
- Append a brief session log entry at the bottom of `SCRATCHPAD.md`
- Keep the UI explicitly disclosed as AI-assisted
- Keep the app plainly labeled as a helper, not official admissions policy

---

## Standing Instructions for Codex

### Learning Orientation & Ethical AI — Non-Negotiable

Before implementing any feature, evaluate it against these criteria. If a feature fails, surface the conflict and propose an alternative that passes before proceeding.

1. **Does it deepen understanding?**
   The user should leave with better clarity about their likely document path, not just a static answer.

2. **Does it invite participation, not consumption?**
   The app should ask users to make choices, compare their situation to the checklist, and verify with official guidance.

3. **Does it support human agency?**
   The app should help applicants and counselors organize next steps without replacing human judgment or official admissions guidance.

4. **Human-Centered Accountability**
   AI is a thinking partner, not a substitute. The human developer remains responsible for the accuracy and framing of all content.

5. **Clarity over cleverness**
   Prefer transparent rule-based logic over opaque heuristics or unnecessary abstraction.

6. **Accessible by default**
   WCAG-minded structure from the first line of code: semantic HTML, keyboard support, clear labels, and sufficient color contrast.

7. **Responsive from the start**
   Mobile-first design first, then expand to larger screens.

### Data Privacy & Security Guardrails

- **Source of Truth**: The full `Guardrails Docs/` folder remains the reference for ethical and technical boundaries.
- **Zero-Trust for Sensitive Data**: Never upload or process identifiable student records, unpublished institutional materials, or private PII within this AI session or the app itself.
- **Anonymization**: Testing data must be synthetic or fully anonymized.
- **No Persistence of Secrets**: Never commit API keys, secrets, or environment variables. Use `localStorage` only for non-sensitive client-side state.

### Transparency & Disclosure

- **Mandatory Disclosure**: Significant AI contributions are logged in `SCRATCHPAD.md`.
- **Visual Attribution**: The web app must include a visible "AI-Assisted" disclosure in the UI.
- **Policy Framing**: Admissions-related content must be framed as likely guidance that should be verified against official Minerva admissions requirements.

### Autonomous Work Guidelines

- Read `SCRATCHPAD.md` and `DECISIONS.md` when context is ambiguous.
- Choose the simpler implementation when two approaches work.
- Do not add extra product scope beyond the requested MVP.
- Keep the document logic readable in under 30 seconds.
- If admissions content feels too policy-specific to infer safely, mark it for human review instead of overstating certainty.

### Memory and Continuity

- `SCRATCHPAD.md` "Current State" block = source of truth for current progress
- `DECISIONS.md` is append-only — never edit or remove past decisions
- Git history is long-term memory — commit meaningful snapshots
- If context is ambiguous, read `SCRATCHPAD.md` and `DECISIONS.md` before asking
