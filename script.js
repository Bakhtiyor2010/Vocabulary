document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("./vocabulary.json");
    const vocabulary = await response.json();
    const contentDiv = document.getElementById("content");

    const renderTable = (words) => {
      const table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.width = "100%";

      const thead = document.createElement("thead");
      const trHead = document.createElement("tr");

      ["No", "Word", "Synonym", "Definition", "Example"].forEach((text) => {
        const th = document.createElement("th");
        th.textContent = text;
        trHead.appendChild(th);
      });

      thead.appendChild(trHead);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      words.forEach(({ word, definition, synonym, example }, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td><b>${index + 1}</b></td>
          <td><b><i>${word}</i></b></td>
          <td>${synonym}</td>
          <td>${definition}</td>
          <td>${example}</td>
        `;

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      contentDiv.appendChild(table);
    };

    const renderList = (words) => {
      const ol = document.createElement("ol");

      words.forEach(({ word, definition, synonym, example }) => {
        const li = document.createElement("li");

        li.innerHTML = `
          <b>Word:</b> <i>${word}</i> <br>
          <b>Synonym:</b> ${synonym} <br>
          <b>Definition:</b> ${definition} <br>
          <b>Example:</b> ${example}
        `;

        ol.appendChild(li);
        ol.appendChild(document.createElement("br"));
      });

      contentDiv.appendChild(ol);
    };

    const render = () => {
      contentDiv.innerHTML = "";

      if (window.innerWidth < 1400) {
        renderList(vocabulary);
      } else {
        renderTable(vocabulary);
      }
    };

    render();
    window.addEventListener("resize", render);
  } catch (error) {
    console.error("Error loading vocabulary:", error);
  }
});