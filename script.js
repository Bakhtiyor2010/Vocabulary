document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("./vocabulary.json");
    const vocabulary = await response.json();
    const contentDiv = document.getElementById("content");

    const section = document.createElement("section");

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.border = "1";
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    ["No", "Word", "Definition", "Example"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    vocabulary.forEach(({ word, definition, example }, index) => {
      const tr = document.createElement("tr");

      const tdNo = document.createElement("td");
      tdNo.innerHTML = `<b>${index + 1}</b>`;
      tr.appendChild(tdNo);

      const tdWord = document.createElement("td");
      tdWord.innerHTML = `<b><i>${word}</i></b>`;
      tr.appendChild(tdWord);

      const tdDef = document.createElement("td");
      tdDef.textContent = definition;
      tr.appendChild(tdDef);

      const tdExample = document.createElement("td");
      tdExample.textContent = example;
      tr.appendChild(tdExample);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    section.appendChild(wrapper);
    contentDiv.appendChild(section);
  } catch (error) {
    console.error("Error loading vocabulary:", error);
  }
});