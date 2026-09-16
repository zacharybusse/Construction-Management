/* ==========================================================================
   app.js — Main application logic: routing, theming, progress tracking,
   data loading, and wiring for all interactive sections.
   ========================================================================== */

const NAV_PAGES = ["home", "week1", "week2", "week3", "week4", "real-construction", "glossary", "resources", "about"];
const TRACKED_WEEKS = ["week1", "week2", "week3", "week4", "real-construction"];
const PROGRESS_KEY = "fe-learning-progress-v1";
const THEME_KEY = "fe-learning-theme";
const CHECKLIST_KEY = "fe-checklist-v1";

function qs(id) {
  return document.getElementById(id);
}

/* ---------------------------------------------------------------------- */
/* Data fetching                                                          */
/* ---------------------------------------------------------------------- */
async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to load", path, err);
    return null;
  }
}

async function loadAllData() {
  const [
    hierarchy,
    terminology,
    armyToConstruction,
    metaContext,
    feResponsibilities,
    decisionTrees,
    commonScenarios,
    interviewQuestions,
    talkingPoints,
    jeDunnCulture,
    mockInterview,
    resumeTips,
    closingChecklist,
    rcVideos,
    rcHabits,
    rcRedFlags,
    rcCaseStudies,
    rcExpertQA,
  ] = await Promise.all([
    fetchJSON("content/week1/hierarchy.json"),
    fetchJSON("content/week1/terminology.json"),
    fetchJSON("content/week1/army-to-construction.json"),
    fetchJSON("content/week1/meta-context.json"),
    fetchJSON("content/week2/fe-responsibilities.json"),
    fetchJSON("content/week2/decision-trees.json"),
    fetchJSON("content/week2/common-scenarios.json"),
    fetchJSON("content/week3/interview-questions.json"),
    fetchJSON("content/week3/talking-points.json"),
    fetchJSON("content/week3/je-dunn-culture.json"),
    fetchJSON("content/week4/mock-interview.json"),
    fetchJSON("content/week4/resume-tips.json"),
    fetchJSON("content/week4/closing-checklist.json"),
    fetchJSON("content/real-construction/videos.json"),
    fetchJSON("content/real-construction/habits.json"),
    fetchJSON("content/real-construction/red-flags.json"),
    fetchJSON("content/real-construction/case-studies.json"),
    fetchJSON("content/real-construction/expert-qa.json"),
  ]);

  return {
    week1: { hierarchy, terminology, armyToConstruction, metaContext },
    week2: { feResponsibilities, decisionTrees, commonScenarios },
    week3: { interviewQuestions, talkingPoints, jeDunnCulture },
    week4: { mockInterview, resumeTips, closingChecklist },
    realConstruction: { rcVideos, rcHabits, rcRedFlags, rcCaseStudies, rcExpertQA },
  };
}

/* ---------------------------------------------------------------------- */
/* Theme                                                                  */
/* ---------------------------------------------------------------------- */
function initTheme() {
  let theme = "light";
  try {
    theme = localStorage.getItem(THEME_KEY);
  } catch (e) {
    /* ignore */
  }
  if (!theme) {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(theme);

  const toggle = qs("darkModeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    /* ignore */
  }
  const toggle = qs("darkModeToggle");
  if (toggle) {
    toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}

/* ---------------------------------------------------------------------- */
/* Navigation / routing                                                   */
/* ---------------------------------------------------------------------- */
function initNav() {
  window.addEventListener("hashchange", routeFromHash);
  routeFromHash();

  const hamburger = qs("hamburger");
  const mainNav = qs("mainNav");
  if (hamburger && mainNav) {
    hamburger.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a[data-nav]").forEach((a) =>
      a.addEventListener("click", () => mainNav.classList.remove("open"))
    );
  }
}

function routeFromHash() {
  let id = window.location.hash.replace("#", "") || "home";
  if (!NAV_PAGES.includes(id)) id = "home";
  showPage(id);
}

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === id));
  document.querySelectorAll("a[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
  });
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (TRACKED_WEEKS.includes(id)) markVisited(id);
}

/* ---------------------------------------------------------------------- */
/* Progress tracking                                                      */
/* ---------------------------------------------------------------------- */
function getVisited() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function markVisited(weekId) {
  const visited = getVisited();
  if (!visited.includes(weekId)) {
    visited.push(weekId);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(visited));
    } catch (e) {
      /* ignore */
    }
  }
  updateProgressUI();
}

