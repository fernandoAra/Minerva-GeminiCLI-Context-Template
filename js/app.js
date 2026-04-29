/**
 * Transcript & School Documents Navigator
 *
 * Static client-side app only:
 * - staged intake
 * - rule-based branching questions
 * - local progress and checklist state
 * - printable summary
 */

const STORAGE_KEY = 'transcript-school-documents-navigator-v2';

const ROLE_OPTIONS = {
  applicant: {
    label: 'Applicant',
    description: 'Use this if you are trying to understand your own likely document path.',
    detail: 'Best when you want a plain-language checklist before checking official requirements.',
  },
  counselor: {
    label: 'Counselor / school official',
    description: 'Use this if you are helping a student or managing school-side document questions.',
    detail: 'Best when you need a quick handoff summary for current, former, or school-submitted records.',
  },
};

const GOAL_OPTIONS = {
  document_path: {
    label: 'Figure out which documents probably matter',
    description: 'Use this when the main question is “what school records are likely in scope?”',
    detail: 'This path emphasizes transcripts, school history, predicted materials, and final results.',
  },
  submission_path: {
    label: 'Figure out who probably needs to submit what',
    description: 'Use this when the main question is whether the applicant or the school owns the next step.',
    detail: 'This path emphasizes upload ownership, counselor roles, and school-submitted materials.',
  },
  incomplete_status: {
    label: 'Figure out why the application may still look incomplete',
    description: 'Use this when records may already exist, but the application still is not showing as complete.',
    detail: 'This path emphasizes blockers, process mismatches, and follow-up questions for a human review.',
  },
};

const questionBank = [
  {
    id: 'currentlySecondary',
    stage: 'School history',
    summaryLabel: 'Current secondary-school status',
    prompt: {
      applicant: 'Is the applicant still in secondary school right now?',
      counselor: 'Is the student still in secondary school right now?',
    },
    help:
      'This changes whether the file is more likely to depend on a current transcript, a final completion record, or both at different times.',
    options: [
      {
        value: 'yes',
        label: 'Yes, still in secondary school',
        hint: 'Current grades or a current transcript are more likely to matter first.',
      },
      {
        value: 'no',
        label: 'No, secondary school is already complete',
        hint: 'A final transcript or completion record becomes the stronger starting point.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Keep the result broader until the current school status is confirmed.',
      },
    ],
  },
  {
    id: 'multipleSchools',
    stage: 'School history',
    summaryLabel: 'More than one recent secondary school',
    prompt: {
      applicant: 'Has the applicant attended more than one secondary school in the last 3 years?',
      counselor: 'Has the student attended more than one secondary school in the last 3 years?',
    },
    help:
      'A recent school change is one of the most common reasons a former transcript or record source gets overlooked.',
    options: [
      {
        value: 'yes',
        label: 'Yes, more than one recent secondary school',
        hint: 'Expect at least one extra record source to review.',
      },
      {
        value: 'no',
        label: 'No, only one recent secondary school',
        hint: 'The secondary-school side is probably simpler to map.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'If there was any school change or transfer, confirm the timeline before moving on.',
      },
    ],
  },
  {
    id: 'previousRecordsAvailable',
    stage: 'School history',
    summaryLabel: 'Former-school records accounted for',
    prompt: {
      applicant: 'Do you already have records or a clear plan for each recent secondary school?',
      counselor: 'Does the file already have records or a clear plan for each recent secondary school?',
    },
    help:
      'Even when one school is current, a former school may still need to be represented somewhere in the record trail.',
    condition: (currentState) => {
      const answer = currentState.answers.multipleSchools;
      return answer === 'yes' || answer === 'not_sure';
    },
    options: [
      {
        value: 'yes',
        label: 'Yes, each school is accounted for',
        hint: 'The main risk shifts away from missing former-school records.',
      },
      {
        value: 'no',
        label: 'No, at least one former-school record still needs attention',
        hint: 'This is a strong blocker signal.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Treat the former-school part of the file as unresolved until confirmed.',
      },
    ],
  },
  {
    id: 'previousSchoolDelay',
    stage: 'School history',
    summaryLabel: 'Former-school records hard to obtain',
    prompt: {
      applicant: 'Is any former-school record hard to get because the school is slow, closed, or difficult to contact?',
      counselor: 'Is any former-school record hard to get because the school is slow, closed, or difficult to contact?',
    },
    help:
      'This is different from not knowing what is needed. It means the record source itself may be delayed or fragile.',
    condition: (currentState) => {
      const recordsAnswer = currentState.answers.previousRecordsAvailable;
      return recordsAnswer === 'no' || recordsAnswer === 'not_sure';
    },
    options: [
      {
        value: 'yes',
        label: 'Yes, at least one former-school source is difficult to reach',
        hint: 'Plan follow-up early because these requests often take the longest.',
      },
      {
        value: 'no',
        label: 'No, the source exists and can be contacted',
        hint: 'The remaining issue may be ownership or timing rather than access.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'If the source is unclear, treat the former-school path as a live risk.',
      },
    ],
  },
  {
    id: 'attendedCollege',
    stage: 'School history',
    summaryLabel: 'Any college or university history',
    prompt: {
      applicant: 'Has the applicant already attended university or college at any point?',
      counselor: 'Has the student already attended university or college at any point?',
    },
    help:
      'Even short or incomplete postsecondary study may add another transcript source worth checking.',
    options: [
      {
        value: 'yes',
        label: 'Yes',
        hint: 'A postsecondary transcript check becomes more important.',
      },
      {
        value: 'no',
        label: 'No',
        hint: 'The record map can stay focused on the school history before college.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Confirm whether any postsecondary enrollment should appear in the file.',
      },
    ],
  },
  {
    id: 'collegeRecordsAvailable',
    stage: 'School history',
    summaryLabel: 'Postsecondary records available',
    prompt: {
      applicant: 'If there is college or university history, are those records already available or requested?',
      counselor: 'If there is college or university history, are those records already available or requested?',
    },
    help:
      'This question only checks whether the record source is under control. It does not decide official policy by itself.',
    condition: (currentState) => {
      const answer = currentState.answers.attendedCollege;
      return answer === 'yes' || answer === 'not_sure';
    },
    options: [
      {
        value: 'yes',
        label: 'Yes, those records are available or already being handled',
        hint: 'That reduces one common blocker.',
      },
      {
        value: 'no',
        label: 'No, those records still need attention',
        hint: 'Treat postsecondary history as an active follow-up item.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Confirm this before assuming the school-only record path is complete.',
      },
    ],
  },
  {
    id: 'predictedScores',
    stage: 'Current-school documents',
    summaryLabel: 'Predicted or school-submitted exam documentation',
    prompt: {
      applicant: 'Will the application likely rely on predicted exam scores or another school-submitted exam document?',
      counselor: 'Will the application likely rely on predicted exam scores or another school-submitted exam document?',
    },
    help:
      'This helper treats predicted or school-submitted exam materials as a separate record path because they often come directly from the school.',
    condition: (currentState) => currentState.answers.currentlySecondary !== 'no',
    options: [
      {
        value: 'yes',
        label: 'Yes, that seems likely',
        hint: 'Expect at least one school-submitted document check.',
      },
      {
        value: 'no',
        label: 'No, that does not seem relevant',
        hint: 'The results will lean more on transcripts and school history.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Leave this open and verify which current-school document type is actually expected.',
      },
    ],
  },
  {
    id: 'finalResultsPending',
    stage: 'Current-school documents',
    summaryLabel: 'Final secondary results still pending',
    prompt: {
      applicant: 'Are final secondary results, leaving records, or completion documents still pending?',
      counselor: 'Are final secondary results, leaving records, or completion documents still pending?',
    },
    help:
      'A current file may depend first on interim or predicted documents and later on a final result or leaving record.',
    condition: (currentState) => currentState.answers.currentlySecondary !== 'no',
    options: [
      {
        value: 'yes',
        label: 'Yes, final results are still pending',
        hint: 'The file may need one document now and another later.',
      },
      {
        value: 'no',
        label: 'No, final results are already available or not pending',
        hint: 'The current-school document path may be easier to close.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Confirm whether there is a later document that must still be added.',
      },
    ],
  },
  {
    id: 'schoolUploadsDirectly',
    stage: 'Submission path',
    summaryLabel: 'School expected to submit directly',
    prompt: {
      applicant: 'Does it look like a counselor or school official must submit any documents directly?',
      counselor: 'Does it look like a counselor or school official must submit any documents directly?',
    },
    help:
      'The biggest handoff problems usually happen when people know a document exists but nobody is sure who must send it.',
    options: [
      {
        value: 'yes',
        label: 'Yes, at least one school-side direct submission seems likely',
        hint: 'The school probably owns part of the handoff.',
      },
      {
        value: 'no',
        label: 'No, direct school submission does not seem likely',
        hint: 'The applicant may be doing more of the upload work.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Treat upload ownership as unresolved until confirmed.',
      },
    ],
  },
  {
    id: 'uploadPathConfirmed',
    stage: 'Submission path',
    summaryLabel: 'Exact submission path already confirmed',
    prompt: {
      applicant: 'Has someone already confirmed exactly who submits each major document?',
      counselor: 'Has someone already confirmed exactly who submits each major document?',
    },
    help:
      'This is broader than one upload button. It asks whether there is a clear owner for each document source in the file.',
    options: [
      {
        value: 'yes',
        label: 'Yes, the handoff path is clear',
        hint: 'That lowers the risk of chasing the right document through the wrong person.',
      },
      {
        value: 'no',
        label: 'No, the handoff path is still unclear',
        hint: 'This is a strong reason an application may still look incomplete.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Treat the submission path as a live follow-up item.',
      },
    ],
  },
  {
    id: 'applicationIncomplete',
    stage: 'Resolve blockers',
    summaryLabel: 'Application currently marked incomplete',
    prompt: {
      applicant: 'Is the application currently showing as incomplete or missing documents?',
      counselor: 'Is the application currently showing as incomplete or missing documents?',
    },
    help:
      'This helper can be used either to prevent confusion or to investigate a live incomplete status.',
    options: [
      {
        value: 'yes',
        label: 'Yes',
        hint: 'The results will focus more on active blockers and follow-up.',
      },
      {
        value: 'no',
        label: 'No',
        hint: 'The results will focus more on prevention and planning.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'If the status is unclear, keep the blocker review broad.',
      },
    ],
  },
  {
    id: 'incompleteReasonUnclear',
    stage: 'Resolve blockers',
    summaryLabel: 'Reason for incomplete status is unclear',
    prompt: {
      applicant: 'If the file looks incomplete, is the reason still unclear?',
      counselor: 'If the file looks incomplete, is the reason still unclear?',
    },
    help:
      'This separates known missing items from cases where the problem may be document matching, upload ownership, or former-school gaps.',
    condition: (currentState) => {
      const answer = currentState.answers.applicationIncomplete;
      return answer === 'yes' || answer === 'not_sure';
    },
    options: [
      {
        value: 'yes',
        label: 'Yes, the reason is still unclear',
        hint: 'Expect more process-focused follow-up in the summary.',
      },
      {
        value: 'no',
        label: 'No, there is already a clear missing-item explanation',
        hint: 'The summary can stay more targeted.',
      },
    ],
  },
  {
    id: 'sentButNotMatched',
    stage: 'Resolve blockers',
    summaryLabel: 'Something was sent but still not marked complete',
    prompt: {
      applicant: 'Has anyone already sent a document that still does not appear as complete?',
      counselor: 'Has anyone already sent a document that still does not appear as complete?',
    },
    help:
      'When a document exists but still is not marked complete, the problem may be timing, matching, or the wrong submission source.',
    condition: (currentState) => {
      const answer = currentState.answers.applicationIncomplete;
      return answer === 'yes' || answer === 'not_sure';
    },
    options: [
      {
        value: 'yes',
        label: 'Yes',
        hint: 'That usually points to a process or matching issue.',
      },
      {
        value: 'no',
        label: 'No',
        hint: 'The issue may still be a truly missing record or a missing handoff.',
      },
      {
        value: 'not_sure',
        label: 'Not sure',
        hint: 'Confirm what was sent, by whom, and when.',
      },
    ],
  },
];

