/* Run in a fresh homepage with the intro session marked as seen:
 * Get-Content -Raw tests/browser/motion-regressions.js |
 *   npx --yes agent-browser --session imports-motion eval --stdin
 * This intentionally exercises browser behavior without adding test dependencies.
 */
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  await wait(700);
  check(
    !document.querySelector(".site-intro"),
    "Seen sessions must skip the intro",
  );
  const resources = performance
    .getEntriesByType("resource")
    .filter((item) => item.name.includes("/intro/"));
  check(resources.length === 0, "Skipped intro requested assets");
  check(
    !document.querySelector(".interactive-background canvas"),
    "Background still runs a canvas",
  );

  let frames = 0;
  const originalFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    frames += 1;
    return originalFrame.call(window, callback);
  };
  try {
    await wait(700);
    check(frames === 0, `Idle page requested ${frames} animation frames`);
    for (let index = 0; index < 100; index += 1) {
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 40 + index,
          clientY: 60,
          pointerType: "mouse",
        }),
      );
    }
    await wait(80);
    check(frames <= 1, `Pointer events were not batched: ${frames}`);
  } finally {
    window.requestAnimationFrame = originalFrame;
  }

  const originalScroll = window.scrollY;
  const main = document.querySelector("main");
  check(main, "Main content missing");
  const reveal = document.createElement("div");
  reveal.dataset.reveal = "";
  reveal.dataset.motionSection = "regression-reveal";
  reveal.style.cssText = "min-height:80px;margin-top:100vh";
  reveal.textContent = "Reveal regression fixture";
  main.append(reveal);
  try {
    await wait(120);
    const reduced = document.documentElement.dataset.motion === "reduced";
    check(
      reduced || reveal.classList.contains("reveal-pending"),
      "Offscreen reveal not registered",
    );
    reveal.scrollIntoView({ behavior: "instant", block: "center" });
    await wait(180);
    check(
      reveal.classList.contains("is-revealed"),
      "Intersection did not reveal content",
    );
    check(
      reveal.style.getPropertyValue("--section-progress") !== "",
      "Streamed motion section not measured",
    );
    window.scrollTo({ top: originalScroll, behavior: "instant" });
    await wait(100);
    check(
      reveal.classList.contains("is-revealed") &&
        !reveal.classList.contains("reveal-pending"),
      "Revealed content hid again",
    );
  } finally {
    reveal.remove();
    window.scrollTo({ top: originalScroll, behavior: "instant" });
  }

  const restore = document.querySelector("header a");
  restore.focus();
  window.dispatchEvent(new CustomEvent("imports-tech:intro-replay"));
  await wait(100);
  const dialog = document.querySelector(".site-intro");
  check(dialog, "Explicit replay did not open");
  check(main.closest("[inert]"), "Intro background remains interactive");
  const video = dialog.querySelector("video");
  video.pause();
  video.dispatchEvent(new Event("error"));
  await wait(60);
  const buttons = Array.from(dialog.querySelectorAll(".intro-actions button"));
  check(
    buttons.length >= 2,
    "Playback failure did not offer retry and continue",
  );
  buttons.at(-1).focus();
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    }),
  );
  check(document.activeElement === buttons[0], "Forward tab escaped the intro");
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  check(
    document.activeElement === buttons.at(-1),
    "Reverse tab escaped the intro",
  );
  restore.focus();
  check(
    dialog.contains(document.activeElement),
    "Background stole intro focus",
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }),
  );
  await wait(750);
  check(
    !document.querySelector(".site-intro"),
    "Escape did not close the intro",
  );
  check(!main.closest("[inert]"), "Background stayed inert after closing");
  check(document.activeElement === restore, "Focus was not restored");
  check(
    !document.body.classList.contains("intro-active"),
    "Intro scroll lock stayed active",
  );

  return {
    idleFrames: 0,
    skippedIntroRequests: 0,
    pointerBatching: true,
    revealOnce: true,
    streamedSections: true,
    replay: true,
    playbackFallback: true,
    focusTrap: true,
    escape: true,
    focusRestore: true,
  };
})();
