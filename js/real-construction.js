/* ==========================================================================
   real-construction.js — Video library, habit tracker, red flags library,
   case studies, expert Q&A, and the Real Construction progress dashboard.
   Relies on the global escHtml() already defined in scenarios.js.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Shared localStorage helpers                                            */
/* ---------------------------------------------------------------------- */
const RC_KEYS = {
  favorites: "fe-rc-favorites",
  viewedVideos: "fe-rc-viewed-videos",
  viewedFlags: "fe-rc-viewed-redflags",
  viewedCases: "fe-rc-viewed-cases",
  habitLog: "fe-rc-habit-log",
};

function rcGetSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key)) || []);
  } catch (e) {
    return new Set();
  }
}
function rcSaveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch (e) {
    /* ignore */
  }
}
function rcMarkViewed(key, id) {
  const set = rcGetSet(key);
  if (!set.has(id)) {
    set.add(id);
    rcSaveSet(key, set);
  }
}
function rcFormatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function rcGetHabitLog() {
  try {
    return JSON.parse(localStorage.getItem(RC_KEYS.habitLog)) || {};
  } catch (e) {
    return {};
  }
}
function rcSaveHabitLog(log) {
  try {
    localStorage.setItem(RC_KEYS.habitLog, JSON.stringify(log));
  } catch (e) {
    /* ignore */
  }
}

