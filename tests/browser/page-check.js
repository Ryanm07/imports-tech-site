/* Browser integration checks. Used by public-routes.ps1 against the running site.
 * Catches clipped layouts, missing content/assets, broken navigation semantics,
 * and mobile menus that lose focus or fail to close. It does not send messages.
 */
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const failures = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };
  await document.fonts.ready;
  await wait(200);
  check(
    Array.from(document.fonts).some(
      (font) =>
        font.family.replaceAll('"', "") === "Geist" && font.status === "loaded",
    ),
    "The main typeface did not load",
  );
  check(
    document.querySelectorAll("main h1").length === 1,
    "Page must have one main heading",
  );
  check(
    Boolean(document.querySelector("main#conteudo")),
    "Skip link target is missing",
  );
  check(
    Boolean(document.querySelector('link[rel="canonical"]')?.href),
    "Canonical is missing",
  );
  check(
    !document.querySelector(".site-intro"),
    "Seen session is blocked by intro",
  );
  check(
    !document.querySelector(
      "vite-error-overlay, nextjs-portal [role='dialog']",
    ),
    "Development error overlay is present",
  );

  // Scroll through actual content so native lazy images and reveals run.
  for (
    let top = 0;
    top < document.documentElement.scrollHeight;
    top += innerHeight * 0.8
  ) {
    window.scrollTo({ top, behavior: "instant" });
    await wait(60);
  }
  await wait(300);
  const brokenImages = Array.from(document.images)
    .filter((image) => image.complete && image.naturalWidth === 0)
    .map((image) => image.getAttribute("src"));
  const missingAlts = Array.from(document.images)
    .filter((image) => !image.hasAttribute("alt"))
    .map((image) => image.getAttribute("src"));
  check(brokenImages.length === 0, `Broken images: ${brokenImages.join(", ")}`);
  check(
    missingAlts.length === 0,
    `Missing alt attributes: ${missingAlts.join(", ")}`,
  );
  check(
    document.documentElement.scrollWidth <= innerWidth + 1,
    "Horizontal overflow",
  );
  const invalidLinks = Array.from(document.querySelectorAll("a[href]"))
    .filter((link) =>
      /^(?:javascript:|#$|$)/i.test(link.getAttribute("href") || ""),
    )
    .map((link) => link.textContent.trim());
  check(invalidLinks.length === 0, `Invalid links: ${invalidLinks.join(", ")}`);
  const links = Array.from(document.querySelectorAll("a[href]"));
  const unnamedLinks = links.filter((link) => {
    const labelledBy = (link.getAttribute("aria-labelledby") || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || "")
      .join(" ");
    return ![
      link.getAttribute("aria-label"),
      labelledBy,
      link.textContent,
      ...Array.from(link.querySelectorAll("img")).map((image) => image.alt),
      link.getAttribute("title"),
    ].some((value) => value?.trim());
  });
  check(
    unnamedLinks.length === 0,
    `Links without names: ${unnamedLinks.map((link) => link.href).join(", ")}`,
  );
  const localDestinations = [
    ...new Set(
      links.flatMap((link) => {
        const destination = new URL(link.href);
        return destination.origin === location.origin
          ? [`${destination.pathname}${destination.hash}`]
          : [];
      }),
    ),
  ];
  window.scrollTo({ top: 0, behavior: "instant" });
  await wait(100);

  const trigger = document.querySelector(".menu-trigger");
  const menu = document.querySelector("#main-navigation");
  let menuChecked = false;
  if (trigger && getComputedStyle(trigger).display !== "none") {
    menuChecked = true;
    const bounds = trigger.getBoundingClientRect();
    check(
      bounds.width >= 44 && bounds.height >= 44,
      "Mobile menu target is smaller than 44px",
    );
    trigger.click();
    await wait(100);
    check(
      trigger.getAttribute("aria-expanded") === "true",
      "Menu did not open",
    );
    check(
      menu?.contains(document.activeElement),
      "Opening menu did not focus navigation",
    );
    const smallTargets = Array.from(menu.querySelectorAll("a"))
      .filter((link) => link.getBoundingClientRect().height < 44)
      .map((link) => link.textContent.trim());
    check(
      smallTargets.length === 0,
      `Small menu targets: ${smallTargets.join(", ")}`,
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await wait(50);
    check(
      trigger.getAttribute("aria-expanded") === "false",
      "Escape did not close menu",
    );
    check(
      document.activeElement === trigger,
      "Escape did not restore menu trigger focus",
    );
    trigger.click();
    await wait(80);
    document
      .querySelector("main")
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await wait(50);
    check(
      trigger.getAttribute("aria-expanded") === "false",
      "Outside pointer did not close menu",
    );
    trigger.click();
    await wait(80);
    const mainLink = Array.from(document.querySelectorAll("main a[href]")).find(
      (link) =>
        link.checkVisibility() && link.getBoundingClientRect().width > 0,
    );
    if (mainLink) {
      mainLink.focus();
      await wait(50);
      check(
        trigger.getAttribute("aria-expanded") === "false",
        "Moving focus outside left menu open",
      );
    } else {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    }
    const currentLink = menu.querySelector('[aria-current="page"]');
    if (currentLink) {
      trigger.click();
      await wait(80);
      currentLink.click();
      await wait(80);
      check(
        trigger.getAttribute("aria-expanded") === "false",
        "Selecting the current page left menu open",
      );
    }
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  return {
    path: location.pathname,
    viewport: `${innerWidth}x${innerHeight}`,
    title: document.title,
    imageCount: document.images.length,
    linkCount: document.querySelectorAll("a[href]").length,
    localDestinations,
    menuChecked,
    failures,
  };
})();