const questionLookup = questionBank.reduce((lookup, question) => {
  lookup[question.id] = question;
  return lookup;
}, {});

let state = createEmptyState();
let appRoot;
let contextRail;
let progressLabel;
let progressDetail;
let progressPhase;
let saveStatus;
let progressFill;
let startOverButton;
let restoredFromStorage = false;

function createEmptyState() {
  return {
    role: '',
    goal: '',
    answers: {},
    currentStepIndex: 0,
    completed: false,
    checklist: {},
    lastSaved: null,
  };
}

function init() {
  appRoot = document.getElementById('app-root');
  contextRail = document.getElementById('context-rail');
  progressLabel = document.getElementById('progress-label');
  progressDetail = document.getElementById('progress-detail');
  progressPhase = document.getElementById('progress-phase');
  saveStatus = document.getElementById('save-status');
  progressFill = document.getElementById('progress-fill');
  startOverButton = document.getElementById('start-over-button');

  appRoot.addEventListener('click', handleAppClick);
  appRoot.addEventListener('change', handleAppChange);
  startOverButton.addEventListener('click', resetFlow);

  loadState();
  renderApp();
}

function handleAppClick(event) {
  const actionTarget = event.target.closest('[data-action]');

  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  if (action === 'set-role') {
    setRole(actionTarget.dataset.role);
    return;
  }

  if (action === 'set-goal') {
    setGoal(actionTarget.dataset.goal);
    return;
  }

  if (action === 'change-role') {
    changeRole();
    return;
  }

  if (action === 'next') {
    goToNextStep();
    return;
  }

  if (action === 'back') {
    goToPreviousStep();
    return;
  }

  if (action === 'edit-results') {
    state.completed = false;
    state.currentStepIndex = Math.max(getVisibleQuestions().length - 1, 0);
    persistState();
    renderApp();
    return;
  }

  if (action === 'print-results') {
    window.print();
  }
}

function handleAppChange(event) {
  const target = event.target;

  if (target.matches('input[type="radio"][data-question-id]')) {
    state.answers[target.dataset.questionId] = target.value;
    state.completed = false;
    pruneHiddenAnswers();
    persistState();
    refreshQuestionSelection(target.dataset.questionId, target.value);
    renderStatus();
    renderContextRail();
    return;
  }

  if (target.matches('input[type="checkbox"][data-checklist-id]')) {
    state.checklist[target.dataset.checklistId] = target.checked;
    persistState();
    updateChecklistVisualState(target);
    renderStatus();
    renderContextRail();
  }
}

function setRole(role) {
  if (!ROLE_OPTIONS[role]) {
    return;
  }

  state = createEmptyState();
  state.role = role;
  persistState();
  renderApp();
}

function setGoal(goal) {
  if (!GOAL_OPTIONS[goal]) {
    return;
  }

  state.goal = goal;
  state.answers = {};
  state.currentStepIndex = 0;
  state.completed = false;
  state.checklist = {};
  persistState();
  renderApp();
}

function changeRole() {
  state = createEmptyState();
  persistState();
  renderApp();
}

