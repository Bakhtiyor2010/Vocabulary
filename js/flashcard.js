// ── Fetch group data from vocabulary.json, then run original logic ──
(async function () {
  const params = new URLSearchParams(window.location.search);
  const groupName = params.get("group");

  if (!groupName) {
    document.getElementById("app").innerHTML =
      '<p style="color:var(--muted);text-align:center">No group specified.<br>Use ?group=IELTS1</p>';
    return;
  }

  const res = await fetch("./vocabulary.json");
  const all = await res.json();

  if (!all[groupName]) {
    document.getElementById("app").innerHTML =
      `<p style="color:var(--muted);text-align:center">Group "${groupName}" not found.</p>`;
    return;
  }

  const data = all[groupName];

  // ── Everything below is your original code, unchanged ──

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let cards = shuffle(data);
  let index = 0;
  let found = [];
  let notFound = [];
  let flipped = false;

  const app = document.getElementById("app");

  let globalCardHeight = 160;
  (function measureAllCards() {
    const isMobile = window.innerWidth <= 768;
    const probeWidth = isMobile ? window.innerWidth - 40 : 480;
    const minHeight = isMobile ? 220 : 160;
    globalCardHeight = minHeight;

    const probe = document.createElement("div");
    probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;top:-9999px;left:0;width:${probeWidth}px;`;
    document.body.appendChild(probe);
    data.forEach((item) => {
      probe.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px;padding:28px 32px;font-family:DM Sans,sans-serif;">
                <span style="font-size:11px;">Synonym</span>
                <span style="font-size:14px;line-height:1.55;">${item.synonym}</span>
                <span style="font-size:11px;">Definition</span>
                <span style="font-size:14px;line-height:1.55;">${item.definition}</span>
                <span style="font-size:11px;">Example</span>
                <span style="font-size:14px;line-height:1.55;">${item.example}</span>
            </div>
        `;
      globalCardHeight = Math.max(
        globalCardHeight,
        probe.firstElementChild.scrollHeight,
      );
    });
    document.body.removeChild(probe);
  })();

  function renderQuiz() {
    const item = cards[index];
    const total = cards.length;
    const done = index;
    const pct = (done / total) * 100;

    app.innerHTML = `
                    <div class="header">
                        <h1>Flashcard Trainer</h1>
                    </div>

                    <div class="progress-wrap">
                        <div class="progress-meta">
                            <span>${done} of ${total} reviewed</span>
                            <span>${total - done} remaining</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>

                    <div class="score-row">
                        <div class="score-pill green">
                            <span class="score-dot"></span>
                            <span>${found.length} known</span>
                        </div>
                        <div class="score-pill red">
                            <span class="score-dot"></span>
                            <span>${notFound.length} learning</span>
                        </div>
                    </div>

                    <div class="card-stage" id="card" tabindex="0" role="button" aria-label="Tap to reveal synonym">
                        <div class="card-inner" id="card-inner">
                            <div class="card-face card-front">
                                <div class="header-label">Vocabulary</div>
                                <div class="word">${item.word}</div>
                                <div class="hint">tap to reveal</div>
                            </div>
                            <div class="card-face card-back">
                                <div class="label">Synonym</div>
                                <div class="body-text">${item.synonym}</div>
                                <div class="label">Definition</div>
                                <div class="body-text">${item.definition}</div>
                                <div class="label">Example</div>
                                <div class="body-text">${item.example}</div>
                            </div>
                        </div>
                    </div>

                    <div class="flip-hint" id="flip-hint">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        click card to flip
                    </div>

                    <div class="actions">
                        <button class="btn btn-no" onclick="mark(false)">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                            Still learning
                        </button>
                        <button class="btn btn-yes" onclick="mark(true)">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                            Got it
                        </button>
                    </div>
                `;

    const card = document.getElementById("card");
    const hint = document.getElementById("flip-hint");
    const inner = document.getElementById("card-inner");
    flipped = false;

    const front = card.querySelector(".card-front");
    const back = card.querySelector(".card-back");
    front.style.height = globalCardHeight + "px";
    back.style.height = globalCardHeight + "px";
    inner.style.height = globalCardHeight + "px";

    card.onclick = () => {
      flipped = !flipped;
      card.classList.toggle("flipped", flipped);
      hint.classList.toggle("hidden", flipped);
    };

    card.onkeydown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        card.click();
      }
      if (e.key === "ArrowRight") mark(true);
      if (e.key === "ArrowLeft") mark(false);
    };
  }

  window.mark = function (known) {
    const current = cards[index];
    if (known) found.push(current);
    else notFound.push(current);
    index++;
    if (index >= cards.length) renderResults();
    else renderQuiz();
  };

  function renderResults() {
    const total = cards.length;
    const score = Math.round((found.length / total) * 100);
    const hasMissed = notFound.length > 0;

    app.innerHTML = `
                    <div class="results">
                        <div class="results-title">Session complete</div>
                        <div class="results-sub">You scored ${score}% — ${found.length} of ${total} words known</div>

                        <div class="results-grid">
                            <div class="result-card known">
                                <div class="result-card-label">Known</div>
                                <div class="result-card-count">${found.length}</div>
                                <ul class="result-word-list">
                                    ${found.map((w) => `<li>${w.word}</li>`).join("")}
                                </ul>
                            </div>
                            <div class="result-card unknown">
                                <div class="result-card-label">Learning</div>
                                <div class="result-card-count">${notFound.length}</div>
                                <ul class="result-word-list">
                                    ${notFound.map((w) => `<li>${w.word}</li>`).join("")}
                                </ul>
                            </div>
                        </div>

                        <div class="results-actions">
                            ${
                              hasMissed
                                ? `
                            <button class="btn-practice-missed" onclick="practiceMissed()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                                Practice missed words (${notFound.length})
                            </button>`
                                : ""
                            }
                            <button class="btn-restart" onclick="restart()">↺ Restart all cards</button>
                        </div>
                    </div>
                `;
  }

  window.practiceMissed = function () {
    cards = shuffle(notFound);
    index = 0;
    found = [];
    notFound = [];
    renderQuiz();
  };

  window.restart = function () {
    cards = shuffle(data);
    index = 0;
    found = [];
    notFound = [];
    renderQuiz();
  };

  renderQuiz();
})();
