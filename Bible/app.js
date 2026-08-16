const channel = "BroadcastChannel" in window ? new BroadcastChannel("projector-bible") : null;
const liveStateKey = "projector-bible-live-state";

const state = {
  slides: [],
  previewIndex: 0,
  liveSlides: [],
  liveIndex: 0,
  showVerseNumbers: true,
  highContrast: false,
  fontSize: 72,
  isProjectorScreen: new URLSearchParams(window.location.search).get("screen") === "projector",
};

const elements = {
  form: document.getElementById("search-form"),
  referenceInput: document.getElementById("reference-input"),
  translationSelect: document.getElementById("translation-select"),
  openProjectorButton: document.getElementById("open-projector-btn"),
  stage: document.getElementById("stage"),
  stageReference: document.getElementById("stage-reference"),
  stageTranslation: document.getElementById("stage-translation"),
  slidePosition: document.getElementById("slide-position"),
  slideTotal: document.getElementById("slide-total"),
  previousButton: document.getElementById("prev-btn"),
  nextButton: document.getElementById("next-btn"),
  sendButton: document.getElementById("send-btn"),
  status: document.getElementById("status"),
  showVerseNumbers: document.getElementById("show-verse-numbers"),
  highContrast: document.getElementById("high-contrast"),
  fontSizeRange: document.getElementById("font-size-range"),
  quickPicks: Array.from(document.querySelectorAll(".quick-pick")),
};

const translationLabels = {
  web: "World English Bible",
  kjv: "King James Version",
  asv: "American Standard Version",
  "oeb-us": "Open English Bible",
};

function setStatus(message, isError = false) {
  if (!elements.status) {
    return;
  }

  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

function getActiveSlides() {
  return state.isProjectorScreen ? state.liveSlides : state.slides;
}

function getActiveIndex() {
  return state.isProjectorScreen ? state.liveIndex : state.previewIndex;
}

function updateStageMeta() {
  const activeSlides = getActiveSlides();
  const activeIndex = getActiveIndex();

  if (!activeSlides.length) {
    elements.stageReference.textContent = state.isProjectorScreen ? "Waiting for send" : "Ready";
    elements.stageTranslation.textContent = state.isProjectorScreen ? "Projector output" : "Operator mode";
    return;
  }

  const activeSlide = activeSlides[activeIndex];
  elements.stageReference.textContent = activeSlide.reference;
  elements.stageTranslation.textContent = translationLabels[activeSlide.translation] || activeSlide.translation;
}

function renderStage() {
  elements.stage.style.setProperty("--stage-font-size", `${state.fontSize}px`);
  const activeSlides = getActiveSlides();
  const activeIndex = getActiveIndex();

  if (!activeSlides.length) {
    elements.stage.className = "stage empty";
    elements.stage.innerHTML = `
      <div class="empty-state">
        <p class="empty-kicker">${state.isProjectorScreen ? "Projector Output" : "Preview Surface"}</p>
        <h2>${state.isProjectorScreen ? "Send a verse from the operator screen to display it here." : "Search for a passage to preview verses before sending them live."}</h2>
        <p>${state.isProjectorScreen ? "This screen stays unchanged until the operator presses send." : "Each verse becomes its own readable frame for a projector or large display."}</p>
      </div>
    `;
    elements.slidePosition.textContent = "0";
    elements.slideTotal.textContent = "0";
    elements.previousButton.disabled = true;
    elements.nextButton.disabled = true;
    if (elements.sendButton) {
      elements.sendButton.disabled = true;
    }
    updateStageMeta();
    return;
  }

  const activeSlide = activeSlides[activeIndex];
  const verseNumber = state.showVerseNumbers ? `${activeSlide.verse}. ` : "";

  elements.stage.className = "stage";
  elements.stage.innerHTML = `
    <article class="slide">
      <span class="stage-translation-chip">${translationLabels[activeSlide.translation] || activeSlide.translation}</span>
      <h2 class="stage-verse-reference">${activeSlide.reference}</h2>
      <p class="stage-verse-text">${verseNumber}${activeSlide.text}</p>
    </article>
  `;

  elements.slidePosition.textContent = String(activeIndex + 1);
  elements.slideTotal.textContent = String(activeSlides.length);
  elements.previousButton.disabled = activeIndex === 0;
  elements.nextButton.disabled = activeIndex === activeSlides.length - 1;
  if (elements.sendButton) {
    elements.sendButton.disabled = state.isProjectorScreen;
  }
  updateStageMeta();
}

function buildSlides(payload, translation) {
  if (!payload.verses || !payload.verses.length) {
    return [];
  }

  return payload.verses.map((verse) => ({
    reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
    text: verse.text.replace(/\s+/g, " ").trim(),
    verse: verse.verse,
    translation,
  }));
}

async function loadPassage(reference, translation) {
  setStatus(`Loading ${reference}...`);

  try {
    const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${encodeURIComponent(translation)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const payload = await response.json();

    if (payload.error) {
      throw new Error(payload.error);
    }

    const slides = buildSlides(payload, translation);

    if (!slides.length) {
      throw new Error("No verses were returned for that passage.");
    }

    state.slides = slides;
    state.previewIndex = 0;
    renderStage();
    setStatus(`Loaded ${payload.reference || reference}. Preview it, then press send when ready.`);
  } catch (error) {
    state.slides = [];
    state.previewIndex = 0;
    renderStage();
    setStatus(`Unable to load passage: ${error.message}`, true);
  }
}

function movePreview(direction) {
  if (!state.slides.length || state.isProjectorScreen) {
    return;
  }

  const nextIndex = state.previewIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.slides.length) {
    return;
  }

  state.previewIndex = nextIndex;
  renderStage();
}

function buildLivePayload() {
  return {
    liveSlides: state.slides,
    liveIndex: state.previewIndex,
    fontSize: state.fontSize,
    highContrast: state.highContrast,
    showVerseNumbers: state.showVerseNumbers,
    updatedAt: Date.now(),
  };
}

function applyLivePayload(payload) {
  if (!payload || !Array.isArray(payload.liveSlides)) {
    return;
  }

  state.liveSlides = payload.liveSlides;
  state.liveIndex = typeof payload.liveIndex === "number" ? payload.liveIndex : 0;
  state.fontSize = typeof payload.fontSize === "number" ? payload.fontSize : state.fontSize;
  state.highContrast = Boolean(payload.highContrast);
  state.showVerseNumbers = Boolean(payload.showVerseNumbers);

  document.body.classList.toggle("high-contrast", state.highContrast);
  if (elements.highContrast) {
    elements.highContrast.checked = state.highContrast;
  }
  if (elements.showVerseNumbers) {
    elements.showVerseNumbers.checked = state.showVerseNumbers;
  }
  if (elements.fontSizeRange) {
    elements.fontSizeRange.value = String(state.fontSize);
  }

  renderStage();
}

function sendToProjector() {
  if (!state.slides.length || state.isProjectorScreen) {
    return;
  }

  const payload = buildLivePayload();
  localStorage.setItem(liveStateKey, JSON.stringify(payload));
  if (channel) {
    channel.postMessage({ type: "live-update", payload });
  }

  setStatus(`Sent ${state.slides[state.previewIndex].reference} to the projector screen.`);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    return;
  }

  await document.exitFullscreen();
}