function goToNextStep() {
  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[state.currentStepIndex];

  if (!currentQuestion || !state.answers[currentQuestion.id]) {
    return;
  }

  if (state.currentStepIndex >= visibleQuestions.length - 1) {
    state.completed = true;
  } else {
    state.currentStepIndex += 1;
  }

  persistState();
  renderApp();
}

function goToPreviousStep() {
  if (!state.goal) {
    changeRole();
    return;
  }

  if (state.completed) {
    state.completed = false;
    state.currentStepIndex = Math.max(getVisibleQuestions().length - 1, 0);
    persistState();
    renderApp();
    return;
  }

  if (state.currentStepIndex === 0) {
    state.goal = '';
    state.answers = {};
    state.currentStepIndex = 0;
    state.completed = false;
    state.checklist = {};
    persistState();
    renderApp();
    return;
  }

  state.currentStepIndex -= 1;
  persistState();
  renderApp();
}

function resetFlow() {
  const shouldReset = window.confirm(
    'Clear the saved progress and checklist on this device, then start over?'
  );

  if (!shouldReset) {
    return;
  }

  state = createEmptyState();
  restoredFromStorage = false;
  clearSavedState();
  renderApp();
}

function loadState() {
  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return;
    }

    const parsedState = JSON.parse(savedState);

    state = {
      ...createEmptyState(),
      ...parsedState,
      answers: isPlainObject(parsedState.answers) ? parsedState.answers : {},
      checklist: isPlainObject(parsedState.checklist) ? parsedState.checklist : {},
    };

    normalizeState();
    restoredFromStorage = Boolean(
      state.role || state.goal || Object.keys(state.answers).length || state.completed
    );
  } catch (error) {
    console.warn('[Navigator] Could not load saved state.', error);
    state = createEmptyState();
  }
}

function persistState() {
  state.lastSaved = Date.now();
  normalizeState();

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[Navigator] Could not save state.', error);
  }
}

function clearSavedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[Navigator] Could not clear saved state.', error);
  }
}

function normalizeState() {
  if (!ROLE_OPTIONS[state.role]) {
    state = createEmptyState();
    return;
  }

  if (!GOAL_OPTIONS[state.goal]) {
    state.goal = '';
    state.answers = {};
    state.currentStepIndex = 0;
    state.completed = false;
    state.checklist = {};
    return;
  }

  pruneHiddenAnswers();
  pruneChecklistState();

  const visibleQuestions = getVisibleQuestions();
  const maxIndex = Math.max(visibleQuestions.length - 1, 0);
  const safeIndex = Number.isInteger(state.currentStepIndex)
    ? state.currentStepIndex
    : Number.parseInt(state.currentStepIndex, 10);

  state.currentStepIndex = Number.isFinite(safeIndex)
    ? Math.min(Math.max(safeIndex, 0), maxIndex)
    : 0;

  if (visibleQuestions.length === 0) {
    state.completed = false;
  }
}

function pruneHiddenAnswers() {
  if (!ROLE_OPTIONS[state.role] || !GOAL_OPTIONS[state.goal]) {
    state.answers = {};
    return;
  }

  const visibleIds = new Set(getVisibleQuestions().map((question) => question.id));

  Object.keys(state.answers).forEach((questionId) => {
    const question = questionLookup[questionId];
    const answer = state.answers[questionId];
    const validOption = question && question.options.some((option) => option.value === answer);

    if (!visibleIds.has(questionId) || !validOption) {
      delete state.answers[questionId];
    }
  });
}

function pruneChecklistState() {
  if (!ROLE_OPTIONS[state.role] || !GOAL_OPTIONS[state.goal]) {
    state.checklist = {};
    return;
  }

  const validChecklistIds = new Set();
  const results = buildResults();

  results.checklistGroups.forEach((group) => {
    group.items.forEach((item) => validChecklistIds.add(item.id));
  });

  Object.keys(state.checklist).forEach((itemId) => {
    if (!validChecklistIds.has(itemId)) {
      delete state.checklist[itemId];
    }
  });
}

function getVisibleQuestions() {
  if (!ROLE_OPTIONS[state.role] || !GOAL_OPTIONS[state.goal]) {
    return [];
  }

  return questionBank.filter((question) => {
    if (!question.condition) {
      return true;
    }

    return question.condition(state);
  });
}

function renderApp() {
  renderStatus();
  renderContextRail();

  document.body.dataset.view = state.completed
    ? 'results'
    : state.goal
      ? 'questionnaire'
      : state.role
        ? 'goal'
        : 'landing';

  startOverButton.hidden = !state.role;

  if (!state.role) {
    appRoot.innerHTML = renderLandingView();
    focusAutofocusTarget();
    restoredFromStorage = false;
    return;
  }

  if (!state.goal) {
    appRoot.innerHTML = renderGoalView();
    focusAutofocusTarget();
    restoredFromStorage = false;
    return;
  }

  if (state.completed) {
    appRoot.innerHTML = renderResultsView();
    focusAutofocusTarget();
    restoredFromStorage = false;
    return;
  }

  appRoot.innerHTML = renderQuestionView();
  focusAutofocusTarget();
  restoredFromStorage = false;
}

function renderStatus() {
  const progressState = getProgressState();

  progressLabel.textContent = progressState.label;
  progressDetail.textContent = progressState.detail;
  progressPhase.textContent = progressState.phase;
  progressFill.style.width = `${progressState.percent}%`;

  if (restoredFromStorage) {
    saveStatus.textContent = 'Saved progress restored from this browser.';
  } else if (state.lastSaved) {
    saveStatus.textContent = `Saved locally on this device at ${formatSavedTime(state.lastSaved)}.`;
  } else {
    saveStatus.textContent = 'Progress is saved only on this device.';
  }
}

function getProgressState() {
  if (!state.role) {
    return {
      label: 'Choose who you are helping.',
      detail: 'Usually 8 to 11 short questions, depending on the path.',
      phase: 'Intake',
      percent: 0,
    };
  }

  const visibleQuestions = getVisibleQuestions();
  const totalSteps = visibleQuestions.length + 2;

  if (!state.goal) {
    return {
      label: 'Choose the kind of help you need.',
      detail: 'You can still choose “Not sure” later and get a useful checklist.',
      phase: 'Intake',
      percent: Math.round((1 / Math.max(totalSteps, 1)) * 100),
    };
  }

  if (state.completed) {
    return {
      label: 'Summary ready to review or print.',
      detail: 'Use it as a working summary, then verify with official Minerva guidance.',
      phase: 'Summary',
      percent: 100,
    };
  }

  const visibleQuestionCount = visibleQuestions.length;
  const currentQuestion = visibleQuestions[state.currentStepIndex];
  const remainingQuestions = Math.max(visibleQuestionCount - state.currentStepIndex - 1, 0);

  return {
    label: `Question ${state.currentStepIndex + 1} of ${visibleQuestionCount}`,
    detail:
      remainingQuestions > 0
        ? `${currentQuestion.stage} · about ${remainingQuestions} more step${remainingQuestions === 1 ? '' : 's'} after this`
        : `${currentQuestion.stage} · final question`,
    phase: currentQuestion.stage,
    percent: Math.round(((state.currentStepIndex + 2) / Math.max(totalSteps, 1)) * 100),
  };
}

