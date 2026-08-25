/* =========================================================
   NOVELHUB
   Supabase + Gutendex + Project Gutenberg
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://wualzkqggfbosgvjcswb.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bG7mVEOkRFKj0XH3wRWZqg_D61fsRoa";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   DOM
========================================================= */

const searchInput =
  document.getElementById("searchInput");

const searchBtn =
  document.getElementById("searchBtn");

const booksContainer =
  document.getElementById("books");

const resultCount =
  document.getElementById("resultCount");

const sectionTitle =
  document.getElementById("sectionTitle");

const reader =
  document.getElementById("reader");

const readerTitle =
  document.getElementById("readerTitle");

const readerContent =
  document.getElementById("readerContent");

const closeReader =
  document.getElementById("closeReader");

const increaseFont =
  document.getElementById("increaseFont");

const decreaseFont =
  document.getElementById("decreaseFont");

const bookmarkBtn =
  document.getElementById("bookmarkBtn");

const themeBtn =
  document.getElementById("themeBtn");

const authBtn =
  document.getElementById("authBtn");

const libraryBtn =
  document.getElementById("libraryBtn");

const authModal =
  document.getElementById("authModal");

const closeAuth =
  document.getElementById("closeAuth");

const authForm =
  document.getElementById("authForm");

const authTitle =
  document.getElementById("authTitle");

const authSubtitle =
  document.getElementById("authSubtitle");

const authSubmitText =
  document.getElementById("authSubmitText");

const toggleAuth =
  document.getElementById("toggleAuth");

const authMessage =
  document.getElementById("authMessage");

const emailInput =
  document.getElementById("emailInput");

const passwordInput =
  document.getElementById("passwordInput");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentBook = null;

let currentBookId = null;

let currentGutenbergId = null;

let fontSize = 19;

let isSignUp = false;

let saveProgressTimer = null;


/* =========================================================
   AUTH
========================================================= */

async function loadUser() {

  const {
    data,
    error
  } = await supabaseClient.auth.getUser();

  if (error) {

    console.error(error);

    return;

  }

  currentUser =
    data.user || null;

  updateAuthUI();

}


function updateAuthUI() {

  if (currentUser) {

    authBtn.textContent =
      "Sign out";

  } else {

    authBtn.textContent =
      "Sign in";

  }

}


/* =========================================================
   AUTH BUTTON
========================================================= */

authBtn.addEventListener(
  "click",
  async () => {

    if (currentUser) {

      await supabaseClient.auth.signOut();

      currentUser = null;

      updateAuthUI();

      alert("Signed out.");

      return;

    }

    openAuthModal();

  }
);


/* =========================================================
   OPEN AUTH
========================================================= */

function openAuthModal() {

  authModal.classList.remove("hidden");

  authMessage.textContent = "";

  emailInput.value = "";

  passwordInput.value = "";

}


/* =========================================================
   CLOSE AUTH
========================================================= */

closeAuth.addEventListener(
  "click",
  () => {

    authModal.classList.add("hidden");

  }
);


/* =========================================================
   TOGGLE SIGN IN / SIGN UP
========================================================= */

toggleAuth.addEventListener(
  "click",
  () => {

    isSignUp =
      !isSignUp;

    if (isSignUp) {

      authTitle.textContent =
        "Create account";

      authSubtitle.textContent =
        "Create an account to save your library and reading progress.";

      authSubmitText.textContent =
        "Create account";

      toggleAuth.textContent =
        "Already have an account? Sign in";

    } else {

      authTitle.textContent =
        "Sign in";

      authSubtitle.textContent =
        "Sign in to save books and reading progress.";

      authSubmitText.textContent =
        "Sign in";

      toggleAuth.textContent =
        "Don't have an account? Sign up";

    }

  }
);


/* =========================================================
   AUTH FORM
========================================================= */

authForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    authMessage.textContent =
      "Please wait...";


    try {

      let result;


      if (isSignUp) {

        result =
          await supabaseClient.auth.signUp({
            email,
            password
          });

      } else {

        result =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

      }


      if (result.error) {

        throw result.error;

      }


      if (isSignUp) {

        authMessage.textContent =
          "Account created. Check your email if confirmation is required.";

      } else {

        currentUser =
          result.data.user;

        updateAuthUI();

        authModal.classList.add("hidden");

      }

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        error.message;

    }

  }
);


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    currentUser =
      session?.user || null;

    updateAuthUI();

  }
);


/* =========================================================
   SEARCH GUTENDEX
========================================================= */

