/* =========================================================
   NOVELHUB — CORE VERSION
   Gutendex + Project Gutenberg + Supabase
========================================================= */

const SUPABASE_URL =
  "https://wualzkqggfbosgvjcswb.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bG7mVEOkRFKj0XH3wRWZqg_D61fsRoa";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   ELEMENTS
========================================================= */

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


/* =========================================================
   STATE
========================================================= */

let fontSize =
  Number(localStorage.getItem("novelhub-font-size")) || 19;

let currentBook = null;


/* =========================================================
   SEARCH
========================================================= */

async function searchBooks(query) {

  query = query.trim();

  if (!query) {
    return;
  }

  booksContainer.innerHTML = `
    <div class="loading">
      Searching...
    </div>
  `;

  resultCount.textContent = "";

  try {

    const url =
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page_size=24`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error("Gutendex request failed");
    }

    const data =
      await response.json();

    resultCount.textContent =
      `${data.count.toLocaleString()} books found`;

    displayBooks(data.results);

  } catch (error) {

    console.error("SEARCH ERROR:", error);

    booksContainer.innerHTML = `
      <div class="loading">
        Unable to search books right now.
        Please try again.
      </div>
    `;

  }

}


/* =========================================================
   DISPLAY BOOKS
========================================================= */

function displayBooks(books) {

  booksContainer.innerHTML = "";

  if (!books || books.length === 0) {

    booksContainer.innerHTML = `
      <div class="loading">
        No books found.
      </div>
    `;

    return;
  }


  books.forEach(book => {

    const card =
      document.createElement("div");

    card.className = "book";


    const cover =
      book.formats?.["image/jpeg"] ||
      "https://via.placeholder.com/300x450?text=No+Cover";


    const title =
      book.title || "Unknown title";


    const author =
      book.authors?.[0]?.name ||
      "Unknown author";


    card.innerHTML = `

      <img
        class="book-cover"
        src="${escapeHTML(cover)}"
        alt="${escapeHTML(title)}"
      >

      <div class="book-info">

        <div class="book-title">
          ${escapeHTML(title)}
        </div>

        <div class="book-author">
          ${escapeHTML(author)}
        </div>

      </div>

    `;


    card.addEventListener(
      "click",
      () => openBook(book)
    );


    booksContainer.appendChild(card);

  });

}


/* =========================================================
   OPEN BOOK
========================================================= */

async function openBook(book) {

  currentBook = book;

  reader.classList.remove("hidden");

  document.body.style.overflow = "hidden";

  readerTitle.textContent =
    book.title || "Reading";


  readerContent.innerHTML = `
    <div class="reader-loading">
      Loading book...
    </div>
  `;


  try {

    const textUrl =
      getTextUrl(book);


    if (!textUrl) {

      throw new Error(
        "No readable text version available."
      );

    }


    const response =
      await fetch(textUrl);


    if (!response.ok) {

      throw new Error(
        "Unable to download book."
      );

    }


    const text =
      await response.text();


    displayBookText(
      text,
      book.title
    );


    /*
    Save book to Supabase.
    Failure here will NOT stop reading.
    */

    saveBook(book);

  } catch (error) {

    console.error(
      "BOOK ERROR:",
      error
    );


    readerContent.innerHTML = `

      <h1>
        ${escapeHTML(book.title)}
      </h1>

      <p>
        This book could not be loaded directly.
      </p>

      <p>
        You can open it on Project Gutenberg.
      </p>

      <a
        href="https://www.gutenberg.org/ebooks/${book.id}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Project Gutenberg
      </a>

    `;

  }

}


/* =========================================================
   FIND TEXT FILE
========================================================= */

function getTextUrl(book) {

  const formats =
    book.formats || {};


  return (
    formats["text/plain; charset=utf-8"] ||
    formats["text/plain"] ||
    formats["text/plain; charset=us-ascii"] ||
    null
  );

}


/* =========================================================
   FORMAT BOOK
========================================================= */

function displayBookText(
  text,
  title
) {

  let cleanText =
    text;


  /*
  Remove Gutenberg header.
  */

  const start =
    cleanText.indexOf(
      "*** START OF"
    );


  if (start !== -1) {

    const newline =
      cleanText.indexOf(
        "\n",
        start
      );

    if (newline !== -1) {

      cleanText =
        cleanText.substring(
          newline + 1
        );

    }

  }


  /*
  Remove Gutenberg footer.
  */

  const end =
    cleanText.indexOf(
      "*** END OF"
    );


  if (end !== -1) {

    cleanText =
      cleanText.substring(
        0,
        end
      );

  }


  const paragraphs =
    cleanText
      .split(/\n\s*\n/)
      .map(
        paragraph =>
          paragraph.trim()
      )
      .filter(Boolean);


  readerContent.innerHTML = "";


  const heading =
    document.createElement("h1");

  heading.textContent =
    title;


  readerContent.appendChild(
    heading
  );


  paragraphs.forEach(
    paragraph => {

      const p =
        document.createElement("p");

      p.textContent =
        paragraph;

      readerContent.appendChild(p);

    }
  );


  readerContent.style.fontSize =
    `${fontSize}px`;

}


/* =========================================================
   SAVE BOOK TO SUPABASE
========================================================= */

async function saveBook(book) {

  try {

    /*
    Check whether this Gutenberg book
    already exists.
    */

    const existing =
      await db
        .from("books")
        .select("id")
        .eq(
          "gutenberg_id",
          book.id
        )
        .maybeSingle();


    if (existing.error) {

      console.error(
        "SUPABASE CHECK ERROR:",
        existing.error
      );

      return;

    }


    if (existing.data) {

      return;

    }


    const author =
      book.authors?.[0]?.name ||
      null;


    const cover =
      book.formats?.["image/jpeg"] ||
      null;


    const result =
      await db
        .from("books")
        .insert({

          gutenberg_id:
            book.id,

          title:
            book.title,

          author:
            author,

          cover_url:
            cover,

          description:
            Array.isArray(book.subjects)
              ? book.subjects.join(", ")
              : null

        });


    if (result.error) {

      console.error(
        "SUPABASE INSERT ERROR:",
        result.error
      );

    } else {

      console.log(
        "Book saved to Supabase:",
        book.title
      );

    }

  } catch (error) {

    console.error(
      "SUPABASE ERROR:",
      error
    );

  }

}


/* =========================================================
   CLOSE READER
========================================================= */

closeReader.addEventListener(
  "click",
  () => {

    reader.classList.add("hidden");

    document.body.style.overflow = "";

    currentBook = null;

  }
);


/* =========================================================
   FONT SIZE
========================================================= */

increaseFont.addEventListener(
  "click",
  () => {

    fontSize += 2;

    if (fontSize > 30) {
      fontSize = 30;
    }

    readerContent.style.fontSize =
      `${fontSize}px`;

    localStorage.setItem(
      "novelhub-font-size",
      fontSize
    );

  }
);


decreaseFont.addEventListener(
  "click",
  () => {

    fontSize -= 2;

    if (fontSize < 13) {
      fontSize = 13;
    }

    readerContent.style.fontSize =
      `${fontSize}px`;

    localStorage.setItem(
      "novelhub-font-size",
      fontSize
    );

  }
);


/* =========================================================
   SEARCH BUTTON
========================================================= */

searchBtn.addEventListener(
  "click",
  () => {

    searchBooks(
      searchInput.value
    );

  }
);


/* =========================================================
   ENTER TO SEARCH
========================================================= */

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


/* =========================================================
   THEME
========================================================= */

themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light"
    );


    const light =
      document.body.classList.contains(
        "light"
      );


    themeBtn.textContent =
      light ? "☀" : "☾";


    localStorage.setItem(
      "novelhub-theme",
      light ? "light" : "dark"
    );

  }
);


/* =========================================================
   RESTORE THEME
========================================================= */

if (
  localStorage.getItem(
    "novelhub-theme"
  ) === "light"
) {

  document.body.classList.add(
    "light"
  );

  themeBtn.textContent =
    "☀";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  const element =
    document.createElement("div");

  element.textContent =
    value ?? "";

  return element.innerHTML;

}


/* =========================================================
   STARTUP
========================================================= */

console.log(
  "NovelHub loaded successfully."
);
