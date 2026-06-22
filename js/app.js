import { State } from "./state.js";
import { UI } from "./ui.js";
import { DataLogic } from "./data.js";
import { setupEventListeners } from "./events.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("globalAppLoader");
  if (loader) loader.classList.remove("hidden");

  State.loadAppState();
  await DataLogic.loadData();
  DataLogic.processRawData();
  DataLogic.populateCategoryDropdown();
  UI.renderDashboard();
  setupEventListeners();

  if (loader) {
    loader.classList.add("opacity-0");
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 300);
  }
});
