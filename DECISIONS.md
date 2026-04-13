# Architecture Decision Record

> Log every significant technical or design decision here.
> This file is **append-only** — never edit or remove past decisions.
> A decision is significant if a future session would benefit from knowing why it was made.

**Format for each entry:**

```
## Decision NNN — [Short title]
**Date**: YYYY-MM-DD
**Decision**: [What was decided, in one sentence]
**Rationale**: [Why this was the right choice for this project]
**Alternatives considered**: [What else was on the table]
**Trade-offs**: [What we gain, what we give up]

**Guardrails Alignment**:
- **Privacy & IP**: [How does this decision protect student data and clarify ownership?]
- **Disclosure**: [How will this choice be disclosed to users/stakeholders?]
- **Responsibility**: [Who is the human responsible for this decision's impact?]
- **Bias & Trust**: [What measures mitigate bias in this specific choice?]
- **Values**: [Which core Minerva value does this align with?]
```

---

## Decision 001 — Vanilla HTML/CSS/JS, no framework

**Date**: [YYYY-MM-DD]
**Decision**: Use plain HTML, CSS, and JavaScript with no build step and no framework.
**Rationale**: GitHub Pages hosts static files directly. No framework means no build pipeline, no dependencies to update, no abstraction between the code and the browser. The project remains readable and modifiable by anyone with basic web knowledge, which aligns with the learning-orientation principle of clarity over cleverness.
**Alternatives considered**: React, Vue, Svelte — all require a build step or CDN dependency; Astro — adds complexity for a single-page app
**Trade-offs**: We lose component reuse patterns and reactive state management. We gain zero setup friction, full control over output, and a codebase that doesn't rot when npm packages break.

## Decision 002 — Ethical AI & Data Privacy Guardrails

**Date**: [YYYY-MM-DD]
**Decision**: Adoption of Minerva University's AI Guardrails for all project development and deployment.
**Rationale**: To protect data privacy (especially student PII), ensure intellectual property integrity, and maintain human-centered learning. This project prioritizes human agency and accountability, treating AI as a "thinking partner" rather than a substitute.
**Specific Guardrails for this Project**:
1. **No Sensitive Data**: The app will not store or process real student records or PII.
2. **Human-in-the-Loop**: All AI-suggested code and content are reviewed by the human developer before commit.
3. **Mandatory Disclosure**: AI use is logged in `SCRATCHPAD.md`.
**Trade-offs**: Development may be slower due to mandatory human review and documentation overhead, but the resulting system is more ethical, secure, and aligned with institutional values.

<!-- Add new decisions below, incrementing the number. -->

## Decision 003 — Keep admissions guidance rule-based, local, and explicitly unofficial

**Date**: 2026-04-14
**Decision**: Build the document navigator as a transparent rule-based questionnaire with static content, local-only persistence, and visible disclaimers that it is a helper rather than official admissions policy.
**Rationale**: This project needs to be easy to inspect, safe for GitHub Pages, and careful about admissions-specific claims. A plain decision tree keeps the logic readable, avoids storing sensitive data, and makes it obvious where human review is still required.
**Alternatives considered**: A longer freeform FAQ page with no interaction; a more dynamic scoring or recommendation engine; an AI chat assistant for document guidance
**Trade-offs**: The questionnaire is less flexible than a richer advisory system and will need manual content updates as policies evolve. In return, the MVP remains understandable, auditable, privacy-safe, and honest about uncertainty.

**Guardrails Alignment**:
- **Privacy & IP**: No real applicant documents, uploads, or personal data are processed; only non-sensitive local progress state is stored.
- **Disclosure**: The UI keeps a visible AI-assisted badge, and admissions guidance is labeled as helper content that must be verified against official Minerva requirements.
- **Responsibility**: The human project owner remains responsible for reviewing admissions wording, maintaining policy accuracy, and approving launch content.
- **Bias & Trust**: Transparent rules reduce hidden inference and keep edge-case uncertainty visible instead of pretending to provide authoritative decisions.
- **Values**: Aligns with clarity over cleverness, human agency, and accountable AI use.
