// ==========================================
// STATE MANAGEMENT (LocalStorage)
// ==========================================

export const State = {
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

  getSuspendedSession(category) {
    const saved = localStorage.getItem(`vocab_srs_suspended_session_${category}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing suspended session for " + category, e);
      }
    }
    return null;
  },

  saveSuspendedSession(category, queue, currentCard) {
    if (!queue || queue.length === 0) {
      localStorage.removeItem(`vocab_srs_suspended_session_${category}`);
      return;
    }
    const sessionData = {
      queueKeys: queue.map(c => c.key),
      currentKey: currentCard ? currentCard.key : null
    };
    localStorage.setItem(`vocab_srs_suspended_session_${category}`, JSON.stringify(sessionData));
  },

  clearSuspendedSession(category) {
    localStorage.removeItem(`vocab_srs_suspended_session_${category}`);
  },

  getQuizHistory() {
    try {
      return JSON.parse(localStorage.getItem("vocab_srs_quiz_results") || "[]");
    } catch (e) {
      console.error("Failed to parse quiz history", e);
      return [];
    }
  },

  saveQuizAttempt(attemptData) {
    const history = this.getQuizHistory();
    history.unshift(attemptData);
    localStorage.setItem("vocab_srs_quiz_results", JSON.stringify(history.slice(0, 20)));
  }
};

export const QuizState = {
  activeSet: null,
  queue: [],
  currentIndex: 0,
  score: 0,
  isAnswered: false,
  correctOptionIndex: -1,
  options: [],
  selectedOptionIndex: -1,
  incorrectCards: [],
};