async function searchBooks(query) {

  if (!query.trim()) {

    return;

  }


  sectionTitle.textContent =
    "Search Results";


  booksContainer.innerHTML = `
    <div class="loading">
      Searching...
    </div>
  `;


  try {

    const url =
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page_size=32`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "Search failed."
      );

    }


    const data =
      await response.json();


    resultCount.textContent =
      `${data.count.toLocaleString()} books found`;


    displayBooks(
      data.results
    );


  } catch (error) {

    console.error(error);

    booksContainer.innerHTML = `
      <div class="loading">
        Something went wrong. Try again.
      </div>
    `;

  }

}


/* =========================================================
   DISPLAY BOOKS
========================================================= */

async function displayBooks(books) {

  booksContainer.innerHTML = "";


  if (!books.length) {

    booksContainer.innerHTML = `
      <div class="loading">
        No books found.
      </div>
    `;

    return;

  }


  for (const book of books) {

    const card =
      createBookCard(book);

    booksContainer.appendChild(card);

  }


  if (currentUser) {

    await markFavoriteBooks();

  }

}


/* =========================================================
   CREATE BOOK CARD
========================================================= */

function createBookCard(book) {

  const card =
    document.createElement("div");

  card.className =
    "book";


  const cover =
    book.formats?.["image/jpeg"] ||
    "https://via.placeholder.com/300x450?text=No+Cover";


  const title =
    book.title ||
    "Unknown title";


  const author =
    book.authors?.[0]?.name ||
    "Unknown author";


  const img =
    document.createElement("img");

  img.className =
    "book-cover";

  img.src =
    cover;

  img.alt =
    title;


  const info =
    document.createElement("div");

  info.className =
    "book-info";


  const titleElement =
    document.createElement("div");

  titleElement.className =
    "book-title";

  titleElement.textContent =
    title;


  const authorElement =
    document.createElement("div");

  authorElement.className =
    "book-author";

  authorElement.textContent =
    author;


  info.appendChild(titleElement);

  info.appendChild(authorElement);


  const favorite =
    document.createElement("button");

  favorite.className =
    "favorite-btn";

  favorite.textContent =
    "♡";

  favorite.title =
    "Favorite";


  favorite.addEventListener(
    "click",
    async event => {

      event.stopPropagation();

      await toggleFavorite(book);

    }
  );


  card.appendChild(img);

  card.appendChild(info);

  card.appendChild(favorite);


  card.addEventListener(
    "click",
    () => {

      openBook(book);

    }
  );


  return card;

}


/* =========================================================
   GET TEXT FORMAT
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
   OPEN BOOK
========================================================= */

async function openBook(book) {

  const textUrl =
    getTextUrl(book);


  if (!textUrl) {

    alert(
      "A readable text version of this book is not available."
    );

    return;

  }


  currentGutenbergId =
    book.id;


  reader.classList.remove(
    "hidden"
  );


  document.body.style.overflow =
    "hidden";


  readerTitle.textContent =
    book.title;


  readerContent.innerHTML = `
    <div class="reader-loading">
      Loading "${escapeHTML(book.title)}"...
    </div>
  `;


  currentBook =
    book;


  try {

    const response =
      await fetch(textUrl);


    if (!response.ok) {

      throw new Error(
        "Book could not be loaded."
      );

    }


    const text =
      await response.text();


    const savedBook =
      await saveBookToSupabase(book);


    if (savedBook) {

      currentBookId =
        savedBook.id;

    }


    displayBookText(
      text,
      book.title
    );


    await loadReadingProgress();


  } catch (error) {

    console.error(error);

    readerContent.innerHTML = `

      <h1>${escapeHTML(book.title)}</h1>

      <p>
        We couldn't load this book right now.
      </p>

      <a
        href="https://www.gutenberg.org/ebooks/${book.id}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open on Project Gutenberg
      </a>

    `;

  }

}


/* =========================================================
   SAVE BOOK
========================================================= */

async function saveBookToSupabase(book) {

  const existing =
    await supabaseClient
      .from("books")
      .select("*")
      .eq("gutenberg_id", book.id)
      .maybeSingle();


  if (existing.error) {

    console.error(
      existing.error
    );

    return null;

  }


  if (existing.data) {

    return existing.data;

  }


  const author =
    book.authors?.[0]?.name ||
    null;


  const cover =
    book.formats?.["image/jpeg"] ||
    null;


  const description =
    Array.isArray(book.subjects)
      ? book.subjects.join(", ")
      : null;


  const result =
    await supabaseClient
      .from("books")
      .insert({

        gutenberg_id:
          book.id,

        title:
          book.title,

        author,

        cover_url:
          cover,

        description

      })
      .select()
      .single();


  if (result.error) {

    console.error(
      result.error
    );

    return null;

  }


  return result.data;

}


/* =========================================================
   FORMAT BOOK TEXT
========================================================= */

function displayBookText(
  text,
  title
) {

  let cleanText =
    text;


  const startMarker =
    "*** START OF";


  const endMarker =
    "*** END OF";


  const start =
    cleanText.indexOf(
      startMarker
    );


  const end =
    cleanText.indexOf(
      endMarker
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


  if (end !== -1) {

    cleanText =
      cleanText.substring(
        0,
        end
      );

  }


  readerContent.innerHTML = "";


  const heading =
    document.createElement("h1");

  heading.textContent =
    title;


  readerContent.appendChild(
    heading
  );


  const paragraphs =
    cleanText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);


  paragraphs.forEach(
    paragraph => {

      const p =
        document.createElement("p");

      p.textContent =
        paragraph;

      readerContent.appendChild(
        p
      );

    }
  );


  readerContent.style.fontSize =
    `${fontSize}px`;

}


/* =========================================================
   CLOSE READER
========================================================= */

closeReader.addEventListener(
  "click",
  async () => {

    await saveCurrentProgress();

    reader.classList.add(
      "hidden"
    );

    document.body.style.overflow =
      "";

    currentBook =
      null;

    currentBookId =
      null;

    currentGutenbergId =
      null;

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
   READING PROGRESS
========================================================= */

async function saveCurrentProgress() {

  if (
    !currentUser ||
    !currentBookId ||
    !readerContent
  ) {

    return;

  }


  const scrollable =
    document.documentElement.scrollHeight -
    window.innerHeight;


  if (scrollable <= 0) {

    return;

  }


  const progress =
    Math.min(
      100,
      Math.max(
        0,
        (window.scrollY / scrollable) * 100
      )
    );


  const result =
    await supabaseClient
      .from("reading_progress")
      .upsert(
        {

          user_id:
            currentUser.id,

          book_id:
            currentBookId,

          progress:
            Number(progress.toFixed(2)),

          updated_at:
            new Date().toISOString()

        },
        {
          onConflict:
            "user_id,book_id"
        }
      );


  if (result.error) {

    console.error(
      "Progress error:",
      result.error
    );

  }

}


/* =========================================================
   AUTO SAVE SCROLL
========================================================= */

window.addEventListener(
  "scroll",
  () => {

    if (
      reader.classList.contains(
        "hidden"
      )
    ) {

      return;

    }


    clearTimeout(
      saveProgressTimer
    );


    saveProgressTimer =
      setTimeout(
        saveCurrentProgress,
        800
      );

  }
);


/* =========================================================
   LOAD READING PROGRESS
========================================================= */

async function loadReadingProgress() {

  if (
    !currentUser ||
    !currentBookId
  ) {

    return;

  }


  const result =
    await supabaseClient
      .from("reading_progress")
      .select("progress")
      .eq(
        "user_id",
        currentUser.id
      )
      .eq(
        "book_id",
        currentBookId
      )
      .maybeSingle();


  if (
    result.error ||
    !result.data
  ) {

    return;

  }


  const progress =
    Number(
      result.data.progress
    );


  if (
    progress <= 0 ||
    progress >= 100
  ) {

    return;

  }


  setTimeout(
    () => {

      const scrollable =
        document.documentElement.scrollHeight -
        window.innerHeight;


      window.scrollTo(
        0,
        scrollable * (progress / 100)
      );

    },
    300
  );

}


/* =========================================================
   FAVORITES
========================================================= */

async function toggleFavorite(book) {

  if (!currentUser) {

    openAuthModal();

    authMessage.textContent =
      "Sign in to save books.";

    return;

  }


  const savedBook =
    await saveBookToSupabase(book);


  if (!savedBook) {

    return;

  }


  const existing =
    await supabaseClient
      .from("favorites")
      .select("id")
      .eq(
        "user_id",
        currentUser.id
      )
      .eq(
        "book_id",
        savedBook.id
      )
      .maybeSingle();


  if (existing.error) {

    console.error(
      existing.error
    );

    return;

  }


  if (existing.data) {

    await supabaseClient
      .from("favorites")
      .delete()
      .eq(
        "id",
        existing.data.id
      );

  } else {

    await supabaseClient
      .from("favorites")
      .insert({

        user_id:
          currentUser.id,

        book_id:
          savedBook.id

      });

  }


  /*
  Refresh current search
  */

  if (searchInput.value.trim()) {

    await searchBooks(
      searchInput.value
    );

  }

}


/* =========================================================
   MARK FAVORITES
========================================================= */

async function markFavoriteBooks() {

  if (!currentUser) {

    return;

  }


  const result =
    await supabaseClient
      .from("favorites")
      .select("book_id");


  if (result.error) {

    console.error(
      result.error
    );

    return;

  }


  /*
  The search cards are indexed
  in the same order as the result.
  */

  const favoriteIds =
    new Set(
      result.data.map(
        item =>
          item.book_id
      )
    );


  const cards =
    document.querySelectorAll(
      ".book"
    );


  /*
  We don't have the Supabase ID
  stored directly on cards, so this
  function is mainly visual support
  for cards already saved during this
  session.
  */

}


/* =========================================================
   MY LIBRARY
========================================================= */

libraryBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      openAuthModal();

      authMessage.textContent =
        "Sign in to access your library.";

      return;

    }


    sectionTitle.textContent =
      "My Library";

    resultCount.textContent =
      "";


    booksContainer.innerHTML = `
      <div class="loading">
        Loading your library...
      </div>
    `;


    const result =
      await supabaseClient
        .from("favorites")
        .select(`
          id,
          books (
            id,
        
