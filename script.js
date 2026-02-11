document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("./vocabulary.json");
    const allVocabulary = await response.json();

    const contentDiv = document.getElementById("content");
    const groupsSection = document.getElementById("groups");
    const searchBox = document.getElementById("search-box");
    const resultsSection = document.getElementById("results");

    const params = new URLSearchParams(window.location.search);
    const group = params.get("group");

    const modal = document.getElementById("modal");
    const modalWord = document.getElementById("modal-word");
    const modalSynonym = document.getElementById("modal-synonym");
    const modalDefinition = document.getElementById("modal-definition");
    const modalExample = document.getElementById("modal-example");
    const modalClose = document.getElementById("modal-close");

    const openModal = (w) => {
      modalWord.textContent = w.word;
      modalSynonym.textContent = w.synonym;
      modalDefinition.textContent = w.definition;
      modalExample.textContent = w.example;
      modal.style.display = "flex";
    };

    modalClose.onclick = () => (modal.style.display = "none");
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };

    const renderGroups = () => {
      Object.keys(allVocabulary).forEach((g) => {
        const link = document.createElement("a");
        link.href = `?group=${g}`;
        link.target = "_blank";
        link.textContent = g.toUpperCase();
        link.style.display = "block";
        groupsSection.appendChild(link);
      });
    };

    const renderTable = (words) => {
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";

      const table = document.createElement("table");

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
      wrapper.appendChild(table);
      contentDiv.appendChild(wrapper);
    };

    const renderList = (words) => {
      const section = document.createElement("section");
      const ol = document.createElement("ol");

      words.forEach(({ word, definition, synonym, example }) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <b>Word:</b> <i>${word}</i><br>
          <b>Synonym:</b> ${synonym}<br>
          <b>Definition:</b> ${definition}<br>
          <b>Example:</b> ${example}
        `;
        ol.appendChild(li);
        ol.appendChild(document.createElement("br"));
      });

      section.appendChild(ol);
      contentDiv.appendChild(section);
    };

    const initMainSearch = () => {
      const allWords = Object.values(allVocabulary).flat();

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Search word...";

      const ul = document.createElement("ul");

      input.addEventListener("input", () => {
        const value = input.value.toLowerCase();
        ul.innerHTML = "";
        if (!value) return;

        allWords
          .filter((w) => w.word.toLowerCase().includes(value))
          .forEach((w) => {
            const li = document.createElement("li");
            li.textContent = w.word;
            li.onclick = () => openModal(w);
            ul.appendChild(li);
          });
      });

      searchBox.appendChild(input);
      resultsSection.appendChild(ul);
    };

    const render = () => {
      contentDiv.innerHTML = "";
      if (!group || !allVocabulary[group]) return;

      const vocabulary = allVocabulary[group];

      if (window.innerWidth < 1000) {
        renderList(vocabulary);
      } else {
        renderTable(vocabulary);
      }
    };

    renderGroups();

    if (!group) {
      initMainSearch();
      return;
    }

    groupsSection.style.display = "none";
    render();
    window.addEventListener("resize", render);
  } catch (error) {
    console.error("Error loading vocabulary:", error);
  }
});