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

## Decision 004 — Use a staged intake before the questionnaire

**Date**: 2026-04-28
**Decision**: Separate the start of the flow into two explicit intake steps: role selection and “what kind of help do you need?” goal selection before showing branching questions.
**Rationale**: The MVP jumped too quickly from landing page to generic questions. The staged intake makes the flow feel more intentional, gives users a clearer mental model, and lets the result emphasize either document discovery, submission ownership, or incomplete-file troubleshooting without pretending those are the same task.
**Alternatives considered**: Keep the single-step role start; infer the goal from later answers; add a more complex multi-screen wizard with many up-front setup questions
**Trade-offs**: The flow gains one more early decision point, but users get a clearer path, more relevant follow-up questions, and a better reason to trust the resulting checklist.

**Guardrails Alignment**:
- **Privacy & IP**: The intake adds no sensitive data collection and continues to use only local non-sensitive state.
- **Disclosure**: The clearer framing helps users understand that the app is a helper workflow, not an official recommendation engine.
- **Responsibility**: The human project owner remains responsible for deciding which goals and branches are appropriate to include.
- **Bias & Trust**: Explicit goal selection reduces hidden inference and makes the branching logic easier to inspect.
- **Values**: Aligns with clarity over cleverness, human agency, and accessible product design.

## Decision 005 — Add static support content inside the app instead of a chatbot-style help layer

**Date**: 2026-04-28
**Decision**: Add glossary, FAQ, and role-specific guidance directly in the static page rather than using an embedded chat helper or collapsible “AI advice” layer.
**Rationale**: The project’s value comes from transparent, inspectable, print-friendly guidance. Static support content is easier to review for policy accuracy, works well on GitHub Pages, improves accessibility, and gives users useful context without introducing opaque behavior.
**Alternatives considered**: Keep no support content; add a floating AI helper; move guidance into a separate reference page
**Trade-offs**: The page becomes longer and requires more editorial maintenance. In return, the guidance remains readable, auditable, and available even when users do not want to explore every branch of the questionnaire.

**Guardrails Alignment**:
- **Privacy & IP**: Static reference content avoids collecting extra user input and does not require any external processing.
- **Disclosure**: The support content remains plainly visible and easier to review alongside the AI-assisted disclosure.
- **Responsibility**: Human reviewers can edit and approve each support section directly in the codebase.
- **Bias & Trust**: Static copy reduces the risk of inconsistent or overly confident dynamic advice.
- **Values**: Aligns with accessibility, clarity, and accountable AI use.

## Decision 006 — Group the checklist by action timing instead of scoring the whole file

**Date**: 2026-04-28
**Decision**: Turn the result into a grouped action checklist (“Do first,” “Confirm with school,” and “If the file still looks incomplete”) rather than assigning a single score or confidence rating to the application.
**Rationale**: Users do not mainly need a numeric answer; they need a better next conversation and a clearer working plan. Grouping actions by timing makes the summary more useful to print, share, or review with a human, while avoiding false precision.
**Alternatives considered**: Add a completion score; rank every item with a weighted severity system; keep the old flat checklist
**Trade-offs**: The grouped checklist is less compact than a score and requires more content work, but it is far more actionable and better aligned with the product’s helper role.

**Guardrails Alignment**:
- **Privacy & IP**: The checklist remains local-only and does not require any personal document storage.
- **Disclosure**: The grouped checklist reinforces that the tool is guiding action planning, not making official determinations.
- **Responsibility**: The human project owner remains responsible for reviewing whether the grouped steps are accurate and appropriately cautious.
- **Bias & Trust**: Avoiding a single score reduces the risk that users over-read a heuristic output as an official assessment.
- **Values**: Aligns with human agency, clarity, and learning-oriented design.
