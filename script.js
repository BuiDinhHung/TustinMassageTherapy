const body = document.body;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");

if (header) {
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
    document.documentElement.style.setProperty(
      "--hero-shift",
      `${Math.min(window.scrollY * 0.08, 34).toFixed(1)}px`
    );
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
const navLinks = document.querySelectorAll(".site-nav a");

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    body.classList.remove("nav-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
});

const revealItems = document.querySelectorAll(".reveal");
const heroReveal = document.querySelector(".hero .reveal");

if (heroReveal) {
  heroReveal.classList.add("is-visible");
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 80}ms`);
    if (item !== heroReveal) {
      observer.observe(item);
    }
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* ---------------------------------------------------------------------------
   Spa "slay" enhancements: scroll progress, floating petals, gentle parallax,
   and a soft tilt on the service cards. All guarded by reduced-motion.
--------------------------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* Scroll progress bar */
const progress = document.createElement("div");
progress.className = "scroll-progress";
body.appendChild(progress);

const updateProgress = () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
};
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

if (!prefersReducedMotion) {
  /* Floating petals drifting through the hero */
  const hero = document.querySelector(".hero");
  if (hero) {
    const petals = document.createElement("div");
    petals.className = "hero-petals";
    petals.setAttribute("aria-hidden", "true");

    const petalCount = 14;
    for (let i = 0; i < petalCount; i += 1) {
      const petal = document.createElement("span");
      const size = 8 + Math.random() * 14;
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty("--petal-size", `${size.toFixed(0)}px`);
      petal.style.setProperty("--petal-duration", `${(11 + Math.random() * 10).toFixed(1)}s`);
      petal.style.setProperty("--petal-delay", `${(-Math.random() * 14).toFixed(1)}s`);
      petal.style.setProperty("--petal-drift", `${(Math.random() * 120 - 60).toFixed(0)}px`);
      petal.style.setProperty("--petal-opacity", (0.45 + Math.random() * 0.4).toFixed(2));
      petals.appendChild(petal);
    }
    hero.appendChild(petals);

    /* Gentle parallax on the hero ornament following the pointer.
       (The content itself keeps its reveal transition, so we leave it alone.) */
    const ornament = hero.querySelector(".hero-ornament");
    if (ornament) {
      ornament.style.transition = "translate 600ms cubic-bezier(0.22, 1, 0.36, 1)";
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        ornament.style.translate = `${(x * -42).toFixed(1)}px ${(y * -32).toFixed(1)}px`;
      });
      hero.addEventListener("pointerleave", () => {
        ornament.style.translate = "";
      });
    }
  }

  /* Soft 3D tilt on service & review cards */
  const tiltCards = document.querySelectorAll(
    ".ria-service-card, .ria-addon-menu, .review-card"
  );
  tiltCards.forEach((card) => {
    card.style.transformStyle = "preserve-3d";
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-10px) perspective(900px) rotateX(${(y * -4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

/* ---------------------------------------------------------------------------
   Phone links: plain anchors everywhere (iOS Safari needs the native tap).
   In-app browsers only (Zalo / Messenger / Instagram) sometimes swallow the
   anchor's default navigation, so there — and only there — we drive the
   dial ourselves via window.location. We preventDefault first so the native
   navigation and our JS navigation don't fire together and race each other
   (that race is what made a single tap silently do nothing, leaving only
   long-press's native "Call" menu working).
--------------------------------------------------------------------------- */
const isInAppBrowser = /zalo|fban|fbav|fb_iab|instagram|line\//i.test(
  navigator.userAgent
);

const isIOSSafari =
  /iPad|iPhone|iPod/i.test(navigator.userAgent) &&
  /WebKit/i.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);

if (isInAppBrowser) {
  document.querySelectorAll("a[href^='tel:']").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = link.getAttribute("href");
    });
  });
}

/*
   Some iOS Safari versions can lose the synthetic click on a styled tel link,
   while long-press still exposes the native Call menu. Handle a short,
   stationary touch directly; moved touches remain available for scrolling.
*/
if (isIOSSafari) {
  document.querySelectorAll("a[href^='tel:']").forEach((link) => {
    let touchStart = null;

    link.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.changedTouches[0];
        touchStart = touch
          ? { x: touch.clientX, y: touch.clientY, time: Date.now() }
          : null;
      },
      { passive: true }
    );

    link.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches[0];
        if (!touchStart || !touch) return;

        const moved = Math.hypot(
          touch.clientX - touchStart.x,
          touch.clientY - touchStart.y
        );
        const held = Date.now() - touchStart.time;
        touchStart = null;

        if (moved > 12 || held > 700) return;

        event.preventDefault();
        window.location.href = link.getAttribute("href");
      },
      { passive: false }
    );

    link.addEventListener("touchcancel", () => {
      touchStart = null;
    });
  });
}

/* ---------------------------------------------------------------------------
   Booking modal: any "Book" button opens a popup showing the phone number so
   visitors can call to reserve. Falls back to the mailto href if JS is off.
--------------------------------------------------------------------------- */
const bookingModal = document.getElementById("booking-modal");
const bookTriggers = document.querySelectorAll("[data-book]");

if (bookingModal && bookTriggers.length) {
  let lastFocused = null;

  const openBooking = (event) => {
    event.preventDefault();
    lastFocused = event.currentTarget;
    bookingModal.hidden = false;
    body.classList.add("booking-open");
    const focusTarget = bookingModal.querySelector(".booking-phone");
    if (focusTarget) focusTarget.focus();
  };

  const closeBooking = () => {
    bookingModal.hidden = true;
    body.classList.remove("booking-open");
    if (lastFocused) lastFocused.focus();
  };

  bookTriggers.forEach((trigger) => {
    trigger.addEventListener("click", openBooking);
  });

  bookingModal.querySelectorAll("[data-book-close]").forEach((el) => {
    el.addEventListener("click", closeBooking);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !bookingModal.hidden) closeBooking();
  });
}

/* ---------------------------------------------------------------------------
   Grand-opening promo popup: shows the sale banner shortly after the page
   loads. Closes via the X button, the backdrop, or the Escape key; tapping
   the banner itself opens the booking modal.
--------------------------------------------------------------------------- */
const promoModal = document.getElementById("promo-modal");

if (promoModal) {
  const closePromo = () => {
    promoModal.hidden = true;
  };

  const openPromo = () => {
    promoModal.hidden = false;
    const closeButton = promoModal.querySelector(".promo-close");
    if (closeButton) closeButton.focus();
  };

  promoModal.querySelectorAll("[data-promo-close]").forEach((el) => {
    el.addEventListener("click", closePromo);
  });

  /* The banner is also a "Book" trigger — close the promo so the booking
     modal appears on top without the sale popup lingering behind it. */
  const promoBanner = promoModal.querySelector(".promo-banner-button");
  if (promoBanner) {
    promoBanner.addEventListener("click", closePromo);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !promoModal.hidden) closePromo();
  });

  window.setTimeout(openPromo, 600);
}

/* ---------------------------------------------------------------------------
   Relaxing background music.
   - Plays a local track at audio/relax.mp3 when it is present — drop your own
     licensed / royalty-free song there to use it.
   - If no file is found it falls back to a soft generated melody so the site
     is never silent and needs no copyrighted file to work.
   - Browsers block audio until the visitor interacts, so it starts on the
     first tap / scroll / key, and remembers the on/off choice between visits.
--------------------------------------------------------------------------- */
const ambient = document.getElementById("ambient-audio");
const musicToggle = document.getElementById("music-toggle");
const AudioCtx = window.AudioContext || window.webkitAudioContext;

if (musicToggle) {
  const STORAGE_KEY = "tmt-music";
  const FILE_VOLUME = 0.5; /* mp3 playback level */
  const SYNTH_VOLUME = 0.5; /* synth master level; per-note gains keep it soft */

  let isOn = false;
  let engine = null; /* "file" | "synth" */
  let fileReady = false;

  const remember = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      /* storage unavailable (e.g. private mode) — ignore */
    }
  };

  const recall = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  };

  const setState = (on) => {
    isOn = on;
    musicToggle.classList.toggle("is-playing", on);
    musicToggle.setAttribute("aria-pressed", String(on));
    musicToggle.setAttribute(
      "aria-label",
      on ? "Pause relaxing music" : "Play relaxing music"
    );
  };

  /* ---------------------------- Local file engine ------------------------ */
  let fileFadeTimer = null;
  const fileFade = (target) => {
    clearInterval(fileFadeTimer);
    fileFadeTimer = setInterval(() => {
      const diff = target - ambient.volume;
      if (Math.abs(diff) < 0.02) {
        ambient.volume = Math.max(0, Math.min(1, target));
        clearInterval(fileFadeTimer);
        if (target === 0) ambient.pause();
      } else {
        ambient.volume = Math.max(0, Math.min(1, ambient.volume + diff * 0.06));
      }
    }, 60);
  };

  if (ambient) {
    ambient.addEventListener("canplay", () => {
      fileReady = true;
    });
    ambient.addEventListener("error", () => {
      fileReady = false;
    });
  }

  /* --------------------- Generated fallback engine (Web Audio) ----------- */
  const SCALE = [
    261.63, 293.66, 329.63, 392.0, 440.0,
    523.25, 587.33, 659.25, 783.99,
  ];
  let ctx = null;
  let master = null;
  let noteBus = null;
  let melodyTimer = null;
  let suspendTimer = null;
  let lastIndex = 2;

  const buildSynth = () => {
    ctx = new AudioCtx();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2300;
    filter.Q.value = 0.3;
    filter.connect(master);

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.36;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.33;
    const echoLevel = ctx.createGain();
    echoLevel.gain.value = 0.42;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(echoLevel);
    echoLevel.connect(master);

    noteBus = ctx.createGain();
    noteBus.gain.value = 1;
    noteBus.connect(filter);
    noteBus.connect(delay);

    const padGain = ctx.createGain();
    padGain.gain.value = 0.045;
    padGain.connect(filter);
    [130.81, 196.0].forEach((freq) => {
      [-4, 4].forEach((detune) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        osc.connect(padGain);
        osc.start();
      });
    });
  };

  const playNote = (freq, velocity) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const env = ctx.createGain();
    const peak = 0.14 * velocity;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(peak, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

    osc.connect(env);
    env.connect(noteBus);
    osc.start(now);
    osc.stop(now + 2.8);
  };

  const nextNote = () => {
    const step = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
    lastIndex = Math.max(0, Math.min(SCALE.length - 1, lastIndex + step));
    return SCALE[lastIndex];
  };

  const scheduleMelody = () => {
    if (!isOn || engine !== "synth") return;
    if (Math.random() > 0.16) {
      const velocity = 0.7 + Math.random() * 0.5;
      playNote(nextNote(), velocity);
      if (Math.random() < 0.22) {
        window.setTimeout(() => {
          if (isOn && engine === "synth") playNote(SCALE[Math.max(0, lastIndex - 2)], 0.5);
        }, 240);
      }
    }
    const next = 1500 + Math.random() * 1900;
    melodyTimer = window.setTimeout(scheduleMelody, next);
  };

  const fadeMaster = (to, seconds) => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.linearRampToValueAtTime(to, now + seconds);
  };

  const synthStart = () => {
    if (!AudioCtx) return;
    if (!ctx) buildSynth();
    clearTimeout(suspendTimer);
    ctx.resume();
    engine = "synth";
    fadeMaster(SYNTH_VOLUME, 2.4);
    setState(true);
    remember("on");
    clearTimeout(melodyTimer);
    scheduleMelody();
  };

  const synthStop = () => {
    if (ctx) {
      fadeMaster(0, 1.4);
      suspendTimer = setTimeout(() => {
        if (!isOn && ctx) ctx.suspend();
      }, 1600);
    }
    clearTimeout(melodyTimer);
  };

  /* ------------------------------ Controller ----------------------------- */
  const start = () => {
    /* Always try the local file first; only fall back to the generated
       track if there is no playable file (404 / unsupported / blocked). */
    if (ambient && !ambient.error) {
      ambient.volume = 0;
      ambient
        .play()
        .then(() => {
          engine = "file";
          fileFade(FILE_VOLUME);
          setState(true);
          remember("on");
        })
        .catch(() => {
          synthStart();
        });
    } else {
      synthStart();
    }
  };

  const stop = () => {
    if (engine === "file") {
      fileFade(0);
    } else {
      synthStop();
    }
    setState(false);
    remember("off");
  };

  musicToggle.addEventListener("click", () => {
    if (isOn) {
      stop();
    } else {
      start();
    }
  });

  if (recall() !== "off") {
    const events = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"];
    const startOnce = () => {
      if (!isOn && recall() !== "off") start();
      events.forEach((evt) => window.removeEventListener(evt, startOnce));
    };
    events.forEach((evt) =>
      window.addEventListener(evt, startOnce, { passive: true })
    );
  }
}
