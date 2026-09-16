/* ==========================================================================
   scenarios.js — Decision tree navigator, scenario problem-solver,
   and mock interview simulator.
   ========================================================================== */

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* ---------------------------------------------------------------------- */
/* Decision Tree Navigator                                                */
/* ---------------------------------------------------------------------- */
const DecisionTree = (function () {
  function mount(root, scenarios) {
    if (!scenarios || !scenarios.length) {
      root.innerHTML = `<p class="placeholder-note">No decision trees available yet.</p>`;
      return;
    }

    let currentScenario = scenarios[0];
    let currentNodeId = currentScenario.startNode;
    let path = [];

    root.innerHTML = `
      <div class="tree-select">
        <label for="${root.id}-select"><strong>Choose a scenario:</strong></label><br/>
        <select id="${root.id}-select">
          ${scenarios.map((s) => `<option value="${escHtml(s.id)}">${escHtml(s.title)}</option>`).join("")}
        </select>
      </div>
      <ul class="tree-path" id="${root.id}-path"></ul>
      <div id="${root.id}-node"></div>
    `;

    const select = root.querySelector(`#${root.id}-select`);
    const nodeWrap = root.querySelector(`#${root.id}-node`);
    const pathWrap = root.querySelector(`#${root.id}-path`);

    function restart(scenario) {
      currentScenario = scenario;
      currentNodeId = scenario.startNode;
      path = [];
      renderNode();
    }

    function renderPath() {
      pathWrap.innerHTML = path.map((p) => `<li>${escHtml(p)}</li>`).join("");
    }

    function renderNode() {
      renderPath();
      const node = currentScenario.nodes[currentNodeId];
      if (!node) {
        nodeWrap.innerHTML = `<p class="placeholder-note">End of tree.</p>`;
        return;
      }

      if (node.question) {
        nodeWrap.innerHTML = `
          <div class="tree-node">
            <p class="tree-question">${escHtml(node.question)}</p>
            <div class="tree-choices">
              <button class="btn" data-answer="yes">Yes</button>
              <button class="btn btn-secondary" data-answer="no">No</button>
            </div>
          </div>
        `;
        nodeWrap.querySelector('[data-answer="yes"]').addEventListener("click", () => {
          path.push(`${node.question} → Yes`);
          nodeWrap.innerHTML = `<div class="tree-node"><p class="tree-action">${escHtml(node.yes.action)}</p></div>`;
          renderPath();
          currentNodeId = node.yes.nextNode;
          if (currentNodeId) {
            const btn = document.createElement("button");
            btn.className = "btn mt-1";
            btn.textContent = "Continue →";
            btn.addEventListener("click", renderNode);
            nodeWrap.querySelector(".tree-node").appendChild(btn);
          } else {
            appendRestart();
          }
        });
        nodeWrap.querySelector('[data-answer="no"]').addEventListener("click", () => {
          path.push(`${node.question} → No`);
          nodeWrap.innerHTML = `<div class="tree-node"><p class="tree-action">${escHtml(node.no.action)}</p></div>`;
          renderPath();
          currentNodeId = node.no.nextNode;
          if (currentNodeId) {
            const btn = document.createElement("button");
            btn.className = "btn mt-1";
            btn.textContent = "Continue →";
            btn.addEventListener("click", renderNode);
            nodeWrap.querySelector(".tree-node").appendChild(btn);
          } else {
            appendRestart();
          }
        });
      } else {
        // Terminal / informational node with just an action
        nodeWrap.innerHTML = `<div class="tree-node"><p class="tree-action">${escHtml(node.action)}</p></div>`;
        if (node.nextNode) {
          const btn = document.createElement("button");
          btn.className = "btn mt-1";
          btn.textContent = "Continue →";
          btn.addEventListener("click", () => {
            currentNodeId = node.nextNode;
            renderNode();
          });
          nodeWrap.querySelector(".tree-node").appendChild(btn);
        } else {
          appendRestart();
        }
      }
    }

    function appendRestart() {
      const btn = document.createElement("button");
      btn.className = "btn btn-secondary mt-1";
      btn.textContent = "Restart Scenario";
      btn.addEventListener("click", () => restart(currentScenario));
      nodeWrap.querySelector(".tree-node").appendChild(btn);
    }

    select.addEventListener("change", () => {
      const scenario = scenarios.find((s) => s.id === select.value);
      restart(scenario);
    });

    restart(currentScenario);
  }

  return { mount };
})();