function renderLandingView() {
  return `
    <section class="flow-card landing-card">
      <p class="eyebrow">Start here</p>
      <h3 class="card-title" tabindex="-1" data-autofocus>Who is using this tool right now?</h3>
      <p class="card-copy">
        Start with the role that is closest to the person doing the checking. The later questions
        will keep the same cautious, helper-oriented framing.
      </p>

      <div class="role-grid" role="group" aria-label="Choose a role">
        ${Object.entries(ROLE_OPTIONS)
          .map(
            ([value, option]) => `
              <button class="select-card" type="button" data-action="set-role" data-role="${value}">
                <strong>${option.label}</strong>
                <span>${option.description}</span>
                <small>${option.detail}</small>
              </button>
            `
          )
          .join('')}
      </div>

      <div class="card-callout">
        Nothing sensitive belongs here. Keep the answers high-level and use this tool only for planning and review.
      </div>
    </section>
  `;
}

function renderGoalView() {
  const roleLabel = ROLE_OPTIONS[state.role].label;

  return `
    <section class="flow-card goal-card">
      <p class="eyebrow">${roleLabel}</p>
      <h3 class="card-title" tabindex="-1" data-autofocus>What kind of help do you need most?</h3>
      <p class="card-copy">
        Pick the path that best matches the current task. This changes which follow-up questions appear and what the summary emphasizes.
      </p>

      <div class="goal-grid" role="group" aria-label="Choose a goal">
        ${Object.entries(GOAL_OPTIONS)
          .map(
            ([value, option]) => `
              <button class="select-card" type="button" data-action="set-goal" data-goal="${value}">
                <strong>${option.label}</strong>
                <span>${option.description}</span>
                <small>${option.detail}</small>
              </button>
            `
          )
          .join('')}
      </div>

      <div class="question-actions">
        <button class="secondary-button" type="button" data-action="change-role">Change role</button>
      </div>
    </section>
  `;
}

function renderQuestionView() {
  const visibleQuestions = getVisibleQuestions();
  const question = visibleQuestions[state.currentStepIndex];
  const selectedAnswer = state.answers[question.id] || '';
  const isLastQuestion = state.currentStepIndex === visibleQuestions.length - 1;

  return `
    <section class="flow-card question-card">
      <div class="question-header">
        <div class="question-stage">
          <p class="eyebrow">${ROLE_OPTIONS[state.role].label}</p>
          <span class="question-stage-note">${GOAL_OPTIONS[state.goal].label}</span>
        </div>
        <h3 class="card-title" tabindex="-1" data-autofocus>${question.prompt[state.role]}</h3>
        <p class="card-copy">${question.help}</p>
      </div>

      <form class="question-form">
        <fieldset class="option-group">
          <legend class="visually-hidden">${question.prompt[state.role]}</legend>
          ${question.options
            .map(
              (option) => `
                <label class="option-card ${selectedAnswer === option.value ? 'is-selected' : ''}">
                  <input
                    type="radio"
                    name="${question.id}"
                    value="${option.value}"
                    data-question-id="${question.id}"
                    ${selectedAnswer === option.value ? 'checked' : ''}
                  >
                  <span>
                    <span class="option-label">${option.label}</span>
                    <span class="option-hint">${option.hint}</span>
                  </span>
                </label>
              `
            )
            .join('')}
        </fieldset>
      </form>

      <div class="question-actions">
        <button class="secondary-button" type="button" data-action="back">Back</button>
        <button
          class="primary-button"
          type="button"
          data-action="next"
          ${selectedAnswer ? '' : 'disabled'}
        >
          ${isLastQuestion ? 'Build summary' : 'Continue'}
        </button>
      </div>
    </section>
  `;
}

function renderResultsView() {
  const results = buildResults();

  return `
    <section class="flow-card results-card">
      <div class="results-header">
        <div>
          <p class="eyebrow">Working summary</p>
          <h3 class="card-title" tabindex="-1" data-autofocus>${results.headline}</h3>
          <p class="card-copy">${results.intro}</p>
        </div>

        <div class="result-actions">
          <button class="secondary-button" type="button" data-action="edit-results">Review answers</button>
          <button class="primary-button" type="button" data-action="print-results">Print or save as PDF</button>
        </div>
      </div>

      <section class="result-card">
        <h4>Route summary</h4>
        <ul class="route-list">
          ${results.routeSummary
            .map(
              (item) => `
                <li class="route-item">
                  <strong>${item.label}</strong>
                  <span>${item.value}</span>
                </li>
              `
            )
            .join('')}
        </ul>
      </section>

      <div class="summary-banner">
        ${results.summaryHighlights
          .map(
            (item) => `
              <article class="highlight-card">
                <p class="highlight-label">${item.label}</p>
                <p class="highlight-value">${item.value}</p>
              </article>
            `
          )
          .join('')}
      </div>

      ${
        results.uncertaintyNote
          ? `<p class="confidence-note">${results.uncertaintyNote}</p>`
          : ''
      }

      <div class="results-grid">
        <section class="result-card">
          <h4>Likely documents needed</h4>
          ${renderSummaryItems(results.documents)}
        </section>

        <section class="result-card">
          <h4>Likely submitter responsibilities</h4>
          ${renderSummaryItems(results.responsibilities)}
        </section>

        <section class="result-card">
          <h4>Possible blockers</h4>
          ${renderSummaryItems(results.blockers)}
        </section>

        <section class="result-card">
          <h4>Suggested next steps</h4>
          ${renderSummaryItems(results.nextSteps)}
        </section>
      </div>

      <section class="result-card">
        <h4>Action checklist</h4>
        <p class="checklist-intro">
          Check off items locally on this device. This section is designed to print cleanly.
        </p>
        ${renderChecklistGroups(results.checklistGroups)}
      </section>

      <section class="result-card">
        <h4>Review with official guidance</h4>
        <ul class="content-list">
          ${results.officialChecks.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </section>

      <section class="result-card">
        <h4>Answer summary</h4>
        <dl class="answer-list">${buildAnswerSummary()}</dl>
      </section>

      <p class="result-disclaimer">
        This is a helper summary, not an official Minerva admissions decision tool or policy source.
        Verify every document expectation and submission path with official Minerva admissions guidance.
      </p>
    </section>
  `;
}

