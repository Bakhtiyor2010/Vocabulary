import { State, QuizState } from "./state.js";

export const UI = {
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
    globalSearchInput: document.getElementById("globalSearchInput"),
  },
  search: {
    results: document.getElementById("searchResults"),
    modal: document.getElementById("searchModal"),
    closeModal: document.getElementById("closeSearchModal"),
    modalWord: document.getElementById("modalWord"),
    modalDef: document.getElementById("modalDef"),
    modalSyn: document.getElementById("modalSyn"),
    modalEx: document.getElementById("modalEx"),
    modalCat: document.getElementById("modalCat"),
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
  quiz: {
    modal: document.getElementById("quizModal"),
    closeModal: document.getElementById("closeQuizModal"),
    title: document.getElementById("quizTitle"),
    progressBar: document.getElementById("quizProgressBar"),
    progressText: document.getElementById("quizProgressText"),
    scoreText: document.getElementById("quizScoreText"),
    word: document.getElementById("quizWord"),
    optionsContainer: document.getElementById("quizOptions"),
    suspendBtn: document.getElementById("suspendQuizBtn"),
    nextBtn: document.getElementById("nextQuizBtn"),
    footer: document.getElementById("quizFooter"),
  },
  quizDetails: {
    modal: document.getElementById("quizDetailsModal"),
    closeModal: document.getElementById("closeQuizDetailsModal"),
    closeBtn: document.getElementById("closeDetailsBtn"),
    title: document.getElementById("quizDetailsTitle"),
    date: document.getElementById("quizDetailsDate"),
    score: document.getElementById("quizDetailsScore"),
    correctCount: document.getElementById("correctCount"),
    correctList: document.getElementById("correctList"),
    incorrectCount: document.getElementById("incorrectCount"),
    incorrectList: document.getElementById("incorrectList"),
    practiceBtn: document.getElementById("practiceFromHistoryBtn"),
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

    // Scale Easiness to percentage: Map [1.3, 2.5] to [0%, 100%]
    let avgEasinessPercent = 100;
    if (countEasiness > 0) {
      const avgEasinessVal = sumEasiness / countEasiness;
      if (avgEasinessVal <= 1.3) {
        avgEasinessPercent = 0;
      } else if (avgEasinessVal >= 2.5) {
        avgEasinessPercent = 100;
      } else {
        avgEasinessPercent = Math.round(((avgEasinessVal - 1.3) / 1.2) * 100);
      }
    }

    this.stats.totalCards.textContent = total;
    this.stats.mastered.textContent = mastered;
    this.stats.avgEasiness.textContent = `${avgEasinessPercent}%`;

    // Check if there is a suspended session for this category
    const suspended = State.getSuspendedSession(selectedCat);
    if (suspended && suspended.queueKeys && suspended.queueKeys.length > 0) {
      const leftCount = suspended.queueKeys.length;
      this.stats.dueToday.textContent = leftCount;
      this.stats.learningQueue.textContent = leftCount;
    } else {
      this.stats.dueToday.textContent = due;
      this.stats.learningQueue.textContent = due;
    }

    this.inputs.categorySelect.value = State.appState.lastActiveCategory;

    this.renderQuizResults();
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
        "pointer-events-none"
      );
    }, 150);
  },

  renderCaughtUp() {
    const selectedCat = this.inputs.categorySelect.value;
    const catDisplay =
      selectedCat === "All"
        ? "All Sets"
        : `the set "${selectedCat}"`;
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

  renderQuizResults() {
    const container = document.getElementById("quizResultsContainer");
    const section = document.getElementById("quizResultsSection");
    if (!container || !section) return;

    const results = State.getQuizHistory();

    if (results.length === 0) {
      section.classList.add("hidden");
      section.classList.remove("flex");
      return;
    }

    section.classList.remove("hidden");
    section.classList.add("flex");

    container.innerHTML = results.map(res => {
      const dateStr = new Date(res.date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
      let scoreColor = "text-rose-400";
      if (res.percentage >= 80) scoreColor = "text-emerald-400";
      else if (res.percentage >= 50) scoreColor = "text-amber-400";

      return `
        <div class="quiz-history-item bg-slate-800/60 border border-slate-700 hover:border-slate-500 cursor-pointer p-4 rounded-xl flex flex-col gap-2 transition-all" data-id="${res.id}">
          <div class="flex justify-between items-start gap-4">
            <span class="font-bold text-white text-sm sm:text-base break-words" title="${res.category}">${res.category === "All" ? "All Sets" : res.category}</span>
            <span class="text-xs text-slate-400 font-medium shrink-0">${dateStr}</span>
          </div>
          <div class="flex items-baseline justify-between mt-1">
            <span class="text-xs text-slate-400">Score: <span class="font-bold text-slate-200">${res.score}/${res.total}</span></span>
            <span class="text-lg font-bold ${scoreColor}">${res.percentage}%</span>
          </div>
          <div class="w-full bg-slate-700 h-1.5 rounded-full mt-1">
            <div class="h-1.5 rounded-full ${res.percentage >= 80 ? 'bg-emerald-500' : res.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${res.percentage}%"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  openQuizDetailsModal(attemptId) {
    const results = State.getQuizHistory();
    const attempt = results.find(r => r.id === attemptId);
    if (!attempt) return;

    this.quizDetails.title.textContent = attempt.category === "All" ? "Quiz Results: All Sets" : `Quiz Results: ${attempt.category}`;
    this.quizDetails.date.textContent = new Date(attempt.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    this.quizDetails.score.textContent = `Score: ${attempt.score}/${attempt.total} (${attempt.percentage}%)`;

    this.quizDetails.correctCount.textContent = attempt.correctWords?.length || 0;
    this.quizDetails.incorrectCount.textContent = attempt.incorrectWords?.length || 0;

    const renderWordList = (words) => {
      if (!words || words.length === 0) return `<div class="text-slate-400 text-sm">None</div>`;
      return words.map(w => `
        <div class="bg-slate-900/50 p-2 rounded-lg mb-2">
          <span class="font-bold text-slate-200 block text-sm">${w.word}</span>
          <span class="text-slate-400 text-xs">${w.definition}</span>
        </div>
      `).join("");
    };

    this.quizDetails.correctList.innerHTML = renderWordList(attempt.correctWords);
    this.quizDetails.incorrectList.innerHTML = renderWordList(attempt.incorrectWords);

    if (attempt.incorrectWords && attempt.incorrectWords.length > 0) {
      this.quizDetails.practiceBtn.classList.remove("hidden");
      this.quizDetails.practiceBtn.dataset.attemptId = attemptId;
    } else {
      this.quizDetails.practiceBtn.classList.add("hidden");
    }

    this.quizDetails.modal.classList.remove("hidden");
    this.quizDetails.modal.classList.add("flex");
  },

  closeQuizDetailsModal() {
    this.quizDetails.modal.classList.add("hidden");
    this.quizDetails.modal.classList.remove("flex");
  }
};
