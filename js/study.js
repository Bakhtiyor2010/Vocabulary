import { State } from "./state.js";
import { UI } from "./ui.js";
import { DataLogic } from "./data.js";

export const StudyLogic = {
  startStudy() {
    const selectedCat = UI.inputs.categorySelect.value;
    State.appState.lastActiveCategory = selectedCat;
    State.saveAppState();

    // Check for suspended session first
    const suspended = State.getSuspendedSession(selectedCat);
    if (suspended && suspended.queueKeys && suspended.queueKeys.length > 0) {
      const loadedQueue = suspended.queueKeys
        .map(key => State.allCards.find(c => c.key === key))
        .filter(Boolean);

      if (loadedQueue.length > 0) {
        // Randomize the resumed queue
        for (let i = loadedQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [loadedQueue[i], loadedQueue[j]] = [loadedQueue[j], loadedQueue[i]];
        }
        State.dueCardsQueue = loadedQueue;
        
        // Pick the first card from the randomized queue
        State.currentCard = State.dueCardsQueue[0];
        
        UI.showView("study");
        UI.renderCard();
        UI.renderDashboard();
        return;
      }
    }

    // If no suspended session, start a new one
    const now = Date.now();
    State.dueCardsQueue = State.allCards.filter((card) => {
      const isDue = card.progress.nextReviewDate <= now;
      const matchesCat =
        selectedCat === "All" || card.category === selectedCat;
      return isDue && matchesCat;
    });

    // Randomize session start
    for (let i = State.dueCardsQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [State.dueCardsQueue[i], State.dueCardsQueue[j]] = [State.dueCardsQueue[j], State.dueCardsQueue[i]];
    }

    if (State.dueCardsQueue.length > 0) {
      State.currentCard = State.dueCardsQueue[0];
      State.saveSuspendedSession(selectedCat, State.dueCardsQueue, State.currentCard);
      UI.showView("study");
      UI.renderCard();
      UI.renderDashboard(); // Update Learning Queue length
    } else {
      UI.renderCaughtUp();
      UI.showView("caughtUp");
    }
  },

  loadNextCard() {
    const selectedCat = UI.inputs.categorySelect.value;
    if (State.dueCardsQueue.length === 0) {
      State.clearSuspendedSession(selectedCat);
      UI.renderDashboard();
      UI.renderCaughtUp();
      UI.showView("caughtUp");
      return;
    }
    State.currentCard = State.dueCardsQueue[0];
    State.saveSuspendedSession(selectedCat, State.dueCardsQueue, State.currentCard);
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

    const selectedCat = UI.inputs.categorySelect.value;
    State.saveSuspendedSession(selectedCat, State.dueCardsQueue, State.dueCardsQueue[0] || null);

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
        `Are you sure you want to reset all spaced repetition progress for ${catDisplay}? This cannot be undone.`
      )
    ) {
      return;
    }

    State.allCards.forEach((card) => {
      if (selectedCat === "All" || card.category === selectedCat) {
        localStorage.removeItem(card.key);
      }
    });

    if (selectedCat === "All") {
      Object.keys(State.rawData).forEach((cat) => {
        State.clearSuspendedSession(cat);
      });
      State.clearSuspendedSession("All");
    } else {
      State.clearSuspendedSession(selectedCat);
    }

    // Reload and re-render
    DataLogic.processRawData();
    UI.renderDashboard();
  }
};