/* ---------------------------------------------------------------------- */
/* Common Scenarios — Problem Solver                                      */
/* ---------------------------------------------------------------------- */
const ScenarioSolver = (function () {
  function mount(root, scenarios) {
    if (!scenarios || !scenarios.length) {
      root.innerHTML = `<p class="placeholder-note">No scenarios available yet.</p>`;
      return;
    }

    root.innerHTML = `
      <div class="scenario-list">
        ${scenarios
          .map(
            (s) => `
          <div class="scenario-item" data-open="false" id="scenario-${escHtml(s.id)}">
            <button class="scenario-item-btn" aria-expanded="false">
              <span>${escHtml(s.title)}</span>
              <span class="chevron" aria-hidden="true">›</span>
            </button>
            <div class="scenario-body">
              <p>${escHtml(s.problem)}</p>
              <h5>What You Observe</h5>
              <ul>${s.symptoms.map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>
              <h5>Correct Actions</h5>
              <ul>${s.correctActions.map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>
              <h5>How to Document It</h5>
              <p>${escHtml(s.documentation)}</p>
              ${
                s.commonMistakes
                  ? `<h5>What NOT to Do</h5><ul>${s.commonMistakes.map((x) => `<li>${escHtml(x)}</li>`).join("")}</ul>`
                  : ""
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    root.querySelectorAll(".scenario-item").forEach((item) => {
      const btn = item.querySelector(".scenario-item-btn");
      btn.addEventListener("click", () => {
        const isOpen = item.dataset.open === "true";
        item.dataset.open = String(!isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
      });
    });
  }

  return { mount };
})();

/* ---------------------------------------------------------------------- */
/* Mock Interview Simulator                                               */
/* ---------------------------------------------------------------------- */
const MockInterview = (function () {
  function mount(root, mockData, allQuestions) {
    if (!mockData || !mockData.flows || !mockData.flows.length) {
      root.innerHTML = `<p class="placeholder-note">No mock interview flows available yet.</p>`;
      return;
    }

    const questionById = {};
    allQuestions.forEach((q) => (questionById[q.id] = q));

    let session = null; // { flow, questions, index, results: [] }

    root.innerHTML = `
      <div class="mock-flow-select" id="${root.id}-flows"></div>
      <div class="mock-session" id="${root.id}-session"></div>
    `;

    const flowWrap = root.querySelector(`#${root.id}-flows`);
    const sessionWrap = root.querySelector(`#${root.id}-session`);

    function renderFlows() {
      flowWrap.innerHTML = mockData.flows
        .map(
          (f) => `
        <button class="mock-flow-card" data-flow="${escHtml(f.id)}">
          <h4>${escHtml(f.title)}</h4>
          <p>${escHtml(f.description)}</p>
          <span class="duration">${escHtml(f.durationMinutes)} min • ${f.questionIds.length} questions</span>
        </button>
      `
        )
        .join("");

      flowWrap.querySelectorAll(".mock-flow-card").forEach((card) => {
        card.addEventListener("click", () => {
          const flow = mockData.flows.find((f) => f.id === card.dataset.flow);
          startSession(flow);
        });
      });
    }

    function startSession(flow) {
      const questions = flow.questionIds.map((id) => questionById[id]).filter(Boolean);
      session = { flow, questions, index: 0, results: [] };
      sessionWrap.classList.add("active");
      renderQuestion();
      sessionWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function renderQuestion() {
      const q = session.questions[session.index];
      sessionWrap.innerHTML = `
        <p class="mock-progress">${escHtml(session.flow.title)} — Question ${session.index + 1} of ${session.questions.length}</p>
        <p class="mock-question">${escHtml(q.question)}</p>
        <textarea id="${root.id}-answer" placeholder="Type your answer here (or say it out loud, then jot notes)..." aria-label="Your answer"></textarea>
        <div class="mock-controls">
          <button class="btn" id="${root.id}-reveal">Show Model Answer &amp; Feedback</button>
          <button class="btn btn-secondary" id="${root.id}-quit">End Session</button>
        </div>
        <div class="mock-feedback" id="${root.id}-feedback"></div>
      `;

      root.querySelector(`#${root.id}-reveal`).addEventListener("click", () => {
        const feedback = root.querySelector(`#${root.id}-feedback`);
        const answer = root.querySelector(`#${root.id}-answer`).value.trim();
        const wordCount = answer ? answer.split(/\s+/).length : 0;
        let lengthNote = "";
        if (wordCount === 0) lengthNote = "You haven't written anything yet — try answering before revealing feedback.";
        else if (wordCount < 15) lengthNote = "Your answer looks brief for this question — construction interviewers usually want more specificity.";
        else if (wordCount > 350) lengthNote = "Your answer is quite long — practice tightening it toward the suggested time limit.";
        else lengthNote = "Your answer length looks reasonable for this question.";

        feedback.classList.add("show");
        feedback.innerHTML = `
          <p><strong>Why they're asking:</strong> ${escHtml(q.whyAsking || "—")}</p>
          ${q.sampleAnswer ? `<p><strong>Sample answer:</strong> ${escHtml(q.sampleAnswer)}</p>` : ""}
          ${q.redFlags ? `<p><strong>Red flags to avoid:</strong> ${escHtml(q.redFlags)}</p>` : ""}
          <p><strong>Self-check:</strong> ${escHtml(lengthNote)}</p>
          <div class="mock-controls">
            <button class="btn btn-sm" data-rate="good">I answered this well</button>
            <button class="btn btn-secondary btn-sm" data-rate="practice">Needs more practice</button>
          </div>
        `;

        feedback.querySelectorAll("[data-rate]").forEach((btn) => {
          btn.addEventListener("click", () => {
            session.results.push({ questionId: q.id, rating: btn.dataset.rate });
            advance();
          });
        });
      });

      root.querySelector(`#${root.id}-quit`).addEventListener("click", () => {
        sessionWrap.classList.remove("active");
        sessionWrap.innerHTML = "";
        session = null;
      });
    }

    function advance() {
      session.index += 1;
      if (session.index >= session.questions.length) {
        renderScore();
      } else {
        renderQuestion();
      }
    }

    function renderScore() {
      const good = session.results.filter((r) => r.rating === "good").length;
      const total = session.results.length;
      const pct = total ? Math.round((good / total) * 100) : 0;
      sessionWrap.innerHTML = `
        <div class="mock-score">
          <div class="score-num">${pct}%</div>
          <p>You rated ${good} of ${total} answers as strong in "${escHtml(session.flow.title)}."</p>
          <div class="mock-controls" style="justify-content:center;">
            <button class="btn" id="${root.id}-retry">Retry This Flow</button>
            <button class="btn btn-secondary" id="${root.id}-newflow">Choose Another Flow</button>
          </div>
        </div>
      `;
      root.querySelector(`#${root.id}-retry`).addEventListener("click", () => startSession(session.flow));
      root.querySelector(`#${root.id}-newflow`).addEventListener("click", () => {
        sessionWrap.classList.remove("active");
        sessionWrap.innerHTML = "";
        session = null;
      });
    }

    renderFlows();
  }

  return { mount };
})();
