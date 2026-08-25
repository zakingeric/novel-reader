alert("app.js loaded");

console.log("NovelHub app.js started");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const booksContainer = document.getElementById("books");
const resultCount = document.getElementById("resultCount");

console.log("Elements:", {
  searchInput,
  searchBtn,
  booksContainer,
  resultCount
});

if (!searchBtn) {
  alert("ERROR: searchBtn was not found");
}

searchBtn?.addEventListener("click", async () => {

  alert("Search button clicked");

  const query = searchInput.value.trim();

  console.log("Search query:", query);

  if (!query) {
    alert("Type a book name first");
    return;
  }

  booksContainer.innerHTML = `
    <div class="loading">
      Searching...
    </div>
  `;

  try {

    const url =
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page_size=24`;

    console.log("Requesting:", url);

    const response = await fetch(url);

    console.log("Response:", response.status);

    if (!response.ok) {
      throw new Error(
        `Gutendex returned ${response.status}`
      );
    }

    const data = await response.json();

    console.log("Gutendex data:", data);

    resultCount.textContent =
      `${data.count.toLocaleString()} books found`;

    booksContainer.innerHTML = "";

    if (!data.results.length) {

      booksContainer.innerHTML = `
        <div class="loading">
          No books found.
        </div>
      `;

      return;
    }

    data.results.forEach(book => {

      const card = document.createElement("div");

      card.className = "book";

      const cover =
        book.formats?.["image/jpeg"] ||
        "https://via.placeholder.com/300x450?text=No+Cover";

      const author =
        book.authors?.[0]?.name ||
        "Unknown author";

      card.innerHTML = `
        <img
          class="book-cover"
          src="${cover}"
          alt="${book.title}"
        >

        <div class="book-info">

          <div class="book-title">
            ${book.title}
          </div>

          <div class="book-author">
            ${author}
          </div>

        </div>
      `;

      card.addEventListener("click", () => {

        alert(
          `Selected: ${book.title}`
        );

      });

      booksContainer.appendChild(card);

    });

  } catch (error) {

    console.error(
      "SEARCH ERROR:",
      error
    );

    alert(
      "Search error: " + error.message
    );

    booksContainer.innerHTML = `
      <div class="loading">
        Search failed.
      </div>
    `;

  }

});


searchInput?.addEventListener("keydown", event => {

  if (event.key === "Enter") {

    searchBtn.click();

  }

});