function renderSummaryItems(items) {
  if (!items.length) {
    return '<p class="empty-state">No extra items surfaced from this path.</p>';
  }

  return `
    <ul class="summary-list">
      ${items
        .map(
          (item) => `
            <li class="summary-item">
              <div class="summary-topline">
                <h5>${item.title}</h5>
                ${item.tag ? `<span class="pill">${item.tag}</span>` : ''}
              </div>
              ${item.meta ? `<p class="item-meta">${item.meta}</p>` : ''}
              <p>${item.detail}</p>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

function renderChecklistGroups(groups) {
  return groups
    .filter((group) => group.items.length)
    .map(
      (group) => `
        <section class="checklist-section">
          <h5>${group.title}</h5>
          <ul class="checklist-list">
            ${group.items
              .map((item) => {
                const isChecked = Boolean(state.checklist[item.id]);

                return `
                  <li class="checklist-item ${isChecked ? 'is-checked' : ''}">
                    <input
                      id="${item.id}"
                      type="checkbox"
                      data-checklist-id="${item.id}"
                      ${isChecked ? 'checked' : ''}
                    >
                    <label for="${item.id}">
                      <span>${item.label}</span>
                    </label>
                  </li>
                `;
              })
              .join('')}
          </ul>
        </section>
      `
    )
    .join('');
}

function renderContextRail() {
  contextRail.innerHTML = buildContextRailMarkup();
}

function buildContextRailMarkup() {
  if (!state.role) {
    return `
      <div class="rail-stack">
        <section class="rail-card">
          <p class="eyebrow">At a glance</p>
          <h3 id="rail-title">What this tool checks</h3>
          <ul class="content-list">
            <li>Recent secondary-school history</li>
            <li>Possible former-school and postsecondary record sources</li>
            <li>Predicted or school-submitted materials</li>
            <li>Upload ownership and incomplete-status blockers</li>
          </ul>
        </section>

        <section class="rail-card">
          <h3>How to use the answers</h3>
          <p>Choose “Not sure” when needed. The goal is a better working checklist, not a false sense of certainty.</p>
        </section>
      </div>
    `;
  }

  if (!state.goal) {
    return `
      <div class="rail-stack">
        <section class="rail-card">
          <p class="eyebrow">Current route</p>
          <h3 id="rail-title">${ROLE_OPTIONS[state.role].label}</h3>
          <p>${ROLE_OPTIONS[state.role].description}</p>
        </section>

        <section class="rail-card">
          <h3>Next step</h3>
          <p>Choose the kind of help that best matches the real problem. That choice changes what the summary focuses on.</p>
        </section>
      </div>
    `;
  }

  const snapshotItems = buildSnapshotItems();
  const activePhase = state.completed
    ? 'Summary'
    : getVisibleQuestions()[state.currentStepIndex].stage;

  return `
    <div class="rail-stack">
      <section class="rail-card">
        <p class="eyebrow">Session snapshot</p>
        <h3 id="rail-title">Current route</h3>
        <ul class="rail-list">
          ${snapshotItems
            .map(
              (item) => `
                <li class="rail-item">
                  <strong>${item.label}</strong>
                  <span>${item.value}</span>
                </li>
              `
            )
            .join('')}
        </ul>
      </section>

      <section class="rail-card">
        <h3>What to keep in mind</h3>
        <p>${getRailGuidance(activePhase)}</p>
        <ul class="content-list">
          ${getRailTips()
            .map((tip) => `<li>${tip}</li>`)
            .join('')}
        </ul>
      </section>
    </div>
  `;
}

function buildSnapshotItems() {
  const items = [
    { label: 'Role', value: ROLE_OPTIONS[state.role].label },
    { label: 'Goal', value: GOAL_OPTIONS[state.goal].label },
  ];

  if (!state.completed) {
    items.push({
      label: 'Answered',
      value: `${Object.keys(state.answers).length} of ${getVisibleQuestions().length}`,
    });
  }

  const uncertainAnswers = Object.values(state.answers).filter(
    (answer) => answer === 'not_sure'
  ).length;

  if (uncertainAnswers) {
    items.push({
      label: 'Unclear answers',
      value: `${uncertainAnswers} still marked “Not sure”`,
    });
  }

  if (state.answers.multipleSchools === 'yes') {
    items.push({
      label: 'Recent school changes',
      value: 'More than one recent secondary school',
    });
  }

  if (state.answers.attendedCollege === 'yes') {
    items.push({
      label: 'Postsecondary history',
      value: 'College or university records may matter',
    });
  }

  return items;
}

function getRailGuidance(activePhase) {
  const guidance = {
    Intake:
      'Start with the simplest accurate description of the situation. The app can handle uncertainty better than overconfident guessing.',
    'School history':
      'Think in record sources, not just school names. Each school change can create its own transcript or document path.',
    'Current-school documents':
      'Keep timing in mind. Some files depend first on current or predicted documents, then later on final results.',
    'Submission path':
      'A document may exist and still not solve the problem if the wrong person is expected to send it.',
    'Resolve blockers':
      'If the reason is unclear, compare what exists, who sent it, and what the official system still expects.',
    Summary:
      'Treat the result as a planning document. Print it, save it, or review it with a human who can confirm current policy.',
  };

  return guidance[activePhase] || guidance.Intake;
}

function getRailTips() {
  const tips = [
    'Use “Not sure” instead of guessing when the school history is incomplete.',
    'Separate “what document exists” from “who must submit it.”',
  ];

  if (state.answers.applicationIncomplete === 'yes' || state.goal === 'incomplete_status') {
    tips.push('If something was already sent, note the sender and send date before following up.');
  }

  return tips;
}

function buildResults() {
  const answers = state.answers;
  const goalLabel = GOAL_OPTIONS[state.goal].label;
  const results = {
    routeSummary: buildRouteSummary(),
    summaryHighlights: [],
    documents: [],
    responsibilities: [],
    blockers: [],
    nextSteps: [],
    officialChecks: [],
    checklistGroups: [
      { id: 'do-first', title: 'Do first', items: [] },
      { id: 'confirm-with-school', title: 'Confirm with school', items: [] },
      { id: 'follow-up', title: 'If the file still looks incomplete', items: [] },
    ],
  };

  const isCurrentSecondary = answers.currentlySecondary === 'yes';
  const finishedSecondary = answers.currentlySecondary === 'no';
  const secondaryUnknown = answers.currentlySecondary === 'not_sure';
  const multipleSchools = answers.multipleSchools === 'yes';
  const multipleSchoolsUnknown = answers.multipleSchools === 'not_sure';
  const previousRecordsMissing = answers.previousRecordsAvailable === 'no';
  const previousRecordsUnknown = answers.previousRecordsAvailable === 'not_sure';
  const formerSchoolDelay = answers.previousSchoolDelay === 'yes';
  const formerSchoolDelayUnknown = answers.previousSchoolDelay === 'not_sure';
  const collegeHistory = answers.attendedCollege === 'yes';
  const collegeUnknown = answers.attendedCollege === 'not_sure';
  const collegeRecordsMissing = answers.collegeRecordsAvailable === 'no';
  const collegeRecordsUnknown = answers.collegeRecordsAvailable === 'not_sure';
  const predictedScores = answers.predictedScores === 'yes';
  const predictedUnknown = answers.predictedScores === 'not_sure';
  const finalResultsPending = answers.finalResultsPending === 'yes';
  const finalResultsUnknown = answers.finalResultsPending === 'not_sure';
  const directSchoolUpload = answers.schoolUploadsDirectly === 'yes';
  const uploadUnknown = answers.schoolUploadsDirectly === 'not_sure';
  const uploadPathConfirmed = answers.uploadPathConfirmed === 'yes';
  const uploadPathUnclear =
    answers.uploadPathConfirmed === 'no' || answers.uploadPathConfirmed === 'not_sure';
  const applicationIncomplete = answers.applicationIncomplete === 'yes';
  const applicationIncompleteUnknown = answers.applicationIncomplete === 'not_sure';
  const incompleteReasonUnclear = answers.incompleteReasonUnclear === 'yes';
  const sentButNotMatched = answers.sentButNotMatched === 'yes';
  const sentButNotMatchedUnknown = answers.sentButNotMatched === 'not_sure';
  const uncertaintyCount = Object.values(answers).filter(
    (answer) => answer === 'not_sure'
  ).length;

  if (isCurrentSecondary) {
    addUniqueItem(results.documents, {
      id: 'current-secondary-transcript',
      title: 'Current secondary-school transcript or latest grade report',
      tag: 'Most likely',
      meta: `Likely owner: ${getCurrentSchoolOwner()}`,
      detail:
        'The file likely still depends on a current-school record while the applicant remains enrolled.',
    });
  } else if (finishedSecondary) {
    addUniqueItem(results.documents, {
      id: 'final-secondary-record',
      title: 'Final secondary-school transcript or completion record',
      tag: 'Most likely',
      meta: `Likely owner: ${getCurrentSchoolOwner()}`,
      detail:
        'A finished secondary-school path usually points first to the final transcript, leaving record, or completion document.',
    });
  } else if (secondaryUnknown) {
    addUniqueItem(results.documents, {
      id: 'current-or-final-secondary-record',
      title: 'Current or most recent secondary-school record',
      tag: 'Check',
      meta: `Likely owner: ${getCurrentSchoolOwner()}`,
      detail:
        'The exact starting document depends on whether the applicant is still enrolled or already finished secondary school.',
    });
  }

  if (multipleSchools) {
    addUniqueItem(results.documents, {
      id: 'former-secondary-records',
      title: 'Transcript or record source from each recent secondary school',
      tag: 'Check closely',
      meta: 'Likely owner: former school, applicant, or current school with archived records',
      detail:
        'A recent school change often means there is more than one secondary-school record path to account for.',
    });
  } else if (multipleSchoolsUnknown) {
    addUniqueItem(results.documents, {
      id: 'former-school-history-check',
      title: 'Former-school history check',
      tag: 'Check',
      meta: 'Why it appears: recent school history is still unclear',
      detail:
        'If there may have been a recent transfer or school change, confirm whether an extra transcript source belongs in the file.',
    });
  }

  if (collegeHistory) {
    addUniqueItem(results.documents, {
      id: 'college-records',
      title: 'College or university transcript(s)',
      tag: 'If applicable',
      meta: 'Likely owner: prior institution or applicant-managed request',
      detail:
        'Any postsecondary history can create another document source that needs separate attention.',
    });
  } else if (collegeUnknown) {
    addUniqueItem(results.documents, {
      id: 'college-history-check',
      title: 'Postsecondary history check',
      tag: 'Check',
      meta: 'Why it appears: college or university history is still unclear',
      detail:
        'Confirm whether any postsecondary enrollment should appear in the official record trail.',
    });
  }

  if (predictedScores) {
    addUniqueItem(results.documents, {
      id: 'predicted-exam-document',
      title: 'Predicted exam scores or school-submitted exam documentation',
      tag: 'Current-school',
      meta: `Likely owner: ${directSchoolUpload ? 'counselor / school official' : 'confirm the school-side owner'}`,
      detail:
        'This likely sits beside the transcript path rather than replacing it, especially while final results are still pending.',
    });
  } else if (predictedUnknown) {
    addUniqueItem(results.documents, {
      id: 'predicted-exam-check',
      title: 'Check whether any predicted exam or school-submitted exam document is expected',
      tag: 'Check',
      meta: 'Why it appears: current-school document expectations are still unclear',
      detail:
        'If the application depends on predicted or school-submitted materials, the school may own part of the submission path.',
    });
  }

  if (finalResultsPending) {
    addUniqueItem(results.documents, {
      id: 'future-final-results',
      title: 'Final secondary results or leaving record once available',
      tag: 'Later step',
      meta: `Likely owner: ${getCurrentSchoolOwner()}`,
      detail:
        'The file may rely on an interim document now and a final completion document later.',
    });
  } else if (finalResultsUnknown) {
    addUniqueItem(results.documents, {
      id: 'future-final-results-check',
      title: 'Check whether a later final result or leaving document still needs to be added',
      tag: 'Check',
      meta: 'Why it appears: the timing of final secondary results is still unclear',
      detail:
        'Some incomplete situations come from not realizing there is a second document expected later in the cycle.',
    });
  }

  addUniqueItem(results.responsibilities, {
    id: 'applicant-responsibility',
    title: state.role === 'applicant' ? 'Applicant follow-up' : 'Applicant-side follow-up',
    tag: 'Applicant',
    meta: 'Likely focus: school list, record requests, status tracking',
    detail:
      'Make sure every school in scope is listed, each record source is accounted for, and any applicant-side requests are started early.',
  });

  if (directSchoolUpload || predictedScores || finalResultsPending) {
    addUniqueItem(results.responsibilities, {
      id: 'school-responsibility',
      title: 'Counselor or school-official handoff',
      tag: 'School',
      meta: 'Likely focus: official records, predicted materials, and final result updates',
      detail:
        'The school may own part of the official submission path, especially for current-school records and school-submitted exam documentation.',
    });
  }

  if (uploadPathUnclear || uploadUnknown) {
    addUniqueItem(results.responsibilities, {
      id: 'owner-confirmation',
      title: 'Confirm one owner for each major document source',
      tag: 'Shared',
      meta: 'Why it matters: the document may exist, but the handoff can still fail',
      detail:
        'Separate the record itself from the submission owner so the applicant, counselor, and former schools are not duplicating or missing the same task.',
    });
  }

  if (goalLabel && state.goal === 'incomplete_status') {
    addUniqueItem(results.responsibilities, {
      id: 'status-reconciliation',
      title: 'Reconcile what was sent with what the system still expects',
      tag: 'Review',
      meta: 'Best used when the file already looks incomplete',
      detail:
        'If records may already exist, the problem may be timing, matching, or the wrong submission source rather than a missing file name.',
    });
  }

  if (previousRecordsMissing) {
    addUniqueItem(results.blockers, {
      id: 'missing-former-records',
      title: 'A former-school record still needs attention',
      tag: 'Likely blocker',
      meta: 'This is one of the strongest incomplete-file signals in the tool',
      detail:
        'A recent former-school transcript or archived record source is not yet under control.',
    });
  }

  if (formerSchoolDelay || formerSchoolDelayUnknown) {
    addUniqueItem(results.blockers, {
      id: 'former-school-delay',
      title: 'A former-school source may be slow or difficult to reach',
      tag: 'Watch closely',
      meta: 'Delayed sources should usually be chased first',
      detail:
        'Even when the document path is known, a fragile former-school source can slow the file more than current-school paperwork.',
    });
  }

  if (collegeRecordsMissing || collegeRecordsUnknown) {
    addUniqueItem(results.blockers, {
      id: 'college-record-gap',
      title: 'Postsecondary history may still need a separate transcript path',
      tag: 'Watch closely',
      meta: 'Applies only if college or university history exists or may exist',
      detail:
        'The school-only record trail may not be enough if a postsecondary institution also belongs in scope.',
    });
  }

  if (predictedScores && (!directSchoolUpload || uploadPathUnclear)) {
    addUniqueItem(results.blockers, {
      id: 'predicted-doc-owner-gap',
      title: 'Predicted or school-submitted materials may not have a confirmed owner',
      tag: 'Likely blocker',
      meta: 'This often looks like a process issue, not a missing applicant upload',
      detail:
        'If predicted materials matter, confirm whether the school must send them and which office owns that step.',
    });
  }

  if (finalResultsPending) {
    addUniqueItem(results.blockers, {
      id: 'timing-gap-final-results',
      title: 'The file may depend on a later final result or leaving document',
      tag: 'Timing risk',
      meta: 'Current and final document paths may both matter at different moments',
      detail:
        'The application may still need an update after the first current-school materials are submitted.',
    });
  }

  if (uploadPathUnclear || uploadUnknown) {
    addUniqueItem(results.blockers, {
      id: 'upload-path-unclear',
      title: 'The exact submission path is still unclear',
      tag: 'Likely blocker',
      meta: 'The file can stall even when the document itself exists',
      detail:
        'If nobody can say who submits which major document, the next action may be wrong even when the record list is correct.',
    });
  }

  if (applicationIncomplete && incompleteReasonUnclear) {
    addUniqueItem(results.blockers, {
      id: 'incomplete-reason-unclear',
      title: 'The file is incomplete, but the reason is still unclear',
      tag: 'Current issue',
      meta: 'This often means the problem is broader than one missing file name',
      detail:
        'Use the checklist to compare school history, record sources, and submission ownership before escalating the question.',
    });
  }

  if (sentButNotMatched || sentButNotMatchedUnknown) {
    addUniqueItem(results.blockers, {
      id: 'sent-not-matched',
      title: 'Something may have been sent but not matched as complete',
      tag: 'Process risk',
      meta: 'Common causes: timing, wrong source, or mismatched document type',
      detail:
        'If a document exists in real life but not in status tracking, the problem may be submission matching rather than raw availability.',
    });
  }

  if (applicationIncompleteUnknown) {
    addUniqueItem(results.blockers, {
      id: 'status-unclear',
      title: 'The current application status is itself still unclear',
      tag: 'Check',
      meta: 'Clarity on the status message changes how urgent each follow-up is',
      detail:
        'Confirm whether the file is already incomplete or whether this is still a preventative review.',
    });
  }

  if (uncertaintyCount >= 2) {
    addUniqueItem(results.blockers, {
      id: 'several-unknowns',
      title: 'Several answers are still uncertain',
      tag: 'Resolve',
      meta: 'More uncertainty makes the helper intentionally less definitive',
      detail:
        'The summary still gives a usable path, but at least a few core facts should be confirmed before acting on it as a final plan.',
    });
  }

  addUniqueItem(results.nextSteps, {
    id: 'verify-official-guidance',
    title: 'Compare this summary with official Minerva admissions guidance',
    tag: 'Do first',
    meta: 'This tool is a working aid, not a policy source',
    detail:
      'Use the result to organize the conversation, then confirm the actual requirement list and submission rules officially.',
  });
  addChecklistItem(
    results,
    'do-first',
    'check-verify-official-guidance',
    'Compare this summary with official Minerva admissions guidance or portal instructions'
  );

  addUniqueItem(results.nextSteps, {
    id: 'build-school-list',
    title: 'Write down every school in scope and match each one to a record source',
    tag: 'Do first',
    meta: 'This prevents hidden former-school gaps',
    detail:
      'Treat each secondary or postsecondary institution as its own record source until proven otherwise.',
  });
  addChecklistItem(
    results,
    'do-first',
    'check-build-school-list',
    'List every school in scope and note what record source exists for each one'
  );

  if (previousRecordsMissing || previousRecordsUnknown || formerSchoolDelay || formerSchoolDelayUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'former-school-follow-up',
      title: 'Start the former-school follow-up early',
      tag: 'Priority',
      meta: 'Former-school records are often the slowest part of the file',
      detail:
        'If a prior-school record is missing, unclear, or difficult to obtain, treat it as an early action rather than a late cleanup task.',
    });
    addChecklistItem(
      results,
      'do-first',
      'check-former-school-follow-up',
      'Request or confirm every former-school record that is missing, unclear, or delayed'
    );
  }

  if (collegeHistory || collegeUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'college-follow-up',
      title: 'Confirm whether any postsecondary transcript must be added',
      tag: 'Priority',
      meta: 'Do not assume the school-only file is enough if college history exists',
      detail:
        'If there was any college or university enrollment, confirm the record path before closing the document map.',
    });
    addChecklistItem(
      results,
      'do-first',
      'check-college-follow-up',
      'Confirm whether any college or university record must be requested or submitted'
    );
  }

  if (predictedScores || predictedUnknown || finalResultsPending || finalResultsUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'current-school-document-check',
      title: 'Clarify the current-school document sequence',
      tag: 'Confirm',
      meta: 'This matters most when current records, predicted materials, or final results are in play',
      detail:
        'Confirm whether the file needs a current transcript now, a predicted document, a final result later, or some combination of those steps.',
    });
    addChecklistItem(
      results,
      'confirm-with-school',
      'check-current-school-document-check',
      'Confirm whether the current-school path needs a transcript, predicted document, final result, or more than one step'
    );
  }

  if (directSchoolUpload || uploadUnknown || uploadPathUnclear) {
    addUniqueItem(results.nextSteps, {
      id: 'upload-owner-confirmation',
      title: 'Confirm exactly who submits each major document',
      tag: 'Confirm',
      meta: 'This is often the highest-value question for an incomplete file',
      detail:
        'Ask whether the applicant uploads the document, the school sends it directly, or a former institution owns the release.',
    });
    addChecklistItem(
      results,
      'confirm-with-school',
      'check-upload-owner-confirmation',
      'Confirm who submits each major document and which office or person owns the school-side handoff'
    );
  }

  if (predictedScores || predictedUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'predicted-material-confirmation',
      title: 'Check whether predicted or school-submitted exam documentation is expected',
      tag: 'Confirm',
      meta: 'The exact document name should come from official guidance',
      detail:
        'Do not assume the transcript covers this automatically. Confirm whether there is a separate school-submitted exam record.',
    });
    addChecklistItem(
      results,
      'confirm-with-school',
      'check-predicted-material-confirmation',
      'Confirm whether any predicted exam or other school-submitted exam document is expected'
    );
  }

  if (applicationIncomplete || applicationIncompleteUnknown || state.goal === 'incomplete_status') {
    addUniqueItem(results.nextSteps, {
      id: 'portal-reconciliation',
      title: 'Compare the checklist with the actual incomplete-status message',
      tag: 'Follow up',
      meta: 'Use this when the system still does not make sense',
      detail:
        'Match each likely document path against the official status message so the follow-up stays grounded in what the system is actually showing.',
    });
    addChecklistItem(
      results,
      'follow-up',
      'check-portal-reconciliation',
      'Compare this checklist with the exact portal or status message before following up'
    );
  }

  if (sentButNotMatched || sentButNotMatchedUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'sent-document-audit',
      title: 'Record what was already sent, by whom, and when',
      tag: 'Follow up',
      meta: 'Useful when a real document still is not marked complete',
      detail:
        'A short document trail helps separate a truly missing file from a submission-matching problem.',
    });
    addChecklistItem(
      results,
      'follow-up',
      'check-sent-document-audit',
      'Write down what was already sent, who sent it, and when it was sent'
    );
  }

  if (incompleteReasonUnclear || uncertaintyCount >= 2) {
    addUniqueItem(results.nextSteps, {
      id: 'human-review-escalation',
      title: 'Escalate the unclear parts to a human reviewer using this summary',
      tag: 'Follow up',
      meta: 'Best when the record path still is not obvious after the checklist',
      detail:
        'Bring the route summary, the open questions, and the official guidance together so the next human conversation starts from a clearer place.',
    });
    addChecklistItem(
      results,
      'follow-up',
      'check-human-review-escalation',
      'Use this summary to prepare a focused follow-up with the school or official admissions guidance'
    );
  }

  results.officialChecks = buildOfficialChecks({
    multipleSchools,
    multipleSchoolsUnknown,
    collegeHistory,
    collegeUnknown,
    predictedScores,
    predictedUnknown,
    finalResultsPending,
    finalResultsUnknown,
    directSchoolUpload,
    uploadPathUnclear,
  });

  results.summaryHighlights = buildSummaryHighlights({
    previousRecordsMissing,
    formerSchoolDelay,
    collegeRecordsMissing,
    predictedScores,
    finalResultsPending,
    uploadPathUnclear,
    incompleteReasonUnclear,
    sentButNotMatched,
    directSchoolUpload,
  });

  return {
    ...results,
    headline: buildHeadline({
      previousRecordsMissing,
      formerSchoolDelay,
      collegeHistory,
      collegeRecordsMissing,
      predictedScores,
      finalResultsPending,
      applicationIncomplete,
      uploadPathUnclear,
      incompleteReasonUnclear,
      sentButNotMatched,
    }),
    intro: buildIntro(results, goalLabel),
    uncertaintyNote: buildUncertaintyNote(uncertaintyCount),
  };
}