function updateProgressUI() {
  const visited = getVisited();
  const pct = Math.round((visited.length / TRACKED_WEEKS.length) * 100);

  const headerFill = qs("progressFill");
  if (headerFill) headerFill.style.width = pct + "%";

  const sidebarText = qs("progressText");
  if (sidebarText) sidebarText.textContent = `${pct}% complete`;

  const homeFill = qs("homeProgressFill");
  if (homeFill) homeFill.style.width = pct + "%";
  const homeLabel = qs("homeProgressLabel");
  if (homeLabel) homeLabel.textContent = `You're ${pct}% through the program`;

  const resourcesFill = qs("progressFillResources");
  if (resourcesFill) resourcesFill.style.width = pct + "%";

  document.querySelectorAll("#weekChecklist li[data-week]").forEach((li) => {
    li.classList.toggle("visited", visited.includes(li.dataset.week));
  });
}

function resetProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch (e) {
    /* ignore */
  }
  updateProgressUI();
}

/* ---------------------------------------------------------------------- */
/* Expandable helper (generic accordion behavior w/ localStorage memory)  */
/* ---------------------------------------------------------------------- */
function wireExpandable(container, itemSelector, btnSelector, storageKey) {
  let openState = {};
  try {
    openState = JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch (e) {
    /* ignore */
  }
  container.querySelectorAll(itemSelector).forEach((item, i) => {
    const key = item.id || String(i);
    if (openState[key]) item.dataset.open = "true";
    const btn = item.querySelector(btnSelector);
    btn.addEventListener("click", () => {
      const isOpen = item.dataset.open === "true";
      item.dataset.open = String(!isOpen);
      openState[key] = !isOpen;
      try {
        localStorage.setItem(storageKey, JSON.stringify(openState));
      } catch (e) {
        /* ignore */
      }
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Week 1: Meta snapshot                                                  */
/* ---------------------------------------------------------------------- */
function renderMetaSnapshot(meta) {
  const el = qs("metaSnapshot");
  if (!el || !meta) return;
  el.innerHTML = `
    <div class="flex-between">
      <div>
        <h3 class="mb-0">${escHtml(meta.projectName)}</h3>
        <p class="mb-0" style="color:var(--color-text-muted);">${escHtml(meta.companyContext)}</p>
      </div>
    </div>
    <div class="culture-grid mt-1">
      <div class="culture-stat"><div class="stat-num">${escHtml(meta.scale.investment)}</div><div class="stat-label">Investment</div></div>
      <div class="culture-stat"><div class="stat-num">${escHtml(meta.scale.duration)}</div><div class="stat-label">Duration</div></div>
      <div class="culture-stat"><div class="stat-num">${escHtml(meta.scale.constructionJobs)}</div><div class="stat-label">Construction Jobs</div></div>
      <div class="culture-stat"><div class="stat-num">${escHtml(meta.scale.operationalJobs)}</div><div class="stat-label">Operational Jobs</div></div>
    </div>
    <p class="mt-1"><strong>Why this matters:</strong> ${escHtml(meta.whyThisMatters)}</p>
    <img src="images/meta-project-map.svg" alt="Meta El Paso project snapshot diagram" style="width:100%;height:auto;margin-top:1rem;border-radius:var(--radius);border:1px solid var(--color-border);" />
  `;
}

/* ---------------------------------------------------------------------- */
/* Week 1.1: Interactive hierarchy                                        */
/* ---------------------------------------------------------------------- */
async function renderHierarchy(hierarchy) {
  const svgContainer = qs("hierarchySvgContainer");
  const detail = qs("hierarchyDetail");
  if (!svgContainer || !hierarchy) return;

  try {
    const res = await fetch("images/hierarchy-chart.svg");
    svgContainer.innerHTML = await res.text();
  } catch (e) {
    svgContainer.innerHTML = `<img src="images/hierarchy-chart.svg" alt="Construction site hierarchy chart" style="width:100%;height:auto;" />`;
    console.error("Could not inline hierarchy SVG for interactivity", e);
  }

  function showRole(role) {
    detail.innerHTML = `
      <h4>${escHtml(role.title)}</h4>
      <p>${escHtml(role.description)}</p>
      <ul>${role.responsibilities.map((r) => `<li>${escHtml(r)}</li>`).join("")}</ul>
      ${role.context ? `<p class="context-note">${escHtml(role.context)}</p>` : ""}
    `;
    svgContainer.querySelectorAll(".role-node").forEach((n) => n.classList.toggle("selected", n.dataset.role === role.id));
  }

  const feRole = hierarchy.roles.find((r) => r.isYou);

  svgContainer.querySelectorAll(".role-node").forEach((node) => {
    const role = hierarchy.roles.find((r) => r.id === node.dataset.role);
    if (!role) return;
    node.addEventListener("click", () => showRole(role));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showRole(role);
      }
    });
  });

  if (feRole) showRole(feRole);
}

/* ---------------------------------------------------------------------- */
/* Week 1.2: Daily timeline (content authored directly — no JSON file     */
/* is specified for this section in the site structure).                 */
/* ---------------------------------------------------------------------- */
const TIMELINE_DATA = [
  {
    id: "morning",
    label: "Morning",
    time: "7:00 - 9:00 AM",
    tasks: [
      { title: "Review Daily Plan & Drawings", detail: "Review today's schedule, drawings, and specs for each active work area so you know exactly what should be happening before you walk the site." },
      { title: "Safety Huddle / Toolbox Talk", detail: "Join or lead the morning safety briefing with trade foremen, covering hazards specific to today's work." },
      { title: "Coordinate Sequence with Foremen", detail: "Confirm which trades are working where today and resolve any sequencing conflicts before work starts." },
      { title: "Set Inspection Priorities", detail: "Identify which areas need inspection today based on what's scheduled to be covered or completed." },
    ],
  },
  {
    id: "midday",
    label: "Mid-Day",
    time: "9:00 AM - 3:00 PM",
    tasks: [
      { title: "Layout Inspection", detail: "Verify layout and control points against drawings before trades build off them. Using survey equipment, check dimensions against two independent reference points. A layout error here compounds through every trade built on top of it. Checklist: control points verified, dimensions match drawings, elevation confirmed." },
      { title: "Quality / Zone Walks", detail: "Walk active work areas checking plumb, level, dimensions, and materials against approved submittals; document any defects immediately with photos and exact location." },
      { title: "MEP Rough-In Checks", detail: "Inspect MEP rough-in before it's covered by drywall or ceiling tile — this is your last chance to catch a problem before it becomes an expensive tear-out." },
      { title: "Trade Coordination", detail: "Resolve conflicts between trades working the same physical space, and follow up on open RFIs affecting active work." },
      { title: "Respond to Field Issues", detail: "Handle unplanned issues as they come up — a subcontractor question, a spec conflict, an unexpected site condition." },
    ],
  },
  {
    id: "lateday",
    label: "Late Day",
    time: "3:00 - 4:00 PM",
    tasks: [
      { title: "Write Daily Report", detail: "Document manpower, weather, work performed, deliveries, and any issues from the day — this is the project's legal and historical record." },
      { title: "Update Punch List / RFI Log", detail: "Log any new punch items and update the status of open RFIs and submittals." },
      { title: "Plan Next Day's Priorities", detail: "Review tomorrow's schedule and flag anything that needs coordination before work starts." },
    ],
  },
];

function renderTimeline() {
  const container = qs("timelineContainer");
  if (!container) return;
  container.innerHTML = TIMELINE_DATA.map(
    (col) => `
    <div class="timeline-col">
      <div class="timeline-col-head">
        <h4>${escHtml(col.label)}</h4>
        <span>${escHtml(col.time)}</span>
      </div>
      <ul class="timeline-tasks">
        ${col.tasks
          .map(
            (t, i) => `
          <li class="timeline-task" data-open="false" id="task-${col.id}-${i}">
            <button class="timeline-task-btn" aria-expanded="false">
              <span>${escHtml(t.title)}</span>
              <span class="chevron" aria-hidden="true">›</span>
            </button>
            <div class="timeline-task-body"><p class="mb-0">${escHtml(t.detail)}</p></div>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `
  ).join("");

  wireExpandable(container, ".timeline-task", ".timeline-task-btn", "fe-timeline-open");
}

/* ---------------------------------------------------------------------- */
/* Week 1.4: Army-to-Construction Translator                              */
/* ---------------------------------------------------------------------- */
function renderTranslator(data) {
  const container = qs("translatorContainer");
  if (!container || !data) return;
  const translations = data.translations;

  container.innerHTML = `
    <div class="translator-tabs" id="translatorTabs" role="tablist">
      ${translations.map((t, i) => `<button class="translator-tab${i === 0 ? " active" : ""}" data-id="${escHtml(t.id)}">${escHtml(t.armyProject)}</button>`).join("")}
    </div>
    <div id="translatorPanel"></div>
  `;

  const tabsWrap = qs("translatorTabs");
  const panel = qs("translatorPanel");

  function renderPanel(t) {
    panel.innerHTML = `
      <div class="translator-panel">
        <div class="translator-col">
          <h4>Your Army Project</h4>
          <p><strong>${escHtml(t.armyProject)}</strong></p>
          <p>${escHtml(t.armyContext)}</p>
        </div>
        <div class="translator-arrow" aria-hidden="true">→</div>
        <div class="translator-col">
          <h4>Construction Equivalent</h4>
          <p>${escHtml(t.constructionEquivalent)}</p>
          <ul class="translator-mapping-list">
            ${Object.entries(t.mapping)
              .map(([k, v]) => `<li><span class="army-term">${escHtml(k)}</span> → ${escHtml(v)}</li>`)
              .join("")}
          </ul>
        </div>
      </div>
      <div class="key-insight"><strong>Key Insight:</strong> ${escHtml(t.keyInsight)}</div>
      <p class="how-applies"><strong>How your Army experience directly applies:</strong> ${escHtml(t.howItApplies)}</p>
    `;
  }

  tabsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".translator-tab");
    if (!btn) return;
    tabsWrap.querySelectorAll(".translator-tab").forEach((b) => b.classList.toggle("active", b === btn));
    renderPanel(translations.find((t) => t.id === btn.dataset.id));
  });

  renderPanel(translations[0]);
}

/* ---------------------------------------------------------------------- */
/* Week 2.1: FE Responsibilities Matrix                                   */
/* ---------------------------------------------------------------------- */
function renderMatrix(data) {
  const container = qs("matrixContainer");
  if (!container || !data) return;
  const rows = data.responsibilities;

  container.innerHTML = `
    <div class="matrix-controls">
      <select id="matrixFrequency" aria-label="Filter by frequency">
        <option value="all">All Frequencies</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="as needed">As Needed</option>
      </select>
      <select id="matrixRisk" aria-label="Filter by risk level">
        <option value="all">All Risk Levels</option>
        <option value="high">High Risk</option>
        <option value="medium">Medium Risk</option>
        <option value="low">Low Risk</option>
      </select>
    </div>
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead><tr><th>Task</th><th>Frequency</th><th>Who Else Is Involved</th><th>Common Mistakes</th></tr></thead>
        <tbody id="matrixBody"></tbody>
      </table>
    </div>
  `;

  const freqSelect = qs("matrixFrequency");
  const riskSelect = qs("matrixRisk");
  const body = qs("matrixBody");

  function renderRows() {
    const freq = freqSelect.value;
    const risk = riskSelect.value;
    const filtered = rows.filter(
      (r) => (freq === "all" || r.frequency === freq) && (risk === "all" || r.riskLevel === risk)
    );
    body.innerHTML = filtered
      .map(
        (r) => `
      <tr>
        <td><strong>${escHtml(r.task)}</strong><br/><span class="risk-pill risk-${escHtml(r.riskLevel)}">${escHtml(r.riskLevel)} risk</span></td>
        <td>${escHtml(r.frequency)}</td>
        <td>${r.involved.map((i) => escHtml(i)).join(", ")}</td>
        <td>${r.commonMistakes.map((m) => escHtml(m)).join("; ")}</td>
      </tr>
    `
      )
      .join("");
  }

  freqSelect.addEventListener("change", renderRows);
  riskSelect.addEventListener("change", renderRows);
  renderRows();
}

/* ---------------------------------------------------------------------- */
/* Week 3.1: Interview Question Bank                                      */
/* ---------------------------------------------------------------------- */
const IQ_CATEGORY_LABELS = {
  opening: "Opening",
  technical: "Technical FE",
  behavioral: "Behavioral / Situational",
  "your-questions": "Questions to Ask",
};

function renderInterviewQuestions(data) {
  const container = qs("interviewQuestionsContainer");
  if (!container || !data) return;
  const questions = data.questions;
  const categories = [...new Set(questions.map((q) => q.category))];

  container.innerHTML = `
    <div class="iq-filters" id="iqFilters">
      <button class="filter-chip active" data-cat="all">All (${questions.length})</button>
      ${categories
        .map((c) => `<button class="filter-chip" data-cat="${c}">${escHtml(IQ_CATEGORY_LABELS[c] || c)} (${questions.filter((q) => q.category === c).length})</button>`)
        .join("")}
    </div>
    <div class="iq-list" id="iqList"></div>
  `;

  const filters = qs("iqFilters");
  const list = qs("iqList");

  function renderList(cat) {
    const filtered = cat === "all" ? questions : questions.filter((q) => q.category === cat);
    list.innerHTML = filtered
      .map(
        (q, i) => `
      <div class="iq-card" data-open="false" id="iq-${escHtml(q.id)}">
        <span class="iq-cat">${escHtml(IQ_CATEGORY_LABELS[q.category] || q.category)}</span>
        <h4>${escHtml(q.question)}</h4>
        <button class="iq-toggle" aria-expanded="false">Show details</button>
        <dl class="iq-detail">
          ${q.whyAsking ? `<dt>Why They're Asking</dt><dd>${escHtml(q.whyAsking)}</dd>` : ""}
          ${q.sampleAnswer ? `<dt>Sample Answer</dt><dd>${escHtml(q.sampleAnswer)}</dd>` : ""}
          ${q.redFlags ? `<dt>Red Flags to Avoid</dt><dd>${escHtml(q.redFlags)}</dd>` : ""}
          ${q.timeLimit ? `<dt>Time Limit</dt><dd>${escHtml(q.timeLimit)}</dd>` : ""}
          ${q.armyFrame ? `<dt>How to Frame Army Experience</dt><dd>${escHtml(q.armyFrame)}</dd>` : ""}
        </dl>
      </div>
    `
      )
      .join("");

    list.querySelectorAll(".iq-card").forEach((card) => {
      const btn = card.querySelector(".iq-toggle");
      btn.addEventListener("click", () => {
        const isOpen = card.dataset.open === "true";
        card.dataset.open = String(!isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
        btn.textContent = !isOpen ? "Hide details" : "Show details";
      });
    });
  }

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    filters.querySelectorAll(".filter-chip").forEach((b) => b.classList.toggle("active", b === btn));
    renderList(btn.dataset.cat);
  });

  renderList("all");
}

/* ---------------------------------------------------------------------- */
/* Week 3.2 / 3.3: Talking points + culture                               */
/* ---------------------------------------------------------------------- */
function renderTalkingPoints(data) {
  const container = qs("talkingPointsContainer");
  if (!container || !data) return;
  container.innerHTML = `
    <div class="key-insight">${escHtml(data.yourStory)}</div>
    <h4 class="mt-1">Army Project Analogies</h4>
    <ul>
      ${data.projectAnalogies.map((p) => `<li><strong>${escHtml(p.project)}</strong> = ${escHtml(p.translatesTo)}</li>`).join("")}
    </ul>
    <h4>Why You're Good at This</h4>
    <ul>${data.whyYoureGoodAtThis.map((w) => `<li>${escHtml(w)}</li>`).join("")}</ul>
    <h4>Meta El Paso Relevance</h4>
    <p>${escHtml(data.metaElPasoRelevance)}</p>
  `;
}

function renderCulture(data) {
  const container = qs("cultureContainer");
  if (!container || !data) return;
  container.innerHTML = `
    <div class="culture-grid">
      <div class="culture-stat"><div class="stat-num">${escHtml(data.companyInfo.founded)}</div><div class="stat-label">Founded</div></div>
      <div class="culture-stat"><div class="stat-num">${escHtml(data.companyInfo.employees)}</div><div class="stat-label">Employees</div></div>
      <div class="culture-stat"><div class="stat-num">${escHtml(data.companyInfo.ranking)}</div><div class="stat-label">Ranking</div></div>
      <div class="culture-stat"><div class="stat-num">${escHtml(data.companyInfo.structure)}</div><div class="stat-label">Structure</div></div>
    </div>
    <p class="mt-1"><strong>Founding Philosophy:</strong> "${escHtml(data.foundingPhilosophy)}"</p>
    <h4>Project Types</h4>
    <div class="tag-list">${data.projectTypes.map((p) => `<span>${escHtml(p)}</span>`).join("")}</div>
    <h4 class="mt-1">South Central Region</h4>
    <div class="tag-list">${data.southCentralRegion.map((p) => `<span>${escHtml(p)}</span>`).join("")}</div>
    <h4 class="mt-1">What They Value in Field Engineers</h4>
    <div class="tag-list">${data.whatTheyValueInFEs.map((p) => `<span>${escHtml(p)}</span>`).join("")}</div>
    <h4 class="mt-1">Common Interview Themes</h4>
    <div class="tag-list">${data.commonInterviewThemes.map((p) => `<span>${escHtml(p)}</span>`).join("")}</div>
  `;
}

/* ---------------------------------------------------------------------- */
/* Week 4.2: Pre-Interview Checklist                                      */
/* ---------------------------------------------------------------------- */
function renderChecklist(data) {
  const container = qs("checklistContainer");
  if (!container || !data) return;

  let checked = {};
  try {
    checked = JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || {};
  } catch (e) {
    /* ignore */
  }

  container.innerHTML = `
    <ul class="checklist" id="checklistItems">
      ${data.items
        .map(
          (item) => `
        <li>
          <input type="checkbox" id="chk-${escHtml(item.id)}" ${checked[item.id] ? "checked" : ""} />
          <label for="chk-${escHtml(item.id)}" class="${checked[item.id] ? "done" : ""}">${escHtml(item.text)}</label>
        </li>
      `
        )
        .join("")}
    </ul>
    <div class="mock-controls">
      <button class="btn btn-secondary btn-sm" id="printChecklist">Print Checklist</button>
    </div>
  `;

  qs("checklistItems")
    .querySelectorAll('input[type="checkbox"]')
    .forEach((box) => {
      box.addEventListener("change", () => {
        const id = box.id.replace("chk-", "");
        checked[id] = box.checked;
        try {
          localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
        } catch (e) {
          /* ignore */
        }
        box.nextElementSibling.classList.toggle("done", box.checked);
      });
    });

  qs("printChecklist").addEventListener("click", () => window.print());
}

/* ---------------------------------------------------------------------- */
/* Week 4.3: Quick Reference (print-ready one-pager)                      */
/* ---------------------------------------------------------------------- */
const QUICK_REF_ACRONYMS = [
  "RFI — Request for Information",
  "MEP — Mechanical, Electrical, Plumbing",
  "QA/QC — Quality Assurance / Quality Control",
  "HVAC — Heating, Ventilation, Air Conditioning",
  "NCR — Non-Conformance Report",
  "GC — General Contractor",
  "FE — Field Engineer",
  "PM — Project Manager",
];

function renderQuickRef(terminology, hierarchy) {
  const container = qs("quickRefContainer");
  if (!container || !terminology || !hierarchy) return;
  const topTerms = [...terminology.terms].sort((a, b) => a.term.localeCompare(b.term)).slice(0, 20);

  container.innerHTML = `
    <div class="mock-controls">
      <button class="btn btn-secondary btn-sm" id="printQuickRef">Print / Download Quick Reference</button>
    </div>
    <div class="quick-ref-grid mt-1">
      <div class="quick-ref-block">
        <h4>Hierarchy (Top to Bottom)</h4>
        <ul>${hierarchy.roles.map((r) => `<li>${escHtml(r.title)}</li>`).join("")}</ul>
      </div>
      <div class="quick-ref-block">
        <h4>Key Acronyms</h4>
        <ul>${QUICK_REF_ACRONYMS.map((a) => `<li>${escHtml(a)}</li>`).join("")}</ul>
      </div>
      <div class="quick-ref-block" style="grid-column: 1 / -1;">
        <h4>20 Must-Know Terms</h4>
        <ul style="column-count:2;">${topTerms.map((t) => `<li><strong>${escHtml(t.term)}:</strong> ${escHtml(t.definition)}</li>`).join("")}</ul>
      </div>
    </div>
  `;

  qs("printQuickRef").addEventListener("click", () => window.print());
}

/* ---------------------------------------------------------------------- */
/* Utility                                                                */
/* ---------------------------------------------------------------------- */
function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function showLoadWarning() {
  const banner = document.createElement("div");
  banner.className = "placeholder-note";
  banner.style.margin = "1rem 1.25rem";
  banner.innerHTML =
    "Some content couldn't load automatically. If you opened this file directly from disk, run a local server (<code>npm start</code> or <code>python3 -m http.server 8000</code>) and open the site at <code>http://localhost:8000</code> instead — browsers block local file requests for security.";
  document.body.insertBefore(banner, document.body.firstChild.nextSibling);
}

/* ---------------------------------------------------------------------- */
/* Bootstrap                                                              */
/* ---------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initNav();
  updateProgressUI();

  const resetBtn = qs("resetProgressBtn");
  if (resetBtn) resetBtn.addEventListener("click", resetProgress);
  const resetBtn2 = qs("resetProgressBtn2");
  if (resetBtn2) resetBtn2.addEventListener("click", resetProgress);

  const data = await loadAllData();

  const anyMissing = Object.values(data).some((week) => Object.values(week).some((v) => v === null));
  if (anyMissing) showLoadWarning();

  // Week 1
  if (data.week1.metaContext) renderMetaSnapshot(data.week1.metaContext);
  if (data.week1.hierarchy) renderHierarchy(data.week1.hierarchy);
  renderTimeline();
  if (data.week1.terminology) {
    Glossary.mount(qs("week1Glossary"), data.week1.terminology.terms, {
      defaultCategory: "structural",
      storageKey: "fe-week1-glossary",
    });
    Glossary.mount(qs("glossaryPageContainer"), data.week1.terminology.terms, {
      defaultCategory: "all",
      storageKey: "fe-full-glossary",
    });
  }
  if (data.week1.armyToConstruction) renderTranslator(data.week1.armyToConstruction);

  // Week 2
  if (data.week2.feResponsibilities) renderMatrix(data.week2.feResponsibilities);
  if (data.week2.decisionTrees) DecisionTree.mount(qs("decisionTreeContainer"), data.week2.decisionTrees.scenarios);
  if (data.week2.commonScenarios) ScenarioSolver.mount(qs("scenarioSolverContainer"), data.week2.commonScenarios.scenarios);

  // Week 3
  if (data.week3.interviewQuestions) renderInterviewQuestions(data.week3.interviewQuestions);
  if (data.week3.talkingPoints) renderTalkingPoints(data.week3.talkingPoints);
  if (data.week3.jeDunnCulture) renderCulture(data.week3.jeDunnCulture);

  // Week 4
  if (data.week4.mockInterview && data.week3.interviewQuestions) {
    MockInterview.mount(qs("mockInterviewContainer"), data.week4.mockInterview, data.week3.interviewQuestions.questions);
  }
  if (data.week4.closingChecklist) renderChecklist(data.week4.closingChecklist);
  if (data.week1.terminology && data.week1.hierarchy) renderQuickRef(data.week1.terminology, data.week1.hierarchy);

  // Real Construction
  const rc = data.realConstruction;
  if (rc.rcVideos) VideoLibrary.mount(qs("rcVideoLibrary"), rc.rcVideos.videos);
  if (rc.rcHabits) HabitTracker.mount(qs("rcHabitTracker"), rc.rcHabits);
  if (rc.rcRedFlags) RedFlagsLibrary.mount(qs("rcRedFlags"), rc.rcRedFlags.flags);
  if (rc.rcCaseStudies) CaseStudies.mount(qs("rcCaseStudies"), rc.rcCaseStudies.studies);
  if (rc.rcExpertQA) ExpertQA.mount(qs("rcExpertQA"), rc.rcExpertQA.questions);
  if (rc.rcVideos && rc.rcHabits && rc.rcRedFlags && rc.rcCaseStudies) {
    RCDashboard.mount(qs("rcDashboard"), {
      videoTotal: rc.rcVideos.videos.length,
      flagTotal: rc.rcRedFlags.flags.length,
      caseTotal: rc.rcCaseStudies.studies.length,
    });
  }
});