/* ---------------------------------------------------------------------- */
/* Modal overlay (shared by Video Library)                                */
/* ---------------------------------------------------------------------- */
const RCModal = (function () {
  let overlay = null;

  function ensure() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "rc-modal-overlay";
    overlay.innerHTML = `<div class="rc-modal" role="dialog" aria-modal="true"><button class="rc-modal-close" aria-label="Close">&times;</button><div class="rc-modal-body"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".rc-modal-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
    return overlay;
  }

  function open(html) {
    const el = ensure();
    el.querySelector(".rc-modal-body").innerHTML = html;
    el.classList.add("open");
    document.body.style.overflow = "hidden";
    return el.querySelector(".rc-modal-body");
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  return { open, close };
})();

/* ---------------------------------------------------------------------- */
/* Video Library                                                          */
/* ---------------------------------------------------------------------- */
const VideoLibrary = (function () {
  let videosById = {};

  function categoryLabel(c) {
    return c.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function cardHtml(v) {
    const favs = rcGetSet(RC_KEYS.favorites);
    const isFav = favs.has(v.id);
    const initials = v.creator
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return `
      <article class="rc-video-card" data-id="${escHtml(v.id)}">
        <div class="rc-video-thumb" style="${v.thumbnailUrl ? `background-image:url('${escHtml(v.thumbnailUrl)}')` : ""}">
          ${v.thumbnailUrl ? "" : `<span class="rc-thumb-fallback">${escHtml(initials)}</span>`}
          <button class="rc-fav-btn" data-fav="${escHtml(v.id)}" aria-pressed="${isFav}" aria-label="Toggle favorite">${isFav ? "★" : "☆"}</button>
        </div>
        <div class="rc-video-body">
          <div class="rc-video-creator">${escHtml(v.creator)}</div>
          <h4 class="rc-video-title">${escHtml(v.title)}</h4>
          ${v.duration ? `<div class="rc-video-duration">${escHtml(v.duration)}</div>` : ""}
          <div class="tag-list rc-tag-list">${v.category.map((c) => `<span>${escHtml(categoryLabel(c))}</span>`).join("")}</div>
          <p class="rc-key-takeaway">${escHtml(v.keyTakeaway)}</p>
          <button class="btn btn-secondary btn-sm rc-open-btn" data-open="${escHtml(v.id)}">View Details</button>
        </div>
      </article>
    `;
  }

  function openDetail(id) {
    const v = videosById[id];
    if (!v) return;
    rcMarkViewed(RC_KEYS.viewedVideos, id);
    const favs = rcGetSet(RC_KEYS.favorites);
    const isFav = favs.has(id);
    const body = RCModal.open(`
      <span class="rc-video-creator">${escHtml(v.creator)} — ${escHtml(v.platform)}</span>
      <h3>${escHtml(v.title)}</h3>
      <div class="tag-list rc-tag-list">${v.category.map((c) => `<span>${escHtml(categoryLabel(c))}</span>`).join("")}</div>
      <p class="mt-1">${escHtml(v.keyTakeaway)}</p>
      <p><strong>Why it matters:</strong> ${escHtml(v.whyMatters)}</p>
      ${v.relatedGlossary && v.relatedGlossary.length ? `<p><strong>Related glossary:</strong> ${v.relatedGlossary.map((t) => escHtml(t)).join(", ")}</p>` : ""}
      ${v.reflectionPrompt ? `<div class="key-insight">${escHtml(v.reflectionPrompt)}</div>` : ""}
      <div class="mock-controls mt-1">
        ${v.url ? `<a class="btn btn-sm" href="${escHtml(v.url)}" target="_blank" rel="noopener">View on ${escHtml(v.platform)}</a>` : ""}
        <button class="btn btn-secondary btn-sm" data-fav="${escHtml(v.id)}">${isFav ? "★ Favorited" : "☆ Add to Favorites"}</button>
      </div>
    `);
    body.querySelector("[data-fav]").addEventListener("click", (e) => {
      toggleFavorite(e.target.dataset.fav);
      openDetail(id);
    });
  }

  function toggleFavorite(id) {
    const favs = rcGetSet(RC_KEYS.favorites);
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    rcSaveSet(RC_KEYS.favorites, favs);
  }

  function mount(root, videos) {
    videosById = {};
    videos.forEach((v) => (videosById[v.id] = v));
    const categories = [...new Set(videos.flatMap((v) => v.category))];

    root.innerHTML = `
      <div class="glossary-controls">
        <div class="search-box">
          <input type="search" id="rcVideoSearch" placeholder="Search videos by title or keyword..." aria-label="Search videos" />
          <button class="clear-btn" id="rcVideoClear" aria-label="Clear search">&times;</button>
        </div>
      </div>
      <div class="category-filters" id="rcVideoFilters">
        <button class="filter-chip active" data-cat="all">All (${videos.length})</button>
        ${categories.map((c) => `<button class="filter-chip" data-cat="${escHtml(c)}">${escHtml(categoryLabel(c))}</button>`).join("")}
      </div>
      <p class="result-count" id="rcVideoCount"></p>
      <div class="rc-video-grid" id="rcVideoGrid"></div>
    `;

    const searchInput = qs("rcVideoSearch");
    const clearBtn = qs("rcVideoClear");
    const filters = qs("rcVideoFilters");
    const grid = qs("rcVideoGrid");
    const countEl = qs("rcVideoCount");

    let state = { query: "", category: "all" };

    function render() {
      const filtered = videos.filter(
        (v) =>
          (state.category === "all" || v.category.includes(state.category)) &&
          (!state.query ||
            v.title.toLowerCase().includes(state.query.toLowerCase()) ||
            v.keyTakeaway.toLowerCase().includes(state.query.toLowerCase()))
      );
      countEl.textContent = `${filtered.length} video${filtered.length === 1 ? "" : "s"} found`;
      grid.innerHTML = filtered.length
        ? filtered.map(cardHtml).join("")
        : `<p class="no-results">No videos match your filters.</p>`;

      filters.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.cat === state.category));

      grid.querySelectorAll("[data-open]").forEach((btn) => btn.addEventListener("click", () => openDetail(btn.dataset.open)));
      grid.querySelectorAll(".rc-video-thumb .rc-fav-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavorite(btn.dataset.fav);
          render();
        })
      );
      grid.querySelectorAll(".rc-video-card").forEach((card) =>
        card.addEventListener("click", (e) => {
          if (e.target.closest(".rc-fav-btn")) return;
          if (e.target.closest(".rc-open-btn")) return;
          openDetail(card.dataset.id);
        })
      );
    }

    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
    clearBtn.addEventListener("click", () => {
      state.query = "";
      searchInput.value = "";
      render();
    });
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      state.category = btn.dataset.cat;
      render();
    });

    render();
  }

  function viewedCount() {
    return rcGetSet(RC_KEYS.viewedVideos).size;
  }

  function openVideoIfLoaded(id) {
    if (videosById[id]) openDetail(id);
  }

  return { mount, viewedCount, openVideoIfLoaded };
})();

/* ---------------------------------------------------------------------- */
/* Habit Tracker                                                          */
/* ---------------------------------------------------------------------- */
const HabitTracker = (function () {
  let habitsData = [];

  function streakFor(habitId) {
    const log = rcGetHabitLog();
    let d = new Date();
    if (!(log[rcFormatDate(d)] || []).includes(habitId)) {
      d.setDate(d.getDate() - 1);
    }
    let streak = 0;
    while (true) {
      const key = rcFormatDate(d);
      if ((log[key] || []).includes(habitId)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function last7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  function weeklyScorePct() {
    const log = rcGetHabitLog();
    const days = last7Days();
    const total = days.reduce((sum, d) => sum + (log[rcFormatDate(d)] || []).length, 0);
    const max = habitsData.length * 7;
    return max ? Math.round((total / max) * 100) : 0;
  }

  function renderWeekChart() {
    const log = rcGetHabitLog();
    const days = last7Days();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `
      <div class="rc-week-chart">
        ${days
          .map((d) => {
            const count = (log[rcFormatDate(d)] || []).length;
            const pct = habitsData.length ? Math.round((count / habitsData.length) * 100) : 0;
            const level = count >= 5 ? "good" : count >= 2 ? "partial" : "missed";
            return `
            <div class="rc-week-day">
              <div class="rc-week-bar-track"><div class="rc-week-bar-fill rc-level-${level}" style="height:${pct}%"></div></div>
              <div class="rc-week-day-label">${dayNames[d.getDay()]}</div>
              <div class="rc-week-day-count">${count}/${habitsData.length}</div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }

  function todayChecked() {
    const log = rcGetHabitLog();
    return new Set(log[rcFormatDate(new Date())] || []);
  }

  function mount(root, data) {
    habitsData = data.dailyHabits;

    root.innerHTML = `
      <div class="rc-habit-list" id="rcHabitList"></div>
      <div class="subsection" style="margin-top:1.5rem;box-shadow:none;">
        <div class="flex-between">
          <h4 class="mb-0">This Week</h4>
          <span id="rcWeeklyScoreLabel" class="progress-summary mb-0"></span>
        </div>
        <div id="rcWeekChart"></div>
        <p style="color:var(--color-text-muted);font-size:0.9rem;" id="rcWeeklyGoalNote"></p>
      </div>
    `;

    function render() {
      const checked = todayChecked();
      qs("rcHabitList").innerHTML = habitsData
        .map((h) => {
          const streak = streakFor(h.id);
          const isChecked = checked.has(h.id);
          return `
          <div class="rc-habit-card" style="border-left-color:${escHtml(h.color || "#1976D2")}">
            <label class="rc-habit-check">
              <input type="checkbox" data-habit="${escHtml(h.id)}" ${isChecked ? "checked" : ""} />
              <span></span>
            </label>
            <div class="rc-habit-info">
              <div class="flex-between">
                <h4 class="mb-0">${escHtml(h.habit)}</h4>
                ${streak > 0 ? `<span class="rc-streak-badge">🔥 ${streak} day${streak === 1 ? "" : "s"}</span>` : ""}
              </div>
              <p class="mb-0">${escHtml(h.description)}</p>
              <p class="rc-habit-why">${escHtml(h.whyMatters)}</p>
              ${h.relatedVideos && h.relatedVideos.length ? `<button class="btn btn-secondary btn-sm rc-learn-more" data-video="${escHtml(h.relatedVideos[0])}">Learn More</button>` : ""}
            </div>
          </div>
        `;
        })
        .join("");

      qs("rcHabitList")
        .querySelectorAll('input[type="checkbox"]')
        .forEach((box) =>
          box.addEventListener("change", () => {
            const log = rcGetHabitLog();
            const key = rcFormatDate(new Date());
            const dayList = new Set(log[key] || []);
            if (box.checked) dayList.add(box.dataset.habit);
            else dayList.delete(box.dataset.habit);
            log[key] = [...dayList];
            rcSaveHabitLog(log);
            render();
          })
        );

      qs("rcHabitList")
        .querySelectorAll(".rc-learn-more")
        .forEach((btn) =>
          btn.addEventListener("click", () => {
            if (typeof VideoLibrary !== "undefined" && VideoLibrary.openVideoIfLoaded) {
              VideoLibrary.openVideoIfLoaded(btn.dataset.video);
            }
          })
        );

      qs("rcWeekChart").innerHTML = renderWeekChart();
      const pct = weeklyScorePct();
      qs("rcWeeklyScoreLabel").textContent = `${pct}% this week`;
      qs("rcWeeklyGoalNote").textContent = `Goal: ${data.weeklyGoal || "Practice all habits consistently"}`;
    }

    render();
  }

  return { mount, weeklyScorePct };
})();

/* ---------------------------------------------------------------------- */
/* Red Flags Library                                                      */
/* ---------------------------------------------------------------------- */
const RedFlagsLibrary = (function () {
  const SEVERITY_LABELS = { red: "Urgent", yellow: "Important", blue: "Preventive" };

  function renderTreeNode(node, path) {
    if (node.prompt) {
      return `
        <div class="tree-node">
          <p class="tree-question">${escHtml(node.prompt)}</p>
          <div class="tree-choices">
            <button class="btn" data-path="${path}.yes">Yes</button>
            <button class="btn btn-secondary" data-path="${path}.no">No</button>
          </div>
        </div>
      `;
    }
    const isCorrect = node.path === "correct";
    return `
      <div class="tree-node">
        <p class="tree-action" style="${isCorrect ? "" : "background:rgba(192,57,43,0.1);border-left-color:var(--color-danger);"}">
          <strong>${isCorrect ? "✓ Good call." : "✗ Not quite."}</strong> ${escHtml(node.action)}
        </p>
        <p style="font-size:0.9rem;color:var(--color-text-muted);margin-top:0.5rem;">${escHtml(node.consequence)}</p>
        <p style="font-size:0.9rem;margin-top:0.5rem;"><strong>Next:</strong> ${escHtml(node.nextStep)}</p>
      </div>
    `;
  }

  function getNodeAtPath(root, pathStr) {
    const parts = pathStr.split(".").slice(1);
    let node = root;
    for (const p of parts) node = node[p];
    return node;
  }

  function mountDetail(container, flag) {
    let currentPath = "root";
    const breadcrumb = [];

    function render() {
      const node = getNodeAtPath(flag.decisionTree, currentPath);
      container.innerHTML = `
        <ul class="tree-path">${breadcrumb.map((b) => `<li>${escHtml(b)}</li>`).join("")}</ul>
        <div id="rcFlagNode"></div>
        ${!node.prompt ? `<div class="mock-controls"><button class="btn btn-secondary btn-sm" id="rcFlagRestart">Try Again</button></div>` : ""}
        <div class="subsection" style="box-shadow:none;margin-top:1.25rem;">
          <h4>Lesson</h4>
          <p>${escHtml(flag.lesson)}</p>
          <h4>Cost of Missing It</h4>
          <p>${escHtml(flag.costOfMissing)}</p>
          <h4>Prevention Strategy</h4>
          <p>${escHtml(flag.prevention)}</p>
          ${flag.realExample ? `<h4>Real-World Pattern</h4><p>${escHtml(flag.realExample)}</p>` : ""}
        </div>
      `;
      const nodeWrap = container.querySelector("#rcFlagNode");
      nodeWrap.innerHTML = renderTreeNode(node, currentPath);
      nodeWrap.querySelectorAll("[data-path]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const nextNode = getNodeAtPath(flag.decisionTree, btn.dataset.path);
          breadcrumb.push(`${btn.textContent}`);
          currentPath = btn.dataset.path;
          render();
        })
      );
      const restart = container.querySelector("#rcFlagRestart");
      if (restart)
        restart.addEventListener("click", () => {
          currentPath = "root";
          breadcrumb.length = 0;
          render();
        });
    }

    render();
  }

  function mount(root, flags) {
    root.innerHTML = `
      <div class="glossary-controls">
        <div class="search-box">
          <input type="search" id="rcFlagSearch" placeholder="Search red flags..." aria-label="Search red flags" />
          <button class="clear-btn" id="rcFlagClear" aria-label="Clear search">&times;</button>
        </div>
      </div>
      <div class="category-filters" id="rcFlagFilters">
        <button class="filter-chip active" data-sev="all">All (${flags.length})</button>
        <button class="filter-chip" data-sev="red">Urgent</button>
        <button class="filter-chip" data-sev="yellow">Important</button>
        <button class="filter-chip" data-sev="blue">Preventive</button>
      </div>
      <div class="scenario-list" id="rcFlagList"></div>
    `;

    const searchInput = qs("rcFlagSearch");
    const filters = qs("rcFlagFilters");
    const list = qs("rcFlagList");
    let state = { query: "", severity: "all" };

    function render() {
      const filtered = flags.filter(
        (f) =>
          (state.severity === "all" || f.severity === state.severity) &&
          (!state.query || f.title.toLowerCase().includes(state.query.toLowerCase()) || f.scenario.toLowerCase().includes(state.query.toLowerCase()))
      );
      list.innerHTML = filtered.length
        ? filtered
            .map(
              (f) => `
          <div class="scenario-item" data-open="false" id="flag-${escHtml(f.id)}">
            <button class="scenario-item-btn" aria-expanded="false">
              <span><span class="rc-severity-dot rc-sev-${escHtml(f.severity)}"></span> ${escHtml(f.title)}</span>
              <span class="chevron" aria-hidden="true">›</span>
            </button>
            <div class="scenario-body">
              <p>${escHtml(f.scenario)}</p>
              <div class="rc-flag-detail" data-flag="${escHtml(f.id)}"></div>
            </div>
          </div>
        `
            )
            .join("")
        : `<p class="no-results">No red flags match your filters.</p>`;

      filters.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.sev === state.severity));

      list.querySelectorAll(".scenario-item").forEach((item) => {
        const btn = item.querySelector(".scenario-item-btn");
        btn.addEventListener("click", () => {
          const isOpen = item.dataset.open === "true";
          item.dataset.open = String(!isOpen);
          btn.setAttribute("aria-expanded", String(!isOpen));
          if (!isOpen) {
            const flagId = item.querySelector(".rc-flag-detail").dataset.flag;
            rcMarkViewed(RC_KEYS.viewedFlags, flagId);
            const flag = flags.find((f) => f.id === flagId);
            mountDetail(item.querySelector(".rc-flag-detail"), flag);
          }
        });
      });
    }

    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
    qs("rcFlagClear").addEventListener("click", () => {
      state.query = "";
      searchInput.value = "";
      render();
    });
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      state.severity = btn.dataset.sev;
      render();
    });

    render();
  }

  function viewedCount() {
    return rcGetSet(RC_KEYS.viewedFlags).size;
  }

  return { mount, viewedCount };
})();

/* ---------------------------------------------------------------------- */
/* Case Studies                                                           */
/* ---------------------------------------------------------------------- */
const CaseStudies = (function () {
  function mount(root, studies) {
    root.innerHTML = `<div class="scenario-list" id="rcCaseList"></div>`;
    const list = qs("rcCaseList");

    list.innerHTML = studies
      .map(
        (c) => `
      <div class="scenario-item" data-open="false" id="case-${escHtml(c.id)}">
        <button class="scenario-item-btn" aria-expanded="false">
          <span>${escHtml(c.title)}</span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>
        <div class="scenario-body">
          <p style="color:var(--color-text-muted);font-size:0.85rem;">${escHtml(c.industry)} &middot; ${escHtml(c.projectSize)}</p>
          <p>${escHtml(c.problem)}</p>
          <p><strong>Cost: ${escHtml(c.cost)}</strong></p>
          <h5>What Went Wrong</h5>
          <ul>${c.whatWentWrong.map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>
          <h5>What Should Have Happened</h5>
          <ul>${c.whatShouldHappenInstead.map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>
          <h5>Tacit Knowledge Extracted</h5>
          <ul>${c.tacitKnowledge.map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>
          <h5>Your Framework</h5>
          <ul>${Object.values(c.yourFramework).map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>
        </div>
      </div>
    `
      )
      .join("");

    list.querySelectorAll(".scenario-item").forEach((item) => {
      const btn = item.querySelector(".scenario-item-btn");
      btn.addEventListener("click", () => {
        const isOpen = item.dataset.open === "true";
        item.dataset.open = String(!isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
        if (!isOpen) rcMarkViewed(RC_KEYS.viewedCases, item.id.replace("case-", ""));
      });
    });
  }

  function viewedCount() {
    return rcGetSet(RC_KEYS.viewedCases).size;
  }

  return { mount, viewedCount };
})();

/* ---------------------------------------------------------------------- */
/* Expert Q&A                                                             */
/* ---------------------------------------------------------------------- */
const ExpertQA = (function () {
  function mount(root, qas) {
    root.innerHTML = `<div class="iq-list" id="rcQaList"></div>`;
    qs("rcQaList").innerHTML = qas
      .map(
        (q) => `
      <div class="iq-card" data-open="false" id="qa-${escHtml(q.id)}">
        <span class="iq-cat">${q.expertAnswers.length} expert answer${q.expertAnswers.length === 1 ? "" : "s"}</span>
        <h4>${escHtml(q.question)}</h4>
        <button class="iq-toggle" aria-expanded="false">Show answers</button>
        <div class="iq-detail">
          <dt>Expert Answers</dt>
          <dd>
            ${q.expertAnswers
              .map(
                (a) => `<div class="rc-expert-answer"><strong>${escHtml(a.expert)}</strong> <span style="color:var(--color-text-muted);">(${escHtml(a.source)})</span><p class="mb-0">${escHtml(a.answer)}</p></div>`
              )
              .join("")}
          </dd>
          <dt>Your Framework</dt>
          <dd><ul>${Object.values(q.yourFramework).map((r) => `<li>${escHtml(r)}</li>`).join("")}</ul></dd>
          ${
            q.realExample
              ? `<dt>Real Example</dt><dd>
                <strong>Situation:</strong> ${escHtml(q.realExample.situation)}<br/>
                <strong>Your action:</strong> ${escHtml(q.realExample.yourAction)}<br/>
                <strong>Super's decision:</strong> ${escHtml(q.realExample.superDecision)}<br/>
                <strong>You execute:</strong> ${escHtml(q.realExample.yourExecute)}
              </dd>`
              : ""
          }
        </div>
      </div>
    `
      )
      .join("");

    qs("rcQaList")
      .querySelectorAll(".iq-card")
      .forEach((card) => {
        const btn = card.querySelector(".iq-toggle");
        btn.addEventListener("click", () => {
          const isOpen = card.dataset.open === "true";
          card.dataset.open = String(!isOpen);
          btn.setAttribute("aria-expanded", String(!isOpen));
          btn.textContent = !isOpen ? "Hide answers" : "Show answers";
        });
      });
  }

  return { mount };
})();

/* ---------------------------------------------------------------------- */
/* Progress Dashboard                                                     */
/* ---------------------------------------------------------------------- */
const RCDashboard = (function () {
  function mount(root, counts) {
    const videoPct = counts.videoTotal ? Math.round((VideoLibrary.viewedCount() / counts.videoTotal) * 100) : 0;
    const flagPct = counts.flagTotal ? Math.round((RedFlagsLibrary.viewedCount() / counts.flagTotal) * 100) : 0;
    const casePct = counts.caseTotal ? Math.round((CaseStudies.viewedCount() / counts.caseTotal) * 100) : 0;
    const habitPct = HabitTracker.weeklyScorePct();
    const overall = Math.round((videoPct + flagPct + casePct + habitPct) / 4);

    root.innerHTML = `
      <div class="culture-grid">
        <div class="culture-stat"><div class="stat-num">${VideoLibrary.viewedCount()}/${counts.videoTotal}</div><div class="stat-label">Videos Watched</div></div>
        <div class="culture-stat"><div class="stat-num">${habitPct}%</div><div class="stat-label">Habits This Week</div></div>
        <div class="culture-stat"><div class="stat-num">${RedFlagsLibrary.viewedCount()}/${counts.flagTotal}</div><div class="stat-label">Red Flags Studied</div></div>
        <div class="culture-stat"><div class="stat-num">${CaseStudies.viewedCount()}/${counts.caseTotal}</div><div class="stat-label">Case Studies Read</div></div>
      </div>
      <div class="home-progress mt-1" style="max-width:100%;">
        <div class="home-progress-track" style="background:var(--color-surface-alt);"><div class="home-progress-fill" style="width:${overall}%;"></div></div>
        <div class="home-progress-label" style="color:var(--color-text-muted);">Real Construction: ${overall}% complete</div>
      </div>
    `;
  }

  return { mount };
})();