function buildRouteSummary() {
  return [
    { label: 'Role', value: ROLE_OPTIONS[state.role].label },
    { label: 'Goal', value: GOAL_OPTIONS[state.goal].label },
    { label: 'Secondary status', value: getCurrentSchoolSummary() },
    { label: 'Recent schools', value: getRecentSchoolSummary() },
    { label: 'Postsecondary history', value: getCollegeSummary() },
    { label: 'Submission path', value: getUploadSummary() },
  ];
}

function buildSummaryHighlights(flags) {
  const highlights = [];

  if (flags.previousRecordsMissing || flags.formerSchoolDelay) {
    highlights.push({
      label: 'Main thing to resolve first',
      value: 'Former-school records look like the highest-risk part of the file.',
    });
  } else if (flags.collegeRecordsMissing) {
    highlights.push({
      label: 'Main thing to resolve first',
      value: 'Postsecondary history may still need its own transcript path.',
    });
  } else if (flags.uploadPathUnclear) {
    highlights.push({
      label: 'Main thing to resolve first',
      value: 'The strongest gap may be submission ownership rather than a document name.',
    });
  } else {
    highlights.push({
      label: 'Main thing to resolve first',
      value: 'Turn the route summary into a school-by-school document map before taking action.',
    });
  }

  if (flags.sentButNotMatched || flags.incompleteReasonUnclear) {
    highlights.push({
      label: 'Why the file may still look incomplete',
      value: 'A document may already exist, but the system may still be missing the right source, handoff, or matching step.',
    });
  } else if (flags.predictedScores || flags.finalResultsPending) {
    highlights.push({
      label: 'Why timing matters here',
      value: 'This path may need one current-school document now and another final document later.',
    });
  } else if (flags.directSchoolUpload) {
    highlights.push({
      label: 'Where the handoff matters',
      value: 'At least one part of the file probably depends on a school-side submission rather than only the applicant.',
    });
  } else {
    highlights.push({
      label: 'What this summary is best for',
      value: 'Use it to confirm record sources, owners, and blocker risks before relying on the portal alone.',
    });
  }

  return highlights;
}

