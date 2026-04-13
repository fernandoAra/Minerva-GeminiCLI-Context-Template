/**
 * Transcript & School Documents Navigator
 *
 * Plain JavaScript only:
 * - branching questionnaire
 * - local progress save
 * - printable results and checklist
 */

const STORAGE_KEY = 'transcript-school-documents-navigator-v1';

const ROLE_LABELS = {
  applicant: 'Applicant',
  counselor: 'Counselor / school official',
};

const questionBank = [
  {
    id: 'currentlySecondary',
    prompt: {
      applicant: 'Are you currently in secondary school?',
      counselor: 'Is the applicant currently in secondary school?',
    },
    description:
      'This separates current-school records from final secondary completion records.',
    options: [
      { value: 'yes', label: 'Yes, currently enrolled' },
      { value: 'no', label: 'No, secondary school is already complete' },
      { value: 'not_sure', label: 'Not sure yet' },
    ],
  },
  {
    id: 'multipleSchools',
    prompt: {
      applicant: 'Have you attended more than one secondary school in the last 3 years?',
      counselor: 'Has the applicant attended more than one secondary school in the last 3 years?',
    },
    description:
      'Applications often stay incomplete when one former school is missing from the record trail.',
    options: [
      { value: 'yes', label: 'Yes, more than one school' },
      { value: 'no', label: 'No, only one school' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'attendedCollege',
    prompt: {
      applicant: 'Have you already attended university or college?',
      counselor: 'Has the applicant already attended university or college?',
    },
    description:
      'Any postsecondary history usually means another transcript source needs attention.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'predictedScores',
    prompt: {
      applicant: 'Do you expect predicted exam scores or school-submitted exam documentation?',
      counselor: 'Do you expect predicted exam scores or school-submitted exam documentation for this applicant?',
    },
    description:
      'If predicted scores are part of the file, the school may still need to send an official document.',
    condition: (answers) => answers.currentlySecondary !== 'no',
    options: [
      { value: 'yes', label: 'Yes, likely needed' },
      { value: 'no', label: 'No, not expected' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'schoolUploadsDirectly',
    prompt: {
      applicant: 'Do you know whether your counselor or school official must upload documents directly?',
      counselor: 'Do you know whether a counselor or school official must upload documents directly?',
    },
    description:
      'A lot of confusion comes from not knowing whether the applicant uploads a file or the school sends it directly.',
    options: [
      { value: 'yes', label: 'Yes, the school likely uploads directly' },
      { value: 'no', label: 'No, direct school upload does not seem required' },
      { value: 'not_sure', label: 'Not sure who uploads' },
    ],
  },
  {
    id: 'missingPreviousRecords',
    prompt: {
      applicant: 'Are you missing records from a previous school?',
      counselor: 'Are records missing from a previous school?',
    },
    description:
      'Missing records from former schools are a common reason a document trail breaks.',
    condition: (answers) => answers.multipleSchools === 'yes',
    options: [
      { value: 'yes', label: 'Yes, at least one record is missing' },
      { value: 'no', label: 'No, those records are available' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'incompleteReasonUnclear',
    prompt: {
      applicant: 'Are you unsure why the application is still incomplete?',
      counselor: 'Is it unclear why the application is still incomplete?',
    },
    description:
      'This helps surface process problems even when the document itself seems obvious.',
    options: [
      { value: 'yes', label: 'Yes, the reason is still unclear' },
      { value: 'no', label: 'No, the incomplete reason is clear' },
    ],
  },
];

const questionLookup = questionBank.reduce((lookup, question) => {
  lookup[question.id] = question;
  return lookup;
}, {});

let state = createEmptyState();
let appRoot;
let progressLabel;
let saveStatus;
let progressFill;
let startOverButton;
let restoredFromStorage = false;

function createEmptyState() {
  return {
    role: '',
    answers: {},
    currentStepIndex: 0,
    completed: false,
    checklist: {},
    lastSaved: null,
  };
}

function init() {
  appRoot = document.getElementById('app-root');
  progressLabel = document.getElementById('progress-label');
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
    startFlow(actionTarget.dataset.role);
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
    return;
  }

  if (target.matches('input[type="checkbox"][data-checklist-id]')) {
    state.checklist[target.dataset.checklistId] = target.checked;
    persistState();
    updateChecklistVisualState(target);
    renderStatus();
  }
}

function startFlow(role) {
  state = createEmptyState();
  state.role = ROLE_LABELS[role] ? role : '';
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
  if (state.completed) {
    state.completed = false;
    state.currentStepIndex = Math.max(getVisibleQuestions().length - 1, 0);
  } else {
    state.currentStepIndex = Math.max(state.currentStepIndex - 1, 0);
  }

  persistState();
  renderApp();
}

function resetFlow() {
  const shouldReset = window.confirm('Clear the saved progress and start over?');

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
      state.role || Object.keys(state.answers).length || state.completed
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
  if (!ROLE_LABELS[state.role]) {
    state = createEmptyState();
    return;
  }

  pruneHiddenAnswers();

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
  if (!ROLE_LABELS[state.role]) {
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

function getVisibleQuestions() {
  if (!ROLE_LABELS[state.role]) {
    return [];
  }

  return questionBank.filter((question) => {
    if (!question.condition) {
      return true;
    }

    return question.condition(state.answers, state.role);
  });
}

function renderApp() {
  renderStatus();
  document.body.dataset.view = state.completed
    ? 'results'
    : state.role
      ? 'questionnaire'
      : 'landing';

  startOverButton.hidden = !state.role;

  if (!state.role) {
    appRoot.innerHTML = renderLandingView();
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
  if (!state.role) {
    progressLabel.textContent = 'Choose a role to begin.';
    saveStatus.textContent = 'Progress is saved only on this device.';
    progressFill.style.width = '0%';
    return;
  }

  const visibleQuestions = getVisibleQuestions();
  const stepNumber = Math.min(state.currentStepIndex + 1, visibleQuestions.length);
  const progressPercent = state.completed
    ? 100
    : Math.round((stepNumber / Math.max(visibleQuestions.length, 1)) * 100);

  progressLabel.textContent = state.completed
    ? 'Results ready to review.'
    : `Step ${stepNumber} of ${visibleQuestions.length}`;

  if (restoredFromStorage) {
    saveStatus.textContent = 'Saved progress restored from this browser.';
  } else {
    saveStatus.textContent = state.lastSaved
      ? `Saved locally on this device at ${formatSavedTime(state.lastSaved)}.`
      : 'Progress is saved only on this device.';
  }

  progressFill.style.width = `${progressPercent}%`;
}

function renderLandingView() {
  return `
    <section class="flow-card landing-card">
      <div class="landing-grid">
        <div>
          <p class="eyebrow">Start here</p>
          <h3 class="card-title" tabindex="-1" data-autofocus>Who are you using this tool for?</h3>
          <p class="card-copy">
            Pick the closest role, answer a short set of questions, and get a printable summary
            of likely documents, likely submitter responsibilities, common blockers, and next steps.
          </p>
        </div>

        <div class="role-grid" role="group" aria-label="Choose a role">
          <button class="role-button" type="button" data-action="set-role" data-role="applicant">
            <strong>Applicant</strong>
            <span>I want a plain-language guide to what my application may still need.</span>
          </button>
          <button class="role-button" type="button" data-action="set-role" data-role="counselor">
            <strong>Counselor / school official</strong>
            <span>I am helping a student and need a quick document-path overview.</span>
          </button>
        </div>
      </div>

      <p class="landing-note">
        Keep this tool free of personal data. It stores only local progress and checklist state.
      </p>
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
      <p class="eyebrow">${ROLE_LABELS[state.role]}</p>
      <h3 class="card-title" tabindex="-1" data-autofocus>${question.prompt[state.role]}</h3>
      <p class="card-copy">${question.description}</p>

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
                    <span class="option-hint">${buildOptionHint(question.id, option.value)}</span>
                  </span>
                </label>
              `
            )
            .join('')}
        </fieldset>
      </form>

      <div class="question-actions">
        <button
          class="secondary-button"
          type="button"
          data-action="back"
          ${state.currentStepIndex === 0 ? 'disabled' : ''}
        >
          Back
        </button>
        <button
          class="primary-button"
          type="button"
          data-action="next"
          ${selectedAnswer ? '' : 'disabled'}
        >
          ${isLastQuestion ? 'See results' : 'Continue'}
        </button>
      </div>
    </section>
  `;
}

function renderResultsView() {
  const results = buildResults();
  const checklistItems = buildChecklistItems(results);
  const answerSummary = buildAnswerSummary();

  return `
    <section class="flow-card results-card">
      <div class="results-header">
        <div>
          <p class="eyebrow">Results summary</p>
          <h3 class="card-title" tabindex="-1" data-autofocus>${results.headline}</h3>
          <p class="card-copy">${results.intro}</p>
        </div>

        <div class="result-actions">
          <button class="secondary-button" type="button" data-action="edit-results">Review answers</button>
          <button class="primary-button" type="button" data-action="print-results">Print summary</button>
        </div>
      </div>

      <div class="results-grid">
        <section class="result-block">
          <h4>Likely required documents</h4>
          ${renderSummaryItems(results.documents, 'document')}
        </section>

        <section class="result-block">
          <h4>Who likely needs to act</h4>
          ${renderSummaryItems(results.submitterNotes, 'note')}
        </section>

        <section class="result-block">
          <h4>Common blockers</h4>
          ${renderSummaryItems(results.blockers, 'blocker')}
        </section>

        <section class="result-block">
          <h4>Suggested next steps</h4>
          ${renderSummaryItems(results.nextSteps, 'step')}
        </section>
      </div>

      <section class="result-block">
        <h4>Answer summary</h4>
        <dl class="answer-list">${answerSummary}</dl>
      </section>

      <section class="result-block">
        <h4>Checklist before you leave</h4>
        <p class="checklist-intro">Check off items locally on this device. This list is printable.</p>
        <ul class="checklist-list">
          ${checklistItems
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

      <p class="result-disclaimer">
        This is a helper summary, not an official admissions decision tool. Verify every document
        and submission path with official Minerva admissions guidance.
      </p>
    </section>
  `;
}

function renderSummaryItems(items, type) {
  if (!items.length) {
    return '<p class="empty-state">No additional items surfaced from these answers.</p>';
  }

  return `
    <ul class="summary-list">
      ${items
        .map((item) => {
          const badgeLabel =
            type === 'document' ? item.submitter : item.badge || 'Check';

          return `
            <li class="summary-item">
              <div>
                <h5>${item.title}</h5>
                <p>${item.detail}</p>
              </div>
              <span class="pill">${badgeLabel}</span>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function buildResults() {
  const answers = state.answers;
  const results = {
    documents: [],
    submitterNotes: [],
    blockers: [],
    nextSteps: [],
  };

  const isCurrentSecondary = answers.currentlySecondary === 'yes';
  const secondaryUnknown = answers.currentlySecondary === 'not_sure';
  const multipleSchools = answers.multipleSchools === 'yes';
  const collegeHistory = answers.attendedCollege === 'yes';
  const collegeUnknown = answers.attendedCollege === 'not_sure';
  const predictedScores = answers.predictedScores === 'yes';
  const predictedUnknown = answers.predictedScores === 'not_sure';
  const directSchoolUpload = answers.schoolUploadsDirectly === 'yes';
  const uploadUnknown = answers.schoolUploadsDirectly === 'not_sure';
  const missingPreviousRecords = answers.missingPreviousRecords === 'yes';
  const missingPreviousUnknown = answers.missingPreviousRecords === 'not_sure';
  const incompleteReasonUnclear = answers.incompleteReasonUnclear === 'yes';
  const hasUnknowns = Object.values(answers).includes('not_sure');

  if (isCurrentSecondary) {
    addUniqueItem(results.documents, {
      id: 'current-secondary-transcript',
      title: 'Current secondary school transcript or latest grade report',
      detail:
        'The current school record is likely part of the file, especially if the applicant has not finished school yet.',
      submitter: getSchoolDocumentSubmitter(),
    });
  } else if (secondaryUnknown) {
    addUniqueItem(results.documents, {
      id: 'recent-secondary-record',
      title: 'Most recent secondary school record',
      detail:
        'If the current enrollment status is unclear, confirm which secondary transcript or leaving record best represents the applicant right now.',
      submitter: getSchoolDocumentSubmitter(),
    });
  } else {
    addUniqueItem(results.documents, {
      id: 'final-secondary-transcript',
      title: 'Final secondary school transcript or completion record',
      detail:
        'A completed secondary education path usually points to the final transcript, diploma record, or leaving certificate.',
      submitter: getSchoolDocumentSubmitter(),
    });
  }

  if (multipleSchools) {
    addUniqueItem(results.documents, {
      id: 'previous-secondary-transcripts',
      title: 'Transcript(s) from previous secondary school(s)',
      detail:
        'If the applicant changed schools in the last 3 years, a prior school may still need to be represented in the record trail.',
      submitter: getSchoolDocumentSubmitter(),
    });
  }

  if (collegeHistory) {
    addUniqueItem(results.documents, {
      id: 'college-transcripts',
      title: 'University or college transcript(s)',
      detail:
        'Any postsecondary history may add another transcript source that needs to be requested or submitted.',
      submitter: 'Applicant / prior institution',
    });
  }

  if (predictedScores) {
    addUniqueItem(results.documents, {
      id: 'predicted-exam-docs',
      title: 'Predicted exam scores or school-submitted exam documentation',
      detail:
        'If predicted scores matter for this application, the school may need to send an official exam-related document.',
      submitter: directSchoolUpload ? 'Counselor / school official' : 'Verify upload owner',
    });
  }

  addUniqueItem(results.submitterNotes, {
    id: 'applicant-action',
    title: state.role === 'applicant' ? 'Applicant role' : 'Applicant handoff',
    detail:
      'Confirm the school history is complete, track which records already exist, and follow up on anything the school does not send directly.',
    badge: 'Applicant',
  });

  if (directSchoolUpload || predictedScores) {
    addUniqueItem(results.submitterNotes, {
      id: 'school-action',
      title: 'Counselor / school official role',
      detail:
        'The school may need to upload or verify official records, especially current transcripts and predicted exam documentation.',
      badge: 'School',
    });
  }

  if (!directSchoolUpload) {
    addUniqueItem(results.submitterNotes, {
      id: 'upload-verification',
      title: 'Submission ownership check',
      detail:
        'If direct school upload is not confirmed, verify whether the applicant uploads the file, the school sends it, or both steps are required.',
      badge: 'Verify',
    });
  }

  if (multipleSchools) {
    addUniqueItem(results.blockers, {
      id: 'multi-school-risk',
      title: 'More than one secondary school in scope',
      detail:
        'A former school can be easy to overlook, which may leave the application looking incomplete even when the current school sent its documents.',
      badge: 'Common',
    });
  }

  if (missingPreviousRecords) {
    addUniqueItem(results.blockers, {
      id: 'missing-previous-records',
      title: 'Missing records from a previous school',
      detail:
        'This is a likely blocker until each prior school in the recent timeline has an accessible transcript or official record source.',
      badge: 'Likely',
    });
  }

  if (collegeHistory) {
    addUniqueItem(results.blockers, {
      id: 'college-history-blocker',
      title: 'Postsecondary history may add another required transcript',
      detail:
        'Applications with college or university history often need an extra transcript request, which can slow completion if started late.',
      badge: 'Watch',
    });
  }

  if (predictedScores && !directSchoolUpload) {
    addUniqueItem(results.blockers, {
      id: 'predicted-score-process',
      title: 'Predicted exam documents may still be sitting with the school',
      detail:
        'When predicted scores are expected but the upload path is unclear, the issue may be process ownership rather than a missing applicant upload.',
      badge: 'Watch',
    });
  }

  if (uploadUnknown) {
    addUniqueItem(results.blockers, {
      id: 'unclear-upload-owner',
      title: 'Unclear who must upload official documents',
      detail:
        'If nobody knows whether the school or the applicant owns the upload step, the file can stall without an obvious missing-document message.',
      badge: 'Likely',
    });
  }

  if (incompleteReasonUnclear) {
    addUniqueItem(results.blockers, {
      id: 'unclear-incomplete-reason',
      title: 'Incomplete status does not point to one clear issue',
      detail:
        'The application may be missing a prior-school record, a school-submitted document, or a submission step that was never assigned to one person.',
      badge: 'Current',
    });
  }

  if (hasUnknowns || collegeUnknown || predictedUnknown || missingPreviousUnknown) {
    addUniqueItem(results.blockers, {
      id: 'unknown-answers',
      title: 'Some answers are still uncertain',
      detail:
        'Unclear school history or unclear document ownership makes it harder to tell which record is truly missing.',
      badge: 'Resolve',
    });
  }

  addUniqueItem(results.nextSteps, {
    id: 'verify-official-guidance',
    title: 'Verify the list against official Minerva admissions guidance',
    detail:
      'Use this summary as a prep tool only. Confirm the current official requirement list before submitting or requesting documents.',
    badge: 'Required',
  });

  if (state.role === 'applicant') {
    addUniqueItem(results.nextSteps, {
      id: 'applicant-school-list',
      title: 'List every school attended and match each one to a record source',
      detail:
        'Write down each secondary or postsecondary institution in scope, then note whether the transcript already exists, must be requested, or must be sent by the school.',
      badge: 'Applicant',
    });
  } else {
    addUniqueItem(results.nextSteps, {
      id: 'school-ownership-step',
      title: 'Confirm which school office owns the upload or release step',
      detail:
        'Make sure one person is responsible for sending official school records and predicted exam documentation if those are part of the file.',
      badge: 'School',
    });
  }

  if (multipleSchools) {
    addUniqueItem(results.nextSteps, {
      id: 'reconcile-school-timeline',
      title: 'Reconcile the last 3 years of secondary schooling',
      detail:
        'Check that each school transition in the recent timeline has a corresponding transcript or official record plan.',
      badge: 'Timeline',
    });
  }

  if (missingPreviousRecords || missingPreviousUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'contact-previous-school',
      title: 'Contact the previous school early',
      detail:
        'If an older record is missing or uncertain, request that transcript first because former schools often take the longest to answer.',
      badge: 'Priority',
    });
  }

  if (collegeHistory || collegeUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'request-college-records',
      title: 'Request any postsecondary transcript as soon as possible',
      detail:
        'If college history is part of the story, start that request early instead of waiting for the secondary-school side to finish.',
      badge: 'Priority',
    });
  }

  if (predictedScores || predictedUnknown) {
    addUniqueItem(results.nextSteps, {
      id: 'confirm-predicted-exams',
      title: 'Confirm whether predicted exam documentation is expected',
      detail:
        'If predicted results may matter, verify the exact document and whether the school must send it directly.',
      badge: 'Exam',
    });
  }

  if (uploadUnknown || !directSchoolUpload) {
    addUniqueItem(results.nextSteps, {
      id: 'confirm-upload-path',
      title: 'Confirm the exact upload path before chasing the wrong document',
      detail:
        'Ask whether the missing step is an applicant upload, a counselor upload, or a release from a previous institution.',
      badge: 'Process',
    });
  }

  if (incompleteReasonUnclear) {
    addUniqueItem(results.nextSteps, {
      id: 'compare-checklist-to-portal',
      title: 'Compare this checklist with the application status message',
      detail:
        'If the application still looks incomplete after each item is accounted for, a human should review the official guidance or the admissions portal message directly.',
      badge: 'Review',
    });
  }

  return {
    ...results,
    headline: buildHeadline(results),
    intro: buildIntro(results),
  };
}

function buildChecklistItems(results) {
  const items = [];

  results.documents.forEach((documentItem) => {
    items.push({
      id: `check-doc-${documentItem.id}`,
      label: `Confirm the path for: ${documentItem.title}`,
    });
  });

  results.nextSteps.forEach((stepItem) => {
    items.push({
      id: `check-step-${stepItem.id}`,
      label: stepItem.title,
    });
  });

  return items;
}

function buildAnswerSummary() {
  return getVisibleQuestions()
    .map((question) => {
      const answerValue = state.answers[question.id];
      const answerLabel = getOptionLabel(question, answerValue);

      return `
        <div class="answer-row">
          <dt>${question.prompt[state.role]}</dt>
          <dd>${answerLabel}</dd>
        </div>
      `;
    })
    .join('');
}

function buildHeadline(results) {
  if (state.answers.missingPreviousRecords === 'yes') {
    return 'The strongest risk is a broken record trail from a previous school.';
  }

  if (state.answers.attendedCollege === 'yes') {
    return 'This looks like a multi-institution application file.';
  }

  if (state.answers.predictedScores === 'yes') {
    return 'This file likely depends on current school records plus exam-related documentation.';
  }

  if (state.answers.schoolUploadsDirectly === 'not_sure' || state.answers.incompleteReasonUnclear === 'yes') {
    return 'The likely gap may be process ownership, not just one missing file.';
  }

  if (results.documents.length > 2) {
    return 'Several document sources may need to line up for this application.';
  }

  return 'The likely path is a short set of core school records plus one clear owner for each step.';
}

function buildIntro(results) {
  return `Based on these answers, this helper surfaced ${results.documents.length} likely document group${
    results.documents.length === 1 ? '' : 's'
  }, ${results.blockers.length} common blocker${results.blockers.length === 1 ? '' : 's'}, and ${
    results.nextSteps.length
  } next step${results.nextSteps.length === 1 ? '' : 's'}.`;
}

function getSchoolDocumentSubmitter() {
  if (state.answers.schoolUploadsDirectly === 'yes') {
    return 'Counselor / school official';
  }

  if (state.answers.schoolUploadsDirectly === 'no') {
    return 'Applicant or school';
  }

  return 'Verify upload owner';
}

function buildOptionHint(questionId, optionValue) {
  const hints = {
    currentlySecondary: {
      yes: 'Use the current-school path.',
      no: 'Use the finished-secondary path.',
      not_sure: 'Keep the result broad for now.',
    },
    multipleSchools: {
      yes: 'Expect more than one transcript source.',
      no: 'Focus on one secondary school.',
      not_sure: 'A recent school move may still matter.',
    },
    attendedCollege: {
      yes: 'A postsecondary transcript may be needed.',
      no: 'Keep the file focused on school records before college.',
      not_sure: 'Confirm whether any college history exists.',
    },
    predictedScores: {
      yes: 'The school may need to send this directly.',
      no: 'Skip exam-document follow-up unless official guidance says otherwise.',
      not_sure: 'Verify whether predicted scores are part of the file.',
    },
    schoolUploadsDirectly: {
      yes: 'The school likely owns at least one submission step.',
      no: 'The applicant may need to manage more of the uploads.',
      not_sure: 'Clarify ownership before chasing documents.',
    },
    missingPreviousRecords: {
      yes: 'This is a likely blocker.',
      no: 'Former school records are available.',
      not_sure: 'Confirm whether the old record exists.',
    },
    incompleteReasonUnclear: {
      yes: 'Expect process follow-up in the results.',
      no: 'The results can stay more targeted.',
    },
  };

  return hints[questionId][optionValue];
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
