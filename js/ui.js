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
        return `<div class="text-slate-400 text-sm">None</div>`;
      return words
        .map(
          (w) => `
        <div class="bg-slate-900/50 p-2 rounded-lg mb-2">
          <span class="font-bold text-slate-200 block text-sm">${w.word}</span>
          <span class="text-slate-400 text-xs">${w.definition}</span>
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
      this.table.content.innerHTML = `<p class="text-slate-400">No vocabulary found in this category.</p>`;
    } else {
      let contentHtml = `
        <div class="hidden min-[800px]:block">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs text-slate-400 uppercase bg-slate-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th class="px-4 py-3 border-b border-slate-700">#</th>
                <th class="px-4 py-3 border-b border-slate-700">Word</th>
                <th class="px-4 py-3 border-b border-slate-700">Definition</th>
                <th class="px-4 py-3 border-b border-slate-700">Synonym</th>
                <th class="px-4 py-3 border-b border-slate-700">Example</th>
              </tr>
            </thead>
            <tbody>
              ${cards
                .map(
                  (c, index) => `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td class="px-4 py-3">${index + 1}</td>
                  <td class="px-4 py-3 font-medium text-white">${c.word}</td>
                  <td class="px-4 py-3">${c.definition}</td>
                  <td class="px-4 py-3">${c.synonym}</td>
                  <td class="px-4 py-3 italic">${c.example}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="min-[800px]:hidden block">
          <ol class="list-decimal list-inside space-y-4 text-sm text-slate-300">
            ${cards
              .map(
                (c) => `
              <li class="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                <span class="font-bold text-white text-base ml-1">${c.word}</span>
                <div class="mt-2 flex flex-col gap-1 pl-5">
                  <p><span class="text-blue-400 font-bold uppercase text-[10px] tracking-widest">Definition:</span> ${c.definition}</p>
                  <p><span class="text-purple-400 font-bold uppercase text-[10px] tracking-widest">Synonym:</span> ${c.synonym}</p>
                  <p><span class="text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Example:</span> <span class="italic">${c.example}</span></p>
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

    if (categories.length === 0) {
      list.innerHTML = `<p class="text-slate-400 text-sm">No sets available.</p>`;
    } else {
      categories.forEach((cat) => {
        const wordCount = (State.rawData[cat] || []).length;
        const id = `excelSet_${CSS.escape(cat)}`;
        const item = document.createElement("label");
        item.htmlFor = id;
        item.className =
          "flex items-center gap-3 cursor-pointer bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-500/50 rounded-xl px-4 py-3 transition-all select-none group";
        item.innerHTML = `
          <input type="checkbox" id="${id}" value="${cat}" class="accent-green-500 w-4 h-4 cursor-pointer shrink-0">
          <div class="flex-1 min-w-0">
            <span class="block font-semibold text-white text-sm truncate">${cat}</span>
            <span class="block text-xs text-slate-400 mt-0.5">${wordCount} word${wordCount !== 1 ? "s" : ""}</span>
          </div>
          <svg class="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
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
      list.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.checked = checked;
      });
    };
    this.excel.selectAll.removeEventListener("change", this._onSelectAll);
    this._onSelectAll = onSelectAll;
    this.excel.selectAll.addEventListener("change", onSelectAll);

    // Keep select-all in sync when individual checkboxes change
    list.addEventListener("change", () => {
      const all = list.querySelectorAll("input[type=checkbox]");
      const checked = list.querySelectorAll("input[type=checkbox]:checked");
      this.excel.selectAll.checked =
        all.length > 0 && all.length === checked.length;
    });

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
      const safeName = cat.replace(/[\/\\\?\*\[\]\:]/g, "-").slice(0, 31);
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
