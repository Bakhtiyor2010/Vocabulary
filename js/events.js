import { State } from "./state.js";
import { UI } from "./ui.js";
import { StudyLogic } from "./study.js";
import { QuizLogic } from "./quiz.js";
import { SearchLogic } from "./search.js";

export function setupEventListeners() {
  document.getElementById("startStudyBtn").addEventListener("click", () => {
    StudyLogic.startStudy();
  });

  document.getElementById("deleteSessionBtn").addEventListener("click", () => {
    StudyLogic.resetSessionProgress();
  });

  UI.inputs.categorySelect.addEventListener("change", () => {
    State.appState.lastActiveCategory = UI.inputs.categorySelect.value;
    State.saveAppState();
    UI.renderDashboard();
  });

  // Global Search Autocomplete
  UI.inputs.globalSearchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      UI.search.results.classList.add("hidden");
      UI.search.results.innerHTML = "";
      return;
    }

    const matches = State.allCards
      .filter((c) => c.word.toLowerCase().includes(query))
      .slice(0, 10);

    if (matches.length > 0) {
      UI.search.results.innerHTML = matches
        .map(
          (c) => `
            <div class="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors search-item" data-key="${c.key}">
              <div class="font-bold text-white">${c.word}</div>
              <div class="text-xs text-slate-400 line-clamp-1">${c.definition}</div>
            </div>
          `
        )
        .join("");
      UI.search.results.classList.remove("hidden");
    } else {
      UI.search.results.innerHTML = `<div class="px-4 py-3 text-slate-400 text-sm">No words found.</div>`;
      UI.search.results.classList.remove("hidden");
    }
  });

  // Hide search results on outside click
  document.addEventListener("click", (e) => {
    if (
      !UI.inputs.globalSearchInput.contains(e.target) &&
      !UI.search.results.contains(e.target)
    ) {
      UI.search.results.classList.add("hidden");
    }
  });

  // Search Item Click
  UI.search.results.addEventListener("click", (e) => {
    const item = e.target.closest(".search-item");
    if (item) {
      const key = item.getAttribute("data-key");
      const card = State.allCards.find((c) => c.key === key);
      if (card) {
        SearchLogic.openSearchModal(card);
        UI.inputs.globalSearchInput.value = "";
        UI.search.results.classList.add("hidden");
      }
    }
  });

  // Close Search Modal
  UI.search.closeModal.addEventListener("click", () => {
    UI.search.modal.classList.add("hidden");
    UI.search.modal.classList.remove("flex");
  });

  UI.search.modal.addEventListener("click", (e) => {
    if (e.target === UI.search.modal) {
      UI.search.modal.classList.add("hidden");
      UI.search.modal.classList.remove("flex");
    }
  });

  document.getElementById("startQuizBtn").addEventListener("click", () => {
    QuizLogic.startQuiz();
  });

  UI.quiz.closeModal.addEventListener("click", () => {
    QuizLogic.suspendQuiz();
  });

  UI.quiz.modal.addEventListener("click", (e) => {
    if (e.target === UI.quiz.modal) {
      QuizLogic.suspendQuiz();
    }
  });

  UI.quiz.suspendBtn.addEventListener("click", () => {
    QuizLogic.suspendQuiz();
  });

  UI.quiz.nextBtn.addEventListener("click", () => {
    QuizLogic.nextQuizQuestion();
  });

  const suspendSession = () => {
    State.dueCardsQueue = []; // Clear active queue
    UI.renderDashboard();
    UI.showView("dashboard");
  };

  document.getElementById("backToDashBtn").addEventListener("click", suspendSession);
  document.getElementById("btnBackToDash").addEventListener("click", suspendSession);

  document.getElementById("flashcard").addEventListener("click", () => UI.flipCard());
  document.getElementById("showAnswerBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    UI.flipCard();
  });

  document.querySelectorAll(".rate-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      StudyLogic.handleRating(parseInt(btn.dataset.score));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (!UI.views.study.classList.contains("flex")) return;

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!State.isFlipped) UI.flipCard();
    } else if (State.isFlipped) {
      const keyToScore = { 1: 4, 2: 2, 3: 1 }; // 1=Easy, 2=Medium, 3=Hard
      if (keyToScore[e.key] !== undefined) {
        e.preventDefault();
        StudyLogic.handleRating(keyToScore[e.key]);
      }
    }
  });
}
