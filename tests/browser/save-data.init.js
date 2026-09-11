// Pass with agent-browser --init-script before navigating to test first visits with data saving enabled.
if (navigator.connection) {
  Object.defineProperty(navigator.connection, "saveData", {
    value: true,
    configurable: true,
  });
}
try {
  sessionStorage.removeItem("imports-tech:intro:v3");
} catch {
  // The first about:blank document may not allow session storage.
}
