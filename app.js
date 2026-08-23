const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const booksContainer = document.getElementById("books");
const resultCount = document.getElementById("resultCount");

const reader = document.getElementById("reader");
const readerTitle = document.getElementById("readerTitle");
const readerContent = document.getElementById("readerContent");

const closeReader = document.getElementById("closeReader");

const increaseFont = document.getElementById("increaseFont");
const decreaseFont = document.getElementById("decreaseFont");

const themeBtn = document.getElementById("themeBtn");


/*
========================================
SEARCH OPEN LIBRARY
========================================
*/

async function searchBooks(query) {

  if (!query.trim()) return;

  booksContainer.innerHTML = `
    <div class="loading">
      Searching...
    </div>
  `;

  try {

    const url =
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24`;

    const response = await fetch(url);

    const data = await response.json();

    resultCount.textContent =
      `${data.numFound.toLocaleString()} books found`;

    displayBooks(data.docs);

  } catch (error) {

    console.error(error);

    booksContainer.innerHTML = `
      <div class="loading">
        Something went wrong. Try again.
      </div>
    `;

  }

}


/*
========================================
DISPLAY BOOKS
========================================
*/

function displayBooks(books) {

  booksContainer.innerHTML = "";

  if (!books.length) {

    booksContainer.innerHTML = `
      <div class="loading">
        No books found.
      </div>
    `;

    return;
  }


  books.forEach(book => {

    const coverId = book.cover_i;

    const cover = coverId

      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`

      : "https://via.placeholder.com/300x450?text=No+Cover";


    const title =
      book.title || "Unknown title";

    const author =
      book.author_name?.[0] || "Unknown author";


    const card = document.createElement("div");

    card.className = "book";

    card.innerHTML = `

      <img
        class="book-cover"
        src="${cover}"
        alt="${title}"
      >

      <div class="book-info">

        <div class="book-title">
          ${title}
        </div>

        <div class="book-author">
          ${author}
        </div>

      </div>

    `;


    /*
    Try to find Gutenberg ID
    */

    const gutenbergId =
      findGutenbergId(book);


    card.addEventListener("click", () => {

      if (gutenbergId) {

        openBook(
          gutenbergId,
          title
        );

      } else {

        alert(
          "This book doesn't have a Gutenberg edition available in our current database."
        );

      }

    });


    booksContainer.appendChild(card);

  });

}


/*
========================================
GUTENBERG ID
========================================

For the prototype we map popular
public-domain books.

Later this can become a database.
*/

function findGutenbergId(book) {

  const title =
    book.title?.toLowerCase() || "";


  const knownBooks = {

    "frankenstein":
      84,

    "pride and prejudice":
      1342,

    "alice's adventures in wonderland":
      11,

    "dracula":
      345,

    "the adventures of sherlock holmes":
      1661,

    "the great gatsby":
      64317,

    "moby dick":
      2701,

    "little women":
      37106,

    "the picture of dorian gray":
      174,

    "a tale of two cities":
      98

  };


  for (const name in knownBooks) {

    if (title.includes(name)) {

      return knownBooks[name];

    }

  }

  return null;

}


/*
========================================
OPEN BOOK
========================================
*/

async function openBook(id, title) {

  reader.classList.remove("hidden");

  readerTitle.textContent = title;

  readerContent.innerHTML = `
    <div class="reader-loading">
      Loading "${title}"...
    </div>
  `;


  try {

    /*
    Gutenberg plain text endpoint
    */

    const url =
      `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;

    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "Book could not be loaded"
      );

    }


    const text =
      await response.text();


    displayBookText(
      text,
      title
    );


  } catch (error) {

    console.error(error);

    readerContent.innerHTML = `

      <h1>${title}</h1>

      <p>
        We couldn't load the book directly.
      </p>

      <p>
        You can read the book on Project Gutenberg.
      </p>

      <a
        href="https://www.gutenberg.org/"
        target="_blank"
      >
        Open Project Gutenberg
      </a>

    `;

  }

}


/*
========================================
FORMAT BOOK
========================================
*/

function displayBookText(text, title) {

  /*
  Remove Gutenberg header/footer
  */

  const start =
    text.indexOf("*** START OF");

  const end =
    text.indexOf("*** END OF");


  if (start !== -1) {

    text =
      text.substring(start);

  }


  if (end !== -1) {

    text =
      text.substring(0, text.indexOf("*** END OF"));

  }


  const paragraphs =
    text
      .split(/\n\s*\n/)
      .filter(p => p.trim());


  readerContent.innerHTML = `
    <h1>${title}</h1>
  `;


  paragraphs.forEach(paragraph => {

    const p =
      document.createElement("p");

    p.textContent =
      paragraph.trim();

    readerContent.appendChild(p);

  });

}


/*
========================================
CLOSE READER
========================================
*/

closeReader.addEventListener(
  "click",
  () => {

    reader.classList.add("hidden");

  }
);


/*
========================================
FONT SIZE
========================================
*/

let fontSize = 19;


increaseFont.addEventListener(
  "click",
  () => {

    fontSize += 2;

    readerContent.style.fontSize =
      `${fontSize}px`;

  }
);


decreaseFont.addEventListener(
  "click",
  () => {

    if (fontSize > 13) {

      fontSize -= 2;

      readerContent.style.fontSize =
        `${fontSize}px`;

    }

  }
);


/*
========================================
SEARCH EVENTS
========================================
*/

searchBtn.addEventListener(
  "click",
  () => {

    searchBooks(
      searchInput.value
    );

  }
);


searchInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      searchBooks(
        searchInput.value
      );

    }

  }
);


/*
========================================
DARK MODE
========================================
*/

themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light"
    );

  }
);
