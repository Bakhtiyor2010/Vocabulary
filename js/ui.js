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
    searchCategorySelect: document.getElementById("searchCategorySelect"),
  },
  search: {
    results: document.getElementById("searchResults"),
    loader: document.getElementById("searchLoader"),
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
    attemptSelect: document.getElementById("quizAttemptSelect"),
  },
  table: {
    modal: document.getElementById("tableModal"),
    closeModal: document.getElementById("closeTableModal"),
    title: document.getElementById("tableModalTitle"),
    content: document.getElementById("tableModalContent"),
    btn: document.getElementById("showTableBtn"),
  },
  about: {
    modal: document.getElementById("aboutModal"),
    closeModal: document.getElementById("closeAboutModal"),
    btn: document.getElementById("showAboutBtn"),
  },
  excel: {
    modal: document.getElementById("excelExportModal"),
    closeModal: document.getElementById("closeExcelExportModal"),
    btn: document.getElementById("exportExcelBtn"),
    setList: document.getElementById("excelSetList"),
    selectAll: document.getElementById("excelSelectAll"),
    downloadBtn: document.getElementById("downloadExcelBtn"),
    downloadPdfBtn: document.getElementById("downloadPdfBtn"),
  },

  initTheme() {
    const theme = State.getTheme();
    this.applyTheme(theme);
  },

  toggleTheme() {
    const currentTheme = State.getTheme();
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    State.setTheme(newTheme);
    this.applyTheme(newTheme);
  },

  applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.setAttribute(
        "title",
        theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
      );
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
      );
    });
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
      this.card.ratingBtns.classList.remove("opacity-0", "pointer-events-none");
    }, 150);
  },

  renderCaughtUp() {
    const selectedCat = this.inputs.categorySelect.value;
    const catDisplay =
      selectedCat === "All" ? "All Sets" : `the set "${selectedCat}"`;
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

    // Group attempts by category (set)
    const categoryAttempts = {};
    results.forEach((res) => {
      if (!categoryAttempts[res.category]) {
        categoryAttempts[res.category] = [];
      }
      categoryAttempts[res.category].push(res);
    });

    // Extract the oldest attempt (first attempt chronologically) for each category
    const firstAttempts = [];
    Object.keys(categoryAttempts).forEach((category) => {
      const list = categoryAttempts[category];
      // Since results is newest first, the oldest is the last element
      const oldestAttempt = list[list.length - 1];
      firstAttempts.push(oldestAttempt);
    });

    // Sort the first attempts descending by date to show the latest-started set quizzes first
    firstAttempts.sort((a, b) => b.date - a.date);

    container.innerHTML = firstAttempts
      .map((res) => {
        const dateStr = new Date(res.date).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        let scoreColor = "text-rose-500 dark:text-rose-400";
        if (res.percentage >= 80) scoreColor = "text-emerald-600 dark:text-emerald-400";
        else if (res.percentage >= 50) scoreColor = "text-amber-600 dark:text-amber-400";

        return `
        <div class="quiz-history-item bg-white/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer p-4 rounded-xl flex flex-col gap-2 transition-all shadow-sm dark:shadow-none" data-id="${res.id}">
          <div class="flex justify-between items-start gap-4">
            <span class="font-bold text-slate-900 dark:text-white text-sm sm:text-base break-words" title="${res.category}">${res.category === "All" ? "All Sets" : res.category}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">${dateStr}</span>
          </div>
          <div class="flex items-baseline justify-between mt-1">
            <span class="text-xs text-slate-500 dark:text-slate-400">Score: <span class="font-bold text-slate-700 dark:text-slate-200">${res.score}/${res.total}</span></span>
            <span class="text-lg font-bold ${scoreColor}">${res.percentage}%</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1">
            <div class="h-1.5 rounded-full ${res.percentage >= 80 ? "bg-emerald-500" : res.percentage >= 50 ? "bg-amber-500" : "bg-rose-500"}" style="width: ${res.percentage}%"></div>
          </div>
        </div>
      `;
      })
      .join("");
  },

  openQuizDetailsModal(attemptId) {
    const results = State.getQuizHistory();
    const attempt = results.find((r) => r.id === attemptId);
    if (!attempt) return;

    // Get all attempts for this category and sort chronologically ascending
    const categoryAttempts = results
      .filter((r) => r.category === attempt.category)
      .sort((a, b) => a.date - b.date);

    // Populate attempt dropdown
    this.quizDetails.attemptSelect.innerHTML = categoryAttempts
      .map((att, index) => {
        const dateStr = new Date(att.date).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        return `<option value="${att.id}">Attempt ${index + 1} (${dateStr}) - ${att.score}/${att.total} (${att.percentage}%)</option>`;
      })
      .join("");

    // Select the currently clicked attempt
    this.quizDetails.attemptSelect.value = attemptId;

    // Load details for the selected attempt
    this.updateQuizDetailsContent(attemptId);

    this.quizDetails.modal.classList.remove("hidden");
    this.quizDetails.modal.classList.add("flex");
  },

  updateQuizDetailsContent(attemptId) {
    const results = State.getQuizHistory();
    const attempt = results.find((r) => r.id === attemptId);
    if (!attempt) return;

    this.quizDetails.title.textContent =
      attempt.category === "All"
        ? "Quiz Results: All Sets"
        : `Quiz Results: ${attempt.category}`;
    this.quizDetails.date.textContent = new Date(attempt.date).toLocaleString(
      "en-US",
      { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
    );
    this.quizDetails.score.textContent = `Score: ${attempt.score}/${attempt.total} (${attempt.percentage}%)`;

    this.quizDetails.correctCount.textContent =
      attempt.correctWords?.length || 0;
    this.quizDetails.incorrectCount.textContent =
      attempt.incorrectWords?.length || 0;

    const renderWordList = (words) => {
      if (!words || words.length === 0)
        return `<div class="text-slate-500 dark:text-slate-400 text-sm">None</div>`;
      return words
        .map(
          (w) => `
        <div class="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 p-2.5 rounded-lg mb-2 shadow-sm dark:shadow-none">
          <span class="font-bold text-slate-900 dark:text-slate-200 block text-sm">${w.word}</span>
          <span class="text-slate-600 dark:text-slate-400 text-xs">${w.definition}</span>
        </div>
      `,
        )
        .join("");
    };

    this.quizDetails.correctList.innerHTML = renderWordList(
      attempt.correctWords,
    );
    this.quizDetails.incorrectList.innerHTML = renderWordList(
      attempt.incorrectWords,
    );

    if (attempt.incorrectWords && attempt.incorrectWords.length > 0) {
      this.quizDetails.practiceBtn.classList.remove("hidden");
      this.quizDetails.practiceBtn.dataset.attemptId = attemptId;
    } else {
      this.quizDetails.practiceBtn.classList.add("hidden");
    }
  },

  closeQuizDetailsModal() {
    this.quizDetails.modal.classList.add("hidden");
    this.quizDetails.modal.classList.remove("flex");
  },

  openTableModal() {
    const selectedCat = this.inputs.categorySelect.value;
    const cards = State.allCards.filter(
      (c) => selectedCat === "All" || c.category === selectedCat,
    );

    this.table.title.textContent =
      selectedCat === "All"
        ? "Vocabulary: All Sets"
        : `Vocabulary: ${selectedCat}`;

    if (cards.length === 0) {
      this.table.content.innerHTML = `<p class="text-slate-500 dark:text-slate-400">No vocabulary found in this category.</p>`;
    } else {
      let contentHtml = `
        <div class="hidden min-[800px]:block">
          <table class="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead class="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">#</th>
                <th class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Word</th>
                <th class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Definition</th>
                <th class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Synonym</th>
                <th class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Example</th>
              </tr>
            </thead>
            <tbody>
              ${cards
                .map(
                  (c, index) => `
                <tr class="border-b border-slate-200/80 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td class="px-4 py-3 text-slate-500 dark:text-slate-400">${index + 1}</td>
                  <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">${c.word}</td>
                  <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${c.definition}</td>
                  <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${c.synonym}</td>
                  <td class="px-4 py-3 italic text-slate-600 dark:text-slate-400">${c.example}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="min-[800px]:hidden block">
          <ol class="list-decimal list-inside space-y-4 text-sm text-slate-700 dark:text-slate-300">
            ${cards
              .map(
                (c) => `
              <li class="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
                <span class="font-bold text-slate-900 dark:text-white text-base ml-1">${c.word}</span>
                <div class="mt-2 flex flex-col gap-1 pl-5">
                  <p><span class="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-widest">Definition:</span> <span class="text-slate-700 dark:text-slate-300">${c.definition}</span></p>
                  <p><span class="text-purple-600 dark:text-purple-400 font-bold uppercase text-[10px] tracking-widest">Synonym:</span> <span class="text-slate-700 dark:text-slate-300">${c.synonym}</span></p>
                  <p><span class="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Example:</span> <span class="italic text-slate-600 dark:text-slate-400">${c.example}</span></p>
                </div>
              </li>
            `,
              )
              .join("")}
          </ol>
        </div>
      `;
      this.table.content.innerHTML = contentHtml;
    }

    this.table.modal.classList.remove("hidden");
    this.table.modal.classList.add("flex");
  },

  closeTableModal() {
    this.table.modal.classList.add("hidden");
    this.table.modal.classList.remove("flex");
  },

  openAboutModal() {
    this.about.modal.classList.remove("hidden");
    this.about.modal.classList.add("flex");
  },

  closeAboutModal() {
    this.about.modal.classList.add("hidden");
    this.about.modal.classList.remove("flex");
  },

  openExcelExportModal() {
    const categories = Object.keys(State.rawData);
    const list = this.excel.setList;
    list.innerHTML = "";

    const badge = document.getElementById("excelExportCountBadge");
    const summary = document.getElementById("excelExportSummary");
    const emptyHint = document.getElementById("excelExportEmptyHint");
    const summaryLine = document.getElementById("excelSummaryLine");
    const summarySub = document.getElementById("excelSummarySub");

    const recalcSelection = () => {
      const all = list.querySelectorAll('input[type="checkbox"]');
      const checked = list.querySelectorAll('input[type="checkbox"]:checked');
      const count = checked.length;
      const totalWords = Array.from(checked).reduce((sum, cb) => {
        const words = State.rawData[cb.value] || [];
        return sum + words.length;
      }, 0);

      if (badge) {
        if (count > 0) {
          badge.textContent = `${count} selected`;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }

      if (summary && summaryLine && summarySub) {
        if (count > 0) {
          summary.classList.remove("hidden");
          summary.classList.add("flex");
          const setLabel = count === 1 ? "set" : "sets";
          const wordLabel = totalWords === 1 ? "word" : "words";
          summaryLine.textContent = `${count} ${setLabel} • ${totalWords} ${wordLabel}`;
          summarySub.textContent = "Select a format below to download";
        } else {
          summary.classList.add("hidden");
          summary.classList.remove("flex");
        }
      }

      if (emptyHint) {
        if (count > 0) {
          emptyHint.classList.add("hidden");
        } else {
          emptyHint.classList.remove("hidden");
        }
      }

      // Update select-all checkbox state
      if (this.excel.selectAll) {
        this.excel.selectAll.checked =
          all.length > 0 && all.length === checked.length;
      }

      // Update visual state on each item row (checked background/border)
      list.querySelectorAll("label.excel-set-item").forEach((row) => {
        const input = row.querySelector('input[type="checkbox"]');
        if (input && input.checked) {
          row.classList.add(
            "bg-green-50",
            "dark:bg-green-950/30",
            "border-green-300",
            "dark:border-green-700/60",
            "shadow-sm",
          );
          row.classList.remove(
            "bg-slate-50",
            "hover:bg-slate-100/80",
            "dark:bg-slate-800/60",
            "dark:hover:bg-slate-700/60",
            "border-slate-200",
            "hover:border-slate-300",
            "dark:border-slate-700/50",
            "dark:hover:border-slate-500/50",
          );
          const checkIcon = row.querySelector(".excel-row-check");
          if (checkIcon) {
            checkIcon.classList.remove("text-slate-400");
            checkIcon.classList.add("text-green-600", "dark:text-green-400");
          }
        } else {
          row.classList.remove(
            "bg-green-50",
            "dark:bg-green-950/30",
            "border-green-300",
            "dark:border-green-700/60",
            "shadow-sm",
          );
          row.classList.add(
            "bg-slate-50",
            "hover:bg-slate-100/80",
            "dark:bg-slate-800/60",
            "dark:hover:bg-slate-700/60",
            "border-slate-200",
            "hover:border-slate-300",
            "dark:border-slate-700/50",
            "dark:hover:border-slate-500/50",
          );
          const checkIcon = row.querySelector(".excel-row-check");
          if (checkIcon) {
            checkIcon.classList.add("text-slate-400");
            checkIcon.classList.remove("text-green-600", "dark:text-green-400");
          }
        }
      });
    };

    if (categories.length === 0) {
      list.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-sm py-2">No sets available.</p>`;
    } else {
      categories.forEach((cat) => {
        const wordCount = (State.rawData[cat] || []).length;
        const id = `excelSet_${CSS.escape(cat)}`;
        const item = document.createElement("label");
        item.htmlFor = id;
        item.className =
          "excel-set-item flex items-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 border border-slate-200 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-500/50 rounded-2xl px-4 py-3.5 transition-all select-none group shadow-sm dark:shadow-none";
        item.innerHTML = `
          <div class="relative shrink-0">
            <input type="checkbox" id="${id}" value="${cat}" class="accent-green-600 dark:accent-green-500 w-5 h-5 cursor-pointer peer sr-only">
            <div class="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center transition-all peer-checked:border-green-500 peer-checked:bg-green-500 dark:peer-checked:border-green-500 dark:peer-checked:bg-green-500">
              <svg class="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <span class="block font-semibold text-slate-900 dark:text-white text-sm truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">${cat}</span>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                ${wordCount} word${wordCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <svg class="excel-row-check w-5 h-5 text-slate-400 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        `;
        list.appendChild(item);
      });
    }

    // Reset select-all checkbox
    this.excel.selectAll.checked = false;

    // Wire up select-all toggle
    const onSelectAll = () => {
      const checked = this.excel.selectAll.checked;
      list.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = checked;
      });
      recalcSelection();
    };
    this.excel.selectAll.removeEventListener("change", this._onSelectAll);
    this._onSelectAll = onSelectAll;
    this.excel.selectAll.addEventListener("change", onSelectAll);

    // Keep select-all and visuals in sync when individual checkboxes change
    list.removeEventListener("change", this._onExcelListChange);
    this._onExcelListChange = recalcSelection;
    list.addEventListener("change", recalcSelection);

    // Initial state calculation
    recalcSelection();

    this.excel.modal.classList.remove("hidden");
    this.excel.modal.classList.add("flex");
  },

  closeExcelExportModal() {
    this.excel.modal.classList.add("hidden");
    this.excel.modal.classList.remove("flex");
  },

  downloadExcel() {
    const checked = this.excel.setList.querySelectorAll(
      "input[type=checkbox]:checked",
    );
    if (checked.length === 0) {
      // Shake the download button briefly
      this.excel.downloadBtn.classList.add("scale-95", "opacity-70");
      setTimeout(
        () => this.excel.downloadBtn.classList.remove("scale-95", "opacity-70"),
        200,
      );
      return;
    }

    const wb = XLSX.utils.book_new();
    const usedNames = new Set();

    checked.forEach((cb) => {
      const cat = cb.value;
      const words = State.rawData[cat] || [];
      const rows = [
        ["#", "Word", "Definition", "Synonym", "Example"], // header
        ...words.map((w, i) => [
          i + 1,
          w.word || "",
          w.definition || "",
          w.synonym || "",
          w.example || "",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Column widths
      ws["!cols"] = [
        { wch: 4 },
        { wch: 18 },
        { wch: 50 },
        { wch: 25 },
        { wch: 55 },
      ];

      // Safe sheet name: Excel limits to 31 chars and forbids certain chars
      let name = cat.replace(/[\/\\\?\*\[\]\:]/g, "-");
      
      // Shorten common terms to preserve unique suffixes/prefixes
      if (name.length > 31) {
        name = name.replace(/Vocabulary/g, "Vocab");
      }
      if (name.length > 31) {
        name = name.replace(/Package/g, "Pkg");
      }
      if (name.length > 31) {
        name = name.slice(0, 14) + "..." + name.slice(-14);
      }

      let safeName = name;
      let counter = 1;
      while (usedNames.has(safeName.toLowerCase())) {
        const suffix = `_${counter}`;
        const allowedLength = 31 - suffix.length;
        if (name.length > allowedLength) {
          safeName = (name.slice(0, Math.ceil(allowedLength / 2) - 1) + "..." + name.slice(-Math.floor(allowedLength / 2) + 2)) + suffix;
        } else {
          safeName = name + suffix;
        }
        counter++;
      }
      usedNames.add(safeName.toLowerCase());

      XLSX.utils.book_append_sheet(wb, ws, safeName);
    });

    const fileName =
      checked.length === 1
        ? `${checked[0].value}_vocabulary.xlsx`
        : `SAT_Vocabulary_${checked.length}_sets.xlsx`;

    XLSX.writeFile(wb, fileName);
    this.closeExcelExportModal();
  },

  downloadPdf() {
    const checked = this.excel.setList.querySelectorAll(
      "input[type=checkbox]:checked",
    );
    if (checked.length === 0) {
      // Shake the download button briefly
      this.excel.downloadPdfBtn.classList.add("scale-95", "opacity-70");
      setTimeout(
        () =>
          this.excel.downloadPdfBtn.classList.remove("scale-95", "opacity-70"),
        200,
      );
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let isFirst = true;

    checked.forEach((cb) => {
      const cat = cb.value;
      const words = State.rawData[cat] || [];

      if (!isFirst) {
        doc.addPage();
      }
      isFirst = false;

      // Add a header for the category
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(cat, 14, 20);

      // Add table of words
      const headers = [["#", "Word", "Definition", "Synonym", "Example"]];
      const data = words.map((w, i) => [
        i + 1,
        w.word || "",
        w.definition || "",
        w.synonym || "",
        w.example || "",
      ]);

      doc.autoTable({
        head: headers,
        body: data,
        startY: 25,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }, // Beautiful Indigo matching theme
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 60 },
          3: { cellWidth: 35 },
          4: { cellWidth: 50 },
        },
      });
    });

    const fileName =
      checked.length === 1
        ? `${checked[0].value}_vocabulary.pdf`
        : `SAT_Vocabulary_${checked.length}_sets.pdf`;

    doc.save(fileName);
    this.closeExcelExportModal();
  },
};