function openProjectorWindow() {
  const projectorUrl = `${window.location.origin}${window.location.pathname}?screen=projector`;
  const projectorWindow = window.open(projectorUrl, "projector-bible-screen");

  if (!projectorWindow) {
    setStatus("Pop-up was blocked. Allow pop-ups for the projector window.", true);
    return;
  }

  setStatus("Projector window opened. Use that window on the main screen.");
}

function hydrateLiveState() {
  const saved = localStorage.getItem(liveStateKey);
  if (!saved) {
    return;
  }

  try {
    applyLivePayload(JSON.parse(saved));
  } catch {
    if (!state.isProjectorScreen) {
      setStatus("Saved live state could not be restored.", true);
    }
  }
}

function initializeMode() {
  if (!state.isProjectorScreen) {
    return;
  }

  document.body.classList.add("projector-screen");
  document.title = "Projector Bible - Live Screen";
  elements.form?.closest(".control-panel")?.remove();
  if (elements.previousButton) {
    elements.previousButton.disabled = true;
  }
  if (elements.nextButton) {
    elements.nextButton.disabled = true;
  }
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const reference = String(formData.get("reference")).trim();
  const translation = String(formData.get("translation")).trim();

  if (!reference) {
    setStatus("Enter a Bible reference first.", true);
    return;
  }

  await loadPassage(reference, translation);
});

elements.openProjectorButton?.addEventListener("click", openProjectorWindow);

elements.previousButton.addEventListener("click", () => movePreview(-1));
elements.nextButton.addEventListener("click", () => movePreview(1));
elements.sendButton?.addEventListener("click", sendToProjector);

elements.showVerseNumbers.addEventListener("change", (event) => {
  state.showVerseNumbers = event.target.checked;
  renderStage();
});

elements.highContrast.addEventListener("change", (event) => {
  state.highContrast = event.target.checked;
  document.body.classList.toggle("high-contrast", state.highContrast);
});

elements.fontSizeRange.addEventListener("input", (event) => {
  state.fontSize = Number(event.target.value);
  renderStage();
});

elements.quickPicks.forEach((button) => {
  button.addEventListener("click", async () => {
    const reference = button.dataset.reference;
    const translation = button.dataset.translation || elements.translationSelect.value;

    elements.referenceInput.value = reference;
    elements.translationSelect.value = translation;
    await loadPassage(reference, translation);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    return;
  }

  if (event.key === "ArrowRight") {
    movePreview(1);
  } else if (event.key === "ArrowLeft") {
    movePreview(-1);
  } else if (event.key === "Enter" && !state.isProjectorScreen) {
    sendToProjector();
  } else if (event.key.toLowerCase() === "f") {
    toggleFullscreen().catch(() => {
      setStatus("Fullscreen was blocked by the browser.", true);
    });
  } else if (event.key.toLowerCase() === "h") {
    document.body.classList.toggle("controls-hidden");
  }
});

if (channel) {
  channel.addEventListener("message", (event) => {
    if (event.data?.type === "live-update") {
      applyLivePayload(event.data.payload);
    }
  });
}

window.addEventListener("storage", (event) => {
  if (event.key !== liveStateKey || !event.newValue) {
    return;
  }

  try {
    applyLivePayload(JSON.parse(event.newValue));
  } catch {
    // Ignore malformed cross-tab data.
  }
});

initializeMode();
hydrateLiveState();
renderStage();