function buildOfficialChecks(flags) {
  const items = [
    'Which official Minerva page, portal note, or current-cycle instruction controls this requirement?',
    'Does each school in scope need its own official record path, or is one consolidated source acceptable?',
    'Who is officially expected to submit each document: the applicant, the current school, a former school, or a postsecondary institution?',
  ];

  if (flags.predictedScores || flags.predictedUnknown || flags.finalResultsPending || flags.finalResultsUnknown) {
    items.push(
      'If current-school or exam materials matter, what exact document type is expected now and what later final document may still be required?'
    );
  }

  if (flags.collegeHistory || flags.collegeUnknown) {
    items.push(
      'If there is any college or university history, does official guidance treat that as a separate transcript requirement?'
    );
  }

  if (flags.directSchoolUpload || flags.uploadPathUnclear) {
    items.push(
      'If the school may submit directly, which office or person is responsible for that official handoff?'
    );
  }

  return items;
}

function buildHeadline(flags) {
  if (flags.previousRecordsMissing || flags.formerSchoolDelay) {
    return 'The strongest risk here is a gap in former-school records.';
  }

  if (flags.collegeHistory && flags.collegeRecordsMissing) {
    return 'This file likely depends on both secondary and postsecondary records.';
  }

  if (flags.applicationIncomplete && (flags.uploadPathUnclear || flags.incompleteReasonUnclear || flags.sentButNotMatched)) {
    return 'The likely issue may be handoff or matching, not just one missing file.';
  }

  if (flags.predictedScores || flags.finalResultsPending) {
    return 'This looks like a timing-sensitive current-school document path.';
  }

  return 'The likely next step is to confirm the document map and the owner for each handoff.';
}

