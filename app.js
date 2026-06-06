document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. STATE MANAGEMENT (LocalStorage)
  // ==========================================
  const State = {
    rawData: {},
    allCards: [],
    dueCardsQueue: [],
    currentCard: null,
    isFlipped: false,
    appState: {
      lastActiveCategory: "All",
    },

    loadAppState() {
      const saved = localStorage.getItem("vocab_srs_appState");
      if (saved) {
        try {
          this.appState = { ...this.appState, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse appState", e);
        }
      }
    },

    saveAppState() {
      localStorage.setItem("vocab_srs_appState", JSON.stringify(this.appState));
    },

    getCardProgress(key) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Error reading progress for", key);
        }
      }
      // Defaults as specified
      return {
        repetitions: 0,
        interval: 0,
        easiness: 2.5,
        nextReviewDate: Date.now(), // Due immediately
      };
    },

    saveCardProgress(key, progress) {
      localStorage.setItem(key, JSON.stringify(progress));
    },
  };

  // ==========================================
  // 2. UI RENDERING
  // ==========================================
  const UI = {
    views: {
      dashboard: document.getElementById("dashboard"),
      study: document.getElementById("studyContainer"),
      caughtUp: document.getElementById("caughtUpScreen"),
    },
    stats: {
      totalCards: document.getElementById("statTotalCards"),
      dueToday: document.getElementById("statDueToday"),
      learningQueue: document.getElementById("statLearningQueue"),
      mastered: document.getElementById("statMastered"),
      avgEasiness: document.getElementById("statAvgEasiness"),
    },
    inputs: {
      categorySelect: document.getElementById("categorySelect"),
    },
    card: {
      container: document.getElementById("flashcard"),
      frontWord: document.getElementById("cardWord"),
      backWord: document.getElementById("cardWordBack"),
      def: document.getElementById("cardDef"),
      syn: document.getElementById("cardSyn"),
      ex: document.getElementById("cardEx"),
      remaining: document.getElementById("cardsRemaining"),
      ratingBtns: document.getElementById("ratingButtons"),
    },

    showView(viewName) {
      Object.values(this.views).forEach((v) => {
        v.classList.add("hidden");
        v.classList.remove("flex");
      });
      this.views[viewName].classList.remove("hidden");
      this.views[viewName].classList.add("flex");
    },

    renderDashboard() {
      const selectedCat = this.inputs.categorySelect.value;
      const now = Date.now();

      let total = 0,
        due = 0,
        mastered = 0,
        sumEasiness = 0,
        countEasiness = 0;

      State.allCards.forEach((c) => {
        // Strict Category Filtering
        if (selectedCat !== "All" && c.category !== selectedCat) return;

        total++;
        if (c.progress.nextReviewDate <= now) due++;
        if (c.progress.interval > 14) mastered++; // Mastered definition

        sumEasiness += c.progress.easiness;
        countEasiness++;
      });

      const avgEasiness =
        countEasiness > 0 ? (sumEasiness / countEasiness).toFixed(2) : "2.50";

      this.stats.totalCards.textContent = total;
      this.stats.dueToday.textContent = due;
      this.stats.mastered.textContent = mastered;
      this.stats.avgEasiness.textContent = avgEasiness;

      // Learning Queue equals the length of the dueCardsQueue if a session is active,
      // otherwise it reflects the number of due cards.
      this.stats.learningQueue.textContent =
        State.dueCardsQueue.length > 0 ? State.dueCardsQueue.length : due;

      this.inputs.categorySelect.value = State.appState.lastActiveCategory;
    },

    renderCard() {
      const card = State.currentCard;
      this.card.frontWord.textContent = card.word;
      this.card.backWord.textContent = card.word;
      this.card.def.textContent = card.definition;
      this.card.syn.textContent = card.synonym;
      this.card.ex.textContent = card.example;

      this.card.remaining.textContent = `Queue: ${State.dueCardsQueue.length}`;

      this.card.container.classList.remove("is-flipped");
      this.card.ratingBtns.classList.add("opacity-0", "pointer-events-none");
      State.isFlipped = false;
    },

    flipCard() {
      if (!State.currentCard || State.isFlipped) return;
      State.isFlipped = true;
      this.card.container.classList.add("is-flipped");
      setTimeout(() => {
        this.card.ratingBtns.classList.remove(
          "opacity-0",
          "pointer-events-none",
        );
      }, 150);
    },

    renderCaughtUp() {
      const selectedCat = this.inputs.categorySelect.value;
      const catDisplay =
        selectedCat === "All"
          ? "All Categories"
          : `the category "${selectedCat}"`;
      document.getElementById("caughtUpMessage").textContent =
        `All caught up for ${catDisplay}!`;

      let nextReview = null;
      const now = Date.now();
      State.allCards.forEach((c) => {
        if (selectedCat !== "All" && c.category !== selectedCat) return;
        if (c.progress.nextReviewDate > now) {
          if (!nextReview || c.progress.nextReviewDate < nextReview) {
            nextReview = c.progress.nextReviewDate;
          }
        }
      });

      let nextStr = "";
      if (!nextReview) {
        nextStr = "Tomorrow";
      } else {
        const nr = new Date(nextReview);
        nextStr = nr.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }

      document.getElementById("nextReviewDateDisplay").textContent = nextStr;
    },
  };

  // ==========================================
  // 3. APPLICATION LOGIC
  // ==========================================
  const Logic = {
    async init() {
      State.loadAppState();
      await this.loadData();
      this.processRawData();
      this.populateCategoryDropdown();
      UI.renderDashboard();
      this.setupEventListeners();
    },

    async loadData() {
      let dataFetched = false;
      try {
        const response = await fetch("vocabulary.json");
        if (response.ok) {
          State.rawData = await response.json();
          dataFetched = true;
        }
      } catch (err) {
        console.warn(
          "Could not fetch vocabulary.json via fetch API. Using mock fallback data.",
          err,
        );
      }

      if (!dataFetched) {
        State.rawData = {
          "Category A": [
            {
              word: "Eloquent",
              synonym: "Fluent, articulate",
              definition: "Fluent or persuasive in speaking or writing.",
              example: "An eloquent speech.",
            },
          ],
        };
      }
    },

    processRawData() {
      State.allCards = [];
      for (const [category, words] of Object.entries(State.rawData)) {
        words.forEach((wordObj) => {
          // EXPLICIT KEY FORMAT REQUESTED BY USER
          const key = `vocab_srs_${category}_${wordObj.word}`;
          let progress = State.getCardProgress(key);
          State.allCards.push({ ...wordObj, category, key, progress });
        });
      }
    },

    populateCategoryDropdown() {
      const select = UI.inputs.categorySelect;
      select.innerHTML = '<option value="All">All Categories</option>';
      Object.keys(State.rawData).forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });

      if (
        Object.keys(State.rawData).includes(
          State.appState.lastActiveCategory,
        ) ||
        State.appState.lastActiveCategory === "All"
      ) {
        select.value = State.appState.lastActiveCategory;
      }
    },

    startStudy() {
      const selectedCat = UI.inputs.categorySelect.value;
      State.appState.lastActiveCategory = selectedCat;
      State.saveAppState();

      const now = Date.now();
      State.dueCardsQueue = State.allCards.filter((card) => {
        const isDue = card.progress.nextReviewDate <= now;
        const matchesCat =
          selectedCat === "All" || card.category === selectedCat;
        return isDue && matchesCat;
      });

      // Randomize session start
      State.dueCardsQueue.sort(() => Math.random() - 0.5);

      if (State.dueCardsQueue.length > 0) {
        UI.showView("study");
        this.loadNextCard();
        UI.renderDashboard(); // Update Learning Queue length
      } else {
        UI.renderCaughtUp();
        UI.showView("caughtUp");
      }
    },

    loadNextCard() {
      if (State.dueCardsQueue.length === 0) {
        UI.renderDashboard();
        UI.renderCaughtUp();
        UI.showView("caughtUp");
        return;
      }
      State.currentCard = State.dueCardsQueue[0];
      UI.renderCard();
    },

    handleRating(quality) {
      if (!State.isFlipped || !State.currentCard) return;

      let { repetitions, interval, easiness } = State.currentCard.progress;

      // SM-2 EXACT LOGIC
      if (quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.ceil(interval * easiness);
        }
        repetitions++;
      } else {
        repetitions = 0;
        interval = 1; // Resets for next calendar day review
      }

      // Calculate new Easiness Factor
      easiness =
        easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easiness < 1.3) easiness = 1.3;

      const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

      // Persist Update immediately
      State.currentCard.progress = {
        repetitions,
        interval,
        easiness,
        nextReviewDate,
      };
      State.saveCardProgress(State.currentCard.key, State.currentCard.progress);

      // SESSION QUEUE LOGIC:
      const answeredCard = State.dueCardsQueue.shift(); // Remove from front

      if (quality < 3) {
        // If user scored 0-2 (failed), they DO NOT know it.
        // It MUST be pushed to the back of the queue to reappear later in the session.
        State.dueCardsQueue.push(answeredCard);
      }

      // UI updates
      UI.card.ratingBtns.classList.add("opacity-0", "pointer-events-none");
      UI.card.container.classList.remove("is-flipped");
      State.isFlipped = false;

      setTimeout(() => {
        this.loadNextCard();
      }, 300);
    },

    resetSessionProgress() {
      const selectedCat = UI.inputs.categorySelect.value;
      const catDisplay =
        selectedCat === "All" ? "All Categories" : `"${selectedCat}"`;

      if (
        !confirm(
          `Are you sure you want to reset all spaced repetition progress for ${catDisplay}? This cannot be undone.`,
        )
      ) {
        return;
      }

      State.allCards.forEach((card) => {
        if (selectedCat === "All" || card.category === selectedCat) {
          localStorage.removeItem(card.key);
        }
      });

      // Reload and re-render
      this.processRawData();
      UI.renderDashboard();
    },

    setupEventListeners() {
      document.getElementById("startStudyBtn").addEventListener("click", () => {
        this.startStudy();
      });

      document
        .getElementById("deleteSessionBtn")
        .addEventListener("click", () => {
          this.resetSessionProgress();
        });

      UI.inputs.categorySelect.addEventListener("change", () => {
        State.appState.lastActiveCategory = UI.inputs.categorySelect.value;
        State.saveAppState();
        UI.renderDashboard();
      });

      const suspendSession = () => {
        State.dueCardsQueue = []; // Clear active queue
        UI.renderDashboard();
        UI.showView("dashboard");
      };
      document
        .getElementById("backToDashBtn")
        .addEventListener("click", suspendSession);
      document
        .getElementById("btnBackToDash")
        .addEventListener("click", suspendSession);

      document
        .getElementById("flashcard")
        .addEventListener("click", () => UI.flipCard());
      document
        .getElementById("showAnswerBtn")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          UI.flipCard();
        });

      document.querySelectorAll(".rate-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleRating(parseInt(btn.dataset.score));
        });
      });

      document.addEventListener("keydown", (e) => {
        if (!UI.views.study.classList.contains("flex")) return;

        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (!State.isFlipped) UI.flipCard();
        } else if (State.isFlipped) {
          const keyToScore = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
          if (keyToScore[e.key] !== undefined) {
            e.preventDefault();
            this.handleRating(keyToScore[e.key]);
          }
        }
      });
    },
  };

  Logic.init();
});
