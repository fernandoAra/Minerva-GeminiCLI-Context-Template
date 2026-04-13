# SCRATCHPAD

## Current State

**Status**: MVP BUILT — READY FOR HUMAN CONTENT REVIEW
**Active milestone**: M2 — Content review and deployment prep
**Last session**: 2026-04-14

**Next actions**:
- [ ] Replace the footer placeholder with the final official Minerva admissions URL or approved reference text
- [ ] Review all admissions-specific wording with a human who owns current policy guidance
- [ ] Publish to GitHub Pages and test print output on a real browser

**Open questions**:
- Which official Minerva admissions page should be linked in the footer at launch?
- Should predicted exam documentation language be narrowed for specific credential systems after human review?
- Does the final project live in this repo or move to a dedicated deployment repo?

---

## Milestones

### M0 — Project Initialization

- [x] Clone template repository
- [x] Fill in `GEMINI.md` project identity section
- [x] **Define AI Guardrails**: In `DECISIONS.md`, document how this project handles data privacy and human accountability
- [x] Define milestones M1–M3 below
- [ ] Push initial commit to GitHub
- [ ] Enable GitHub Pages in repository settings
- [ ] Confirm live URL is accessible

### M1 — Guided document navigator MVP

Users can answer a short branching questionnaire and leave with a printable summary of likely school documents, likely submitter roles, blockers, and next steps.

**Values checklist**:
- [x] **Learning**: Deepens understanding and invites participation through a branching flow
- [x] **Agency**: Supports human follow-up instead of replacing official guidance
- [x] **Privacy**: Uses only local non-sensitive state and no real records
- [x] **Transparency**: Keeps the visible AI-assisted disclosure and helper-tool disclaimer

**Acceptance criteria**:
- [x] A landing page explains what the tool does, who it is for, and what users will get
- [x] Applicants and counselors can complete a branching questionnaire with visible progress
- [x] Results summarize likely documents, likely submitter responsibilities, blockers, next steps, and a printable checklist
- [x] Progress, checklist state, and reset behavior work with `localStorage`

### M2 — Content review and deployment prep

The MVP is reviewed for admissions-language accuracy, linked to the correct official guidance, and prepared for GitHub Pages delivery.

**Values checklist**:
- [ ] Learning
- [x] Agency
- [x] Privacy
- [x] Transparency

**Acceptance criteria**:
- [ ] A human reviewer signs off on admissions-specific wording
- [ ] The footer points to the approved official Minerva guidance
- [ ] The live GitHub Pages deployment is tested on mobile and desktop

### M3 — Expanded clarity and QA

The app gains polished edge-case handling, stronger review notes, and broader manual QA without changing the static architecture.

**Values checklist**:
- [ ] Learning
- [x] Agency
- [x] Privacy
- [x] Transparency

**Acceptance criteria**:
- [ ] Additional edge cases are reviewed with a policy owner
- [ ] Accessibility and print behavior are manually tested in multiple browsers
- [ ] Any copy or logic refinements remain readable without adding framework complexity

---

## Session Log

### 2026-04-14

Found the untouched Minerva template. Built the Transcript & School Documents Navigator MVP in static HTML/CSS/JS with a landing page, role-based questionnaire, branching result summary, local checklist persistence, reset action, and print-friendly results. Left the project in an MVP-complete state pending human review of admissions wording, official-link replacement, and deployment.

**AI Tool(s) Used**: Codex (GPT-5), April 2026
**Purpose**: UI implementation, questionnaire logic, content structuring, and project-context updates
**Modifications & Verification**: Replaced the template placeholder app with a full static navigator, updated context files, and performed local code sanity checks on the JavaScript logic and content framing. Human review is still required for admissions-specific wording and final official links.
**Learning Reflection**: The AI assistance accelerated implementation while keeping the rule logic transparent enough to inspect quickly and revise by hand.
**Session Link/Context**: Single build session to turn the Minerva template into a static admissions-helper MVP for applicants and counselors.

---

### Disclosure Template

*Copy and fill this for each session where significant AI was used (from Part 3.5 of Student Guardrails).*

**AI Tool(s) Used**: [e.g., Gemini 1.5 Pro, March 2026]
**Purpose**: [e.g., brainstorming, outlining, debugging, editing]
**Modifications & Verification**: [What did you change? How did you verify the AI's accuracy?]
**Learning Reflection**: [What value did this AI use add to your learning or work quality?]
**Session Link/Context**: [Briefly describe the chat session or provide a link if possible]