function buildIntro(results, goalLabel) {
  return `${goalLabel}. This summary surfaced ${results.documents.length} likely document group${
    results.documents.length === 1 ? '' : 's'
  }, ${results.blockers.length} possible blocker${results.blockers.length === 1 ? '' : 's'}, and ${
    results.nextSteps.length
  } suggested next step${results.nextSteps.length === 1 ? '' : 's'}.`;
}

function buildUncertaintyNote(uncertaintyCount) {
  if (!uncertaintyCount) {
    return '';
  }

  if (uncertaintyCount === 1) {
    return 'One answer is still marked “Not sure.” Treat the relevant section as a check, not a conclusion.';
  }

  return `${uncertaintyCount} answers are still marked “Not sure.” That is a good reason to use this result as a conversation guide rather than a final checklist by itself.`;
}

function getCurrentSchoolOwner() {
  if (state.answers.schoolUploadsDirectly === 'yes') {
    return 'counselor / school official';
  }

  if (state.answers.schoolUploadsDirectly === 'no') {
    return 'applicant or school, depending on the official path';
  }

  return 'confirm with the school or official guidance';
}

function getCurrentSchoolSummary() {
  const answer = state.answers.currentlySecondary;

  if (answer === 'yes') {
    return 'Still in secondary school';
  }

  if (answer === 'no') {
    return 'Secondary school already complete';
  }

  return 'Still unclear';
}

function getRecentSchoolSummary() {
  const answer = state.answers.multipleSchools;

  if (answer === 'yes') {
    return 'More than one recent secondary school';
  }

  if (answer === 'no') {
    return 'One recent secondary school';
  }

  return 'Still unclear';
}

function getCollegeSummary() {
  const answer = state.answers.attendedCollege;

  if (answer === 'yes') {
    return 'College or university history may matter';
  }

  if (answer === 'no') {
    return 'No college or university history reported';
  }

  return 'Still unclear';
}

function getUploadSummary() {
  const directUpload = state.answers.schoolUploadsDirectly;
  const confirmed = state.answers.uploadPathConfirmed;

  if (confirmed === 'yes') {
    return 'Submission ownership looks confirmed';
  }

  if (directUpload === 'yes') {
    return 'School-side submission likely, but ownership still needs checking';
  }

  if (directUpload === 'no' && confirmed === 'no') {
    return 'No direct school path reported, but the owner is still unclear';
  }

  return 'Submission ownership still needs checking';
}

function addChecklistItem(results, groupId, id, label) {
  const group = results.checklistGroups.find((entry) => entry.id === groupId);

  if (!group) {
    return;
  }

  if (group.items.some((item) => item.id === id)) {
    return;
  }

  group.items.push({ id, label });
}

function buildAnswerSummary() {
  return getVisibleQuestions()
    .map((question) => {
      const answerValue = state.answers[question.id];
      const answerLabel = getOptionLabel(question, answerValue);

      return `
        <div class="answer-row">
          <dt>${question.summaryLabel}</dt>
          <dd>${answerLabel}</dd>
        </div>
      `;
    })
    .join('');
}

function refreshQuestionSelection(questionId, selectedValue) {
  const nextButton = appRoot.querySelector('[data-action="next"]');
  const questionInputs = appRoot.querySelectorAll(`input[data-question-id="${questionId}"]`);

  questionInputs.forEach((input) => {
    const optionCard = input.closest('.option-card');

    if (optionCard) {
      optionCard.classList.toggle('is-selected', input.value === selectedValue);
    }
  });

  if (nextButton) {
    nextButton.disabled = !selectedValue;
  }
}

function updateChecklistVisualState(input) {
  const checklistItem = input.closest('.checklist-item');

  if (!checklistItem) {
    return;
  }

  checklistItem.classList.toggle('is-checked', input.checked);
}

function addUniqueItem(collection, item) {
  if (collection.some((existingItem) => existingItem.id === item.id)) {
    return;
  }

  collection.push(item);
}

function getOptionLabel(question, value) {
  const option = question.options.find((entry) => entry.value === value);
  return option ? option.label : 'Not answered';
}

function formatSavedTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function focusAutofocusTarget() {
  const focusTarget = appRoot.querySelector('[data-autofocus]');

  if (!focusTarget) {
    return;
  }

  window.requestAnimationFrame(() => {
    focusTarget.focus();
  });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

document.addEventListener('DOMContentLoaded', init);
