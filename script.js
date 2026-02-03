document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("./vocabulary.json");
    const vocabulary = await response.json();
    const contentDiv = document.getElementById("content");

    const createTable = (startIndex, words) => {
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";

      const table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.marginBottom = "20px";

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
      words.forEach(({ word, definition, example }, index) => {
        const tr = document.createElement("tr");

        const tdNo = document.createElement("td");
        tdNo.innerHTML = `<b>${startIndex + index + 1}</b>`;
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
      return wrapper;
    };

    const chunkSize = window.innerWidth <= 1000 ? 5 : vocabulary.length;

    for (let i = 0; i < vocabulary.length; i += chunkSize) {
      const chunk = vocabulary.slice(i, i + chunkSize);
      const tableWrapper = createTable(i, chunk);
      contentDiv.appendChild(tableWrapper);
    }

    window.addEventListener("resize", () => {
      contentDiv.innerHTML = "";
      const newChunkSize = window.innerWidth <= 1000 ? 5 : vocabulary.length;
      for (let i = 0; i < vocabulary.length; i += newChunkSize) {
        const chunk = vocabulary.slice(i, i + newChunkSize);
        const tableWrapper = createTable(i, chunk);
        contentDiv.appendChild(tableWrapper);
      }
    });
  } catch (error) {
    console.error("Error loading vocabulary:", error);
  }
});