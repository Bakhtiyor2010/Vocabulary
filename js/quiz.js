import { State, QuizState } from "./state.js";
import { UI } from "./ui.js";

export const QuizLogic = {
  generateOptions(card) {
    const correctDef = card.definition;
    // 1. Candidate pool: all words from other sets
    let candidatePool = State.allCards.filter(c => c.category !== card.category);

    // Fallback if candidate pool is too small (e.g. only one set)
    if (candidatePool.length < 3) {
      candidatePool = State.allCards.filter(c => c.word !== card.word);
    }

    // 2. Check "To" prefix grammar rule (case-insensitive "to " or "To ")
    const correctIsTo = /^[Tt]o\b/.test(correctDef.trim());
    let distractorPool = candidatePool;

    if (correctIsTo) {
      const toCandidates = candidatePool.filter(c => /^[Tt]o\b/.test(c.definition.trim()));
      if (toCandidates.length >= 3) {
        distractorPool = toCandidates;
      }
    }

    // 3. Shuffle distractor pool and pick 3 distinct definitions
    const shuffledDistractors = [...distractorPool];
    for (let i = shuffledDistractors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDistractors[i], shuffledDistractors[j]] = [shuffledDistractors[j], shuffledDistractors[i]];
    }

    const distractorDefs = [];
    for (const c of shuffledDistractors) {
      if (c.definition !== correctDef && !distractorDefs.includes(c.definition)) {
        distractorDefs.push(c.definition);
        if (distractorDefs.length === 3) break;
      }
    }

    // Fallback if we couldn't find 3 distinct distractors from filtered pool
    if (distractorDefs.length < 3) {
      const backupDistractors = [...candidatePool];
      for (let i = backupDistractors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [backupDistractors[i], backupDistractors[j]] = [backupDistractors[j], backupDistractors[i]];
      }
      for (const c of backupDistractors) {
        if (c.definition !== correctDef && !distractorDefs.includes(c.definition)) {
          distractorDefs.push(c.definition);
          if (distractorDefs.length === 3) break;
        }
      }
    }

    // 4. Assemble and randomize options
    const options = [correctDef, ...distractorDefs];
    // Shuffling options
    const shuffledOptions = options.map((opt, index) => ({ opt, originalIndex: index }));
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    const finalOptions = shuffledOptions.map(item => item.opt);
    const correctOptionIndex = shuffledOptions.findIndex(item => item.originalIndex === 0);

    return {
      options: finalOptions,
      correctOptionIndex
    };
  },

  startQuiz() {
    const selectedSet = UI.inputs.categorySelect.value;
    const storageKey = `vocab_srs_quizState_${selectedSet}`;
    const savedState = localStorage.getItem(storageKey);

    // Clean up footer just in case summary screen was open previously
    this.restoreQuizFooter();

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        QuizState.activeSet = selectedSet;
        QuizState.currentIndex = parsed.currentIndex;
        QuizState.score = parsed.score;
        // Map queueKeys back to actual cards
        QuizState.queue = parsed.queueKeys.map(word => State.allCards.find(c => c.word === word)).filter(Boolean);
        QuizState.incorrectCards = (parsed.incorrectKeys || []).map(word => State.allCards.find(c => c.word === word)).filter(Boolean);

        if (QuizState.queue.length > 0 && QuizState.currentIndex < QuizState.queue.length) {
          // Shuffle the remaining questions
          const remaining = QuizState.queue.slice(QuizState.currentIndex);
          for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          }
          QuizState.queue = [...QuizState.queue.slice(0, QuizState.currentIndex), ...remaining];

          this.openQuizModal();
          this.loadQuizQuestion();
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved quiz state", e);
      }
    }

    // No saved state or invalid, start fresh
    let setCards = State.allCards;
    if (selectedSet !== "All") {
      setCards = State.allCards.filter(c => c.category === selectedSet);
    }

    if (setCards.length === 0) {
      alert("No words available in this set to quiz!");
      return;
    }

    // Randomize question queue
    const queue = [...setCards];
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    QuizState.activeSet = selectedSet;
    QuizState.queue = queue;
    QuizState.currentIndex = 0;
    QuizState.score = 0;
    QuizState.incorrectCards = [];

    // Save state immediately
    this.saveQuizProgress();
    this.openQuizModal();
    this.loadQuizQuestion();
  },

  saveQuizProgress() {
    const storageKey = `vocab_srs_quizState_${QuizState.activeSet}`;
    const progress = {
      currentIndex: QuizState.currentIndex,
      score: QuizState.score,
      queueKeys: QuizState.queue.map(c => c.word),
      incorrectKeys: QuizState.incorrectCards.map(c => c.word)
    };
    localStorage.setItem(storageKey, JSON.stringify(progress));
  },

  clearQuizProgress(setName) {
    localStorage.removeItem(`vocab_srs_quizState_${setName}`);
  },

  openQuizModal() {
    UI.quiz.title.textContent = `Quiz: ${QuizState.activeSet === "All" ? "All Sets" : QuizState.activeSet}`;
    UI.quiz.modal.classList.remove("hidden");
    UI.quiz.modal.classList.add("flex");
  },

  loadQuizQuestion() {
    // Hide word details panel
    const details = document.getElementById("quizWordDetails");
    if (details) details.classList.add("hidden");

    if (QuizState.currentIndex >= QuizState.queue.length) {
      this.showQuizSummary();
      return;
    }

    const currentCard = QuizState.queue[QuizState.currentIndex];
    QuizState.isAnswered = false;
    QuizState.selectedOptionIndex = -1;

    const { options, correctOptionIndex } = this.generateOptions(currentCard);
    QuizState.options = options;
    QuizState.correctOptionIndex = correctOptionIndex;

    // Update UI
    UI.quiz.word.textContent = currentCard.word;

    // Progress bar
    const total = QuizState.queue.length;
    const percentage = (QuizState.currentIndex / total) * 100;
    UI.quiz.progressBar.style.width = `${percentage}%`;
    UI.quiz.progressText.textContent = `Question ${QuizState.currentIndex + 1} of ${total}`;
    UI.quiz.scoreText.textContent = `Score: ${QuizState.score}/${QuizState.currentIndex}`;

    UI.quiz.nextBtn.classList.add("hidden");

    // Render option buttons
    UI.quiz.optionsContainer.innerHTML = "";
    options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-500 text-slate-200 transition-all font-medium text-sm sm:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500";
      btn.textContent = opt;
      btn.addEventListener("click", () => this.handleQuizAnswer(idx));
      UI.quiz.optionsContainer.appendChild(btn);
    });
  },

  handleQuizAnswer(selectedIdx) {
    if (QuizState.isAnswered) return;
    QuizState.isAnswered = true;
    QuizState.selectedOptionIndex = selectedIdx;

    const buttons = UI.quiz.optionsContainer.querySelectorAll("button");
    const isCorrect = selectedIdx === QuizState.correctOptionIndex;
    const currentCard = QuizState.queue[QuizState.currentIndex];

    if (isCorrect) {
      QuizState.score++;
    } else {
      QuizState.incorrectCards.push(currentCard);
    }

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.remove("hover:bg-slate-700/50", "hover:border-slate-500", "cursor-pointer");

      if (idx === QuizState.correctOptionIndex) {
        btn.className = "w-full text-left p-4 rounded-xl border border-emerald-500 bg-emerald-950/60 text-emerald-200 font-semibold transition-all text-sm sm:text-base";
      } else if (idx === selectedIdx && !isCorrect) {
        btn.className = "w-full text-left p-4 rounded-xl border border-red-500 bg-red-950/60 text-red-200 font-semibold transition-all text-sm sm:text-base";
      } else {
        btn.className = "w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-500 font-medium transition-all text-sm sm:text-base";
      }
    });

    // Reveal Word Details
    const details = document.getElementById("quizWordDetails");
    const detailsDef = document.getElementById("quizWordDef");
    const detailsSyn = document.getElementById("quizWordSyn");
    const detailsSynContainer = document.getElementById("quizWordSynContainer");
    const detailsEx = document.getElementById("quizWordEx");
    const detailsExContainer = document.getElementById("quizWordExContainer");

    if (details && detailsDef) {
      detailsDef.textContent = currentCard.definition;

      if (currentCard.synonym && currentCard.synonym !== "N/A" && currentCard.synonym.trim().length > 0) {
        detailsSyn.textContent = currentCard.synonym;
        detailsSynContainer.classList.remove("hidden");
      } else {
        detailsSynContainer.classList.add("hidden");
      }

      if (currentCard.example && currentCard.example !== "N/A" && currentCard.example.trim().length > 0) {
        detailsEx.textContent = currentCard.example;
        detailsExContainer.classList.remove("hidden");
      } else {
        detailsExContainer.classList.add("hidden");
      }

      details.classList.remove("hidden");
    }

    UI.quiz.scoreText.textContent = `Score: ${QuizState.score}/${QuizState.currentIndex + 1}`;
    UI.quiz.nextBtn.classList.remove("hidden");
  },

  nextQuizQuestion() {
    QuizState.currentIndex++;
    this.saveQuizProgress();
    this.loadQuizQuestion();
  },

  suspendQuiz() {
    UI.quiz.modal.classList.add("hidden");
    UI.quiz.modal.classList.remove("flex");
    UI.renderDashboard();
  },

  showQuizSummary() {
    this.clearQuizProgress(QuizState.activeSet);
    UI.quiz.progressBar.style.width = "100%";
    UI.quiz.progressText.textContent = "Quiz Complete!";

    const percentage = Math.round((QuizState.score / QuizState.queue.length) * 100);
    let rankEmoji = "🎖️";
    if (percentage >= 90) rankEmoji = "🏆";
    else if (percentage >= 70) rankEmoji = "🌟";
    else if (percentage < 50) rankEmoji = "📚";

    UI.quiz.word.innerHTML = `<span class="block text-4xl sm:text-5xl mb-2">${rankEmoji}</span>${percentage}% Correct`;

    UI.quiz.optionsContainer.innerHTML = `
      <div class="text-center py-6 text-slate-300 flex flex-col gap-2">
        <p class="text-lg">You correctly answered <span class="font-bold text-white">${QuizState.score}</span> out of <span class="font-bold text-white">${QuizState.queue.length}</span> definitions.</p>
        <p class="text-sm text-slate-400 mt-2">Excellent practice session! Retake the quiz or return to the dashboard to continue studying.</p>
      </div>
    `;

    UI.quiz.nextBtn.classList.add("hidden");

    // Hide details panel in summary
    const details = document.getElementById("quizWordDetails");
    if (details) details.classList.add("hidden");

    // Save result to dashboard log
    const now = Date.now();
    const correctCardsList = QuizState.queue.filter(c => !QuizState.incorrectCards.some(ic => ic.word === c.word));
    const attemptData = {
      id: now.toString(),
      category: QuizState.activeSet,
      score: QuizState.score,
      total: QuizState.queue.length,
      percentage: percentage,
      date: now,
      correctWords: correctCardsList.map(c => ({ word: c.word, definition: c.definition })),
      incorrectWords: QuizState.incorrectCards.map(c => ({ word: c.word, definition: c.definition }))
    };
    State.saveQuizAttempt(attemptData);

    const footerDiv = UI.quiz.footer;
    let footerHtml = "";
    if (QuizState.incorrectCards && QuizState.incorrectCards.length > 0) {
      footerHtml += `
        <button id="practiceIncorrectBtn" class="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm">
          Practice Unknown Words (${QuizState.incorrectCards.length})
        </button>
      `;
    }
    footerHtml += `
      <button id="retakeQuizBtn" class="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm">
        Retake Quiz
      </button>
      <button id="finishQuizBtn" class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-2.5 px-6 rounded-xl transition-all border border-slate-700 text-sm">
        Return to Dashboard
      </button>
    `;
    footerDiv.innerHTML = footerHtml;

    const practiceBtn = document.getElementById("practiceIncorrectBtn");
    if (practiceBtn) {
      practiceBtn.addEventListener("click", () => {
        this.restoreQuizFooter();
        this.startPracticeIncorrect();
      });
    }

    document.getElementById("retakeQuizBtn").addEventListener("click", () => {
      this.restoreQuizFooter();
      this.startQuiz();
    });

    document.getElementById("finishQuizBtn").addEventListener("click", () => {
      this.restoreQuizFooter();
      this.suspendQuiz();
    });
  },

  restoreQuizFooter() {
    const footerDiv = UI.quiz.footer;
    footerDiv.innerHTML = `
      <button id="suspendQuizBtn" class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-2.5 px-5 rounded-xl transition-all border border-slate-700 text-sm">
        Suspend Quiz
      </button>
      <button id="nextQuizBtn" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm hidden">
        Next Question &rarr;
      </button>
    `;
    // Re-cache references
    UI.quiz.suspendBtn = document.getElementById("suspendQuizBtn");
    UI.quiz.nextBtn = document.getElementById("nextQuizBtn");

    UI.quiz.suspendBtn.addEventListener("click", () => this.suspendQuiz());
    UI.quiz.nextBtn.addEventListener("click", () => this.nextQuizQuestion());
  },

  startPracticeIncorrect() {
    if (!QuizState.incorrectCards || QuizState.incorrectCards.length === 0) return;
    const incorrectList = [...QuizState.incorrectCards];
    for (let i = incorrectList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [incorrectList[i], incorrectList[j]] = [incorrectList[j], incorrectList[i]];
    }
    QuizState.queue = incorrectList;
    QuizState.currentIndex = 0;
    QuizState.score = 0;
    QuizState.incorrectCards = [];
    this.saveQuizProgress();
    this.openQuizModal();
    this.loadQuizQuestion();
  }
};
