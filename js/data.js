import { State } from "./state.js";
import { UI } from "./ui.js";

export const DataLogic = {
  async loadData() {
    let dataFetched = false;
    try {
      const response = await fetch("json/vocabulary.json");
      if (response.ok) {
        State.rawData = await response.json();
        dataFetched = true;
      }
    } catch (err) {
      console.warn(
        "Could not fetch vocabulary.json via fetch API. Using mock fallback data.",
        err
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
        const key = `vocab_srs_${category}_${wordObj.word}`;
        let progress = State.getCardProgress(key);
        State.allCards.push({ ...wordObj, category, key, progress });
      });
    }
  },

  populateCategoryDropdown() {
    const select = UI.inputs.categorySelect;
    select.innerHTML = '<option value="All">All Sets</option>';
    Object.keys(State.rawData).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    if (
      Object.keys(State.rawData).includes(
        State.appState.lastActiveCategory
      ) ||
      State.appState.lastActiveCategory === "All"
    ) {
      select.value = State.appState.lastActiveCategory;
    }
  }
};
