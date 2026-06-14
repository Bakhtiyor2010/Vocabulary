import { UI } from "./ui.js";

export const SearchLogic = {
  openSearchModal(card) {
    UI.search.modalWord.textContent = card.word;
    UI.search.modalDef.textContent = card.definition;
    UI.search.modalSyn.textContent = card.synonym || "N/A";
    UI.search.modalEx.textContent = card.example || "N/A";
    UI.search.modalCat.textContent = card.category;

    UI.search.modal.classList.remove("hidden");
    UI.search.modal.classList.add("flex");
  }
};
