/* Start at /sobre#% and run through agent-browser eval --stdin.
 * Public URL fragments must never crash the story. Valid chapter links must
 * still navigate after malformed percent escapes or malformed UTF-8.
 */
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  await wait(500);
  check(
    document.querySelectorAll(".story-chapter").length === 13,
    "Malformed initial hash crashed the story",
  );
  for (const hash of ["#%E0%A4%A", "#%FF", "#%2"]) {
    location.hash = hash;
    await wait(150);
    check(
      document.querySelectorAll(".story-chapter").length === 13,
      `Malformed hash ${hash} crashed the story`,
    );
  }
  location.hash = "#iphone-xr";
  await wait(600);
  check(
    document.querySelector(".story-chapter.is-active")?.id === "iphone-xr",
    "Valid chapter hash stopped navigating after an invalid fragment",
  );
  location.hash = "#%69phone-xr";
  await wait(600);
  check(
    document.querySelector(".story-chapter.is-active")?.id === "iphone-xr",
    "Percent-encoded valid chapter stopped navigating",
  );
  return {
    malformedInitial: true,
    malformedChanges: 3,
    validChapter: true,
    encodedChapter: true,
  };
})();
