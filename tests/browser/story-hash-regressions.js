/* Execute em /sobre após navegar para os hashes pelo navegador.
 * A página usa âncoras nativas; não há decodificador ou capítulo ativo em JS.
 * Verifique também /sobre#%, /sobre#%FF, /sobre#iphone-xr e /sobre#mil-inscritos.
 */
(() => {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const main = document.querySelector("main");
  check(
    main?.innerText.includes("Por trás da bancada."),
    "História não renderizou",
  );
  check(
    document.querySelector("#mil-inscritos"),
    "Link dos mil inscritos perdeu o destino",
  );
  check(
    document.querySelector("#iphone-xr"),
    "Link antigo do iPhone XR perdeu o destino",
  );
  check(
    !document.querySelector(".story-timeline"),
    "Navegação antiga continua montada",
  );
  check(
    document.documentElement.scrollWidth <= window.innerWidth,
    "Overflow horizontal",
  );
  return {
    nativeAnchors: true,
    legacyChapters: false,
    horizontalOverflow: false,
  };
})();
