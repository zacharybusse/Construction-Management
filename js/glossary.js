/* ==========================================================================
   glossary.js — Searchable / filterable glossary component
   Renders into any container; reusable for the Week 1 embedded glossary
   and the full Resources > Glossary page.
   ========================================================================== */

const Glossary = (function () {
  const CATEGORY_LABELS = {
    structural: "Structural",
    mep: "MEP",
    scheduling: "Scheduling",
    quality: "Quality",
    documentation: "Documentation",
  };

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function matchesSearch(term, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      term.term.toLowerCase().includes(q) ||
      term.definition.toLowerCase().includes(q) ||
      (term.armyAnalog && term.armyAnalog.toLowerCase().includes(q)) ||
      (term.whyItMatters && term.whyItMatters.toLowerCase().includes(q))
    );
  }

  function termCardHtml(term) {
    return `
      <article class="term-card" id="term-${escapeHtml(term.id)}">
        <span class="term-category">${escapeHtml(CATEGORY_LABELS[term.category] || term.category)}</span>
        <h4 class="term-name">${escapeHtml(term.term)}</h4>
        <dl class="mb-0">
          <dt>Definition</dt>
          <dd>${escapeHtml(term.definition)}</dd>
          ${term.whyItMatters ? `<dt>Why It Matters</dt><dd>${escapeHtml(term.whyItMatters)}</dd>` : ""}
          ${term.armyAnalog ? `<dt>Army Analog</dt><dd>${escapeHtml(term.armyAnalog)}</dd>` : ""}
        </dl>
      </article>
    `;
  }

  /**
   * Mount a glossary widget.
   * @param {HTMLElement} root - container element
   * @param {Array} terms - array of term objects
   * @param {Object} opts - { defaultCategory, storageKey }
   */
  function mount(root, terms, opts = {}) {
    const storageKey = opts.storageKey || "fe-glossary";
    let state = {
      query: "",
      category: opts.defaultCategory || "all",
    };

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey + "-category"));
      if (saved) state.category = saved;
    } catch (e) {
      /* ignore */
    }

    const categories = Object.keys(CATEGORY_LABELS).filter((c) =>
      terms.some((t) => t.category === c)
    );

    root.innerHTML = `
      <div class="glossary-controls">
        <div class="search-box">
          <input type="search" placeholder="Search terms, definitions, Army analogs..." aria-label="Search glossary" id="${root.id}-search" />
          <button class="clear-btn" id="${root.id}-clear" aria-label="Clear search" title="Clear search">&times;</button>
        </div>
        <button class="btn btn-secondary btn-sm" id="${root.id}-print">Download / Print Glossary</button>
      </div>
      <div class="category-filters" id="${root.id}-filters" role="tablist" aria-label="Filter by category">
        <button class="filter-chip" data-cat="all">All (${terms.length})</button>
        ${categories
          .map((c) => {
            const count = terms.filter((t) => t.category === c).length;
            return `<button class="filter-chip" data-cat="${c}">${CATEGORY_LABELS[c]} (${count})</button>`;
          })
          .join("")}
      </div>
      <p class="result-count" id="${root.id}-count"></p>
      <div class="glossary-grid" id="${root.id}-grid"></div>
    `;

    const searchInput = root.querySelector(`#${root.id}-search`);
    const clearBtn = root.querySelector(`#${root.id}-clear`);
    const printBtn = root.querySelector(`#${root.id}-print`);
    const filterWrap = root.querySelector(`#${root.id}-filters`);
    const grid = root.querySelector(`#${root.id}-grid`);
    const countEl = root.querySelector(`#${root.id}-count`);

    function renderList() {
      const filtered = terms.filter(
        (t) =>
          (state.category === "all" || t.category === state.category) &&
          matchesSearch(t, state.query)
      );
      countEl.textContent = `${filtered.length} term${filtered.length === 1 ? "" : "s"} found`;
      grid.innerHTML = filtered.length
        ? filtered.map(termCardHtml).join("")
        : `<p class="no-results">No terms match "${escapeHtml(state.query)}". Try a different search or category.</p>`;

      filterWrap.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.cat === state.category);
      });
    }

    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      renderList();
    });

    clearBtn.addEventListener("click", () => {
      state.query = "";
      searchInput.value = "";
      searchInput.focus();
      renderList();
    });

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      state.category = btn.dataset.cat;
      try {
        localStorage.setItem(storageKey + "-category", JSON.stringify(state.category));
      } catch (err) {
        /* ignore */
      }
      renderList();
    });

    printBtn.addEventListener("click", () => {
      const prevCategory = state.category;
      const prevQuery = state.query;
      state.category = "all";
      state.query = "";
      searchInput.value = "";
      renderList();
      window.setTimeout(() => {
        window.print();
        state.category = prevCategory;
        state.query = prevQuery;
        searchInput.value = prevQuery;
        renderList();
      }, 50);
    });

    renderList();
  }

  return { mount };
})();
