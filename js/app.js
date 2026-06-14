import { State } from "./state.js";
import { UI } from "./ui.js";
import { DataLogic } from "./data.js";
import { setupEventListeners } from "./events.js";

document.addEventListener("DOMContentLoaded", async () => {
  State.loadAppState();
  await DataLogic.loadData();
  DataLogic.processRawData();
  DataLogic.populateCategoryDropdown();
  UI.renderDashboard();
  setupEventListeners();
});
