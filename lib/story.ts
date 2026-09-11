export const STORY_VISUAL_PRESETS = [
  "origin",
  "identity-transform",
  "first-recording",
  "equipment-build",
  "first-signal",
  "unexpected-discovery",
  "pattern-discovery",
  "mechanical-switch",
  "massive-number",
  "heavy-processing",
  "production-line",
  "time-balance",
  "future-target",
] as const;

export type StoryVisualPreset = (typeof STORY_VISUAL_PRESETS)[number];
export const STORY_ACCENTS = [
  "warm",
  "blue",
  "red",
  "gold",
  "violet",
  "cyan",
  "green",
  "amber",
] as const;
export type StoryAccent = (typeof STORY_ACCENTS)[number];
export type StoryFallbackMode = "abstract" | "asset" | "minimal";

export type StoryMilestone = {
  slug: string;
  dateLabel: string;
  datePrecision: "exact" | "approximate";
  title: string;
  description: string;
  imageUrl: string | null;
  number: string | null;
  relatedProject: string | null;
  youtubeUrl: string | null;
  position: number;
  visualType?: StoryVisualPreset;
  visualAsset?: string | null;
  accentValue?: StoryAccent | null;
  primaryMetric?: string | null;
  secondaryMetric?: string | null;
  motionVariant?: StoryVisualPreset | null;
  visualDescription?: string | null;
  fallbackMode?: StoryFallbackMode;
};

// Every fallback below is based only on facts confirmed by Ryan in the brief.
// Published D1 entries with the same slug can replace them; archived entries
// act as tombstones. Draft and review states never reach the public site.
const storyMilestoneBase: StoryMilestone[] = [
  {
    slug: "comeco-setembro-2025",
    dateLabel: "Setembro de 2025",
    datePrecision: "exact",
    title: "Eu comecei para enfrentar a timidez",
    description:
      "Quando criei o canal, eu nem imaginava que ele poderia dar certo. Eu só queria falar melhor e enfrentar a timidez. Nos primeiros vídeos, eu falava baixo, me enrolava e tinha pouca confiança. Hoje, olhar para eles é como voltar ao ponto de partida e enxergar o quanto eu mudei.",
    imageUrl: null,
    number: null,
    relatedProject: null,
    youtubeUrl: null,
    position: 1,
  },
  {
    slug: "r-import-imports-tech",
    dateLabel: "Antes do formato atual",
    datePrecision: "approximate",
    title: "Eu testei uma primeira identidade",
    description:
      "Antes do canal ter o formato de hoje, eu tentei fazer uma renda extra importando e revendendo mouses e teclados. O primeiro nome foi R Import. Logo percebi que ele era genérico e me prendia demais, então juntei importações e tecnologia e cheguei a Imports Tech. E eu ainda deixo espaço para esse nome evoluir junto comigo.",
    imageUrl: null,
    number: "R Import → Imports Tech",
    relatedProject: null,
    youtubeUrl: null,
    position: 2,
  },
  {
    slug: "primeiro-video",
    dateLabel: "2025",
    datePrecision: "approximate",
    title: "Eu publiquei o primeiro vídeo",
    description:
      "Meu primeiro vídeo foi sobre um teclado que eu tinha comprado para usar. O produto era quase uma desculpa: o que eu queria mesmo era praticar a fala. Editei no Microsoft Clipchamp e, naquela época, achava que muitos cortes tirariam o realismo. Deixei o vídeo no ar porque ele mostra exatamente de onde eu parti.",
    imageUrl: null,
    number: "1º vídeo",
    relatedProject: null,
    youtubeUrl: null,
    position: 3,
  },
  {
    slug: "primeiros-equipamentos",
    dateLabel: "Primeiros meses",
    datePrecision: "approximate",
    title: "Eu aprendi com o que já tinha",
    description:
      "Eu comecei gravando com o Galaxy S23 e, depois de uns três vídeos, passei para o Galaxy S21 FE. Como eu ainda não tinha microfone, deixava o celular bem perto da boca para pegar o áudio. Meu PC levou de três a quatro anos de trabalho para ficar pronto: Ryzen 5 5500, RTX 3060 e 16 GB de memória naquela época. E, no começo, eu nem tinha iluminação.",
    imageUrl: null,
    number: "3–4 anos para montar o PC",
    relatedProject: null,
    youtubeUrl: null,
    position: 4,
  },
  {
    slug: "primeiro-investimento",
    dateLabel: "Primeiros meses",
    datePrecision: "approximate",
    title: "Eu fiz o primeiro investimento",
    description:
      "Eu coloquei cerca de R$ 300 em um tripé e algumas luzes. Fiquei muito feliz quando vi a gravação melhorar, mas também bateu a preocupação: eu ainda não sabia se algum dia teria retorno. A maioria dos reviews ficava entre 100 e 500 visualizações; alguns chegavam a 2 mil ou 5 mil. Quando o vídeo do GameSir X5 Lite bateu cerca de 6 mil, eu ganhei o empurrão que precisava para continuar.",
    imageUrl: null,
    number: "≈ R$ 300",
    relatedProject: null,
    youtubeUrl: null,
    position: 5,
  },
  {
    slug: "iphone-x-historias",
    dateLabel: "Depois dos primeiros reviews",
    datePrecision: "approximate",
    title: "Eu percebi que a história completa importava",
    description:
      "Eu comprei um iPhone X na OLX para consertar e revender. Gravei o unboxing só para praticar e nem pensava em publicar. Mesmo com uma edição simples, o vídeo alcançou milhares de visualizações. Foi aí que eu entendi: anúncio, preço, estado, problema, reparo, testes e resultado juntos contam uma história muito mais interessante do que uma ficha técnica solta.",
    imageUrl: null,
    number: null,
    relatedProject: null,
    youtubeUrl: null,
    position: 6,
  },
  {
    slug: "iphone-xr",
    dateLabel: "Cerca de 7 meses depois",
    datePrecision: "approximate",
    title: "Eu encontrei um formato que conectava",
    description:
      "Quando publiquei o projeto do iPhone XR, o canal ainda tinha menos de mil inscritos. O vídeo chegou a cerca de 50 mil visualizações naquele período e trouxe aproximadamente 300 inscritos. Ali eu vi um padrão com clareza: quem assistia queria acompanhar o caminho inteiro, não só o resultado.",
    imageUrl: null,
    number: "≈ 50 mil visualizações",
    relatedProject: null,
    youtubeUrl: null,
    position: 7,
  },
  {
    slug: "mil-inscritos",
    dateLabel: "4 de junho de 2026",
    datePrecision: "exact",
    title: "Eu vi o canal chegar a mil inscritos",
    description:
      "Eu passei o dia correndo entre roteiros, edição, academia e faculdade. Quando cheguei em casa, o canal estava com 999 inscritos. Fiquei olhando até o número virar mil e tirei uma foto. Depois de tantos meses, a monetização foi o primeiro retorno concreto de todo aquele esforço.",
    imageUrl: null,
    number: "1.000 inscritos",
    relatedProject: null,
    youtubeUrl: null,
    position: 8,
  },
  {
    slug: "acer-nitro-5",
    dateLabel: "Pouco depois",
    datePrecision: "approximate",
    title: "Eu passei a acreditar de verdade",
    description:
      "Pouco depois, o vídeo do Acer Nitro 5 passou de 200 mil visualizações. Foi quando a frase na minha cabeça mudou de ‘Este canal pode dar certo’ para ‘Este canal vai dar certo’.",
    imageUrl: null,
    number: "> 200 mil visualizações",
    relatedProject: "acer-nitro-5-an515-54",
    youtubeUrl: null,
    position: 9,
  },
  {
    slug: "dell-g7",
    dateLabel: "2026",
    datePrecision: "approximate",
    title: "Eu encarei o projeto mais difícil até aqui",
    description:
      "O Dell G7 foi o projeto mais difícil que eu produzi até agora. Era o primeiro notebook que eu abria, e precisei desmontar tudo várias vezes. Gravei em 4K, meu PC sofreu para editar e os arquivos proxy ocuparam cerca de 500 GB. Só na edição, eu passei aproximadamente dois dias.",
    imageUrl: null,
    number: "≈ 500 GB de proxies",
    relatedProject: null,
    youtubeUrl: null,
    position: 10,
  },
  {
    slug: "processo-atual",
    dateLabel: "Hoje",
    datePrecision: "exact",
    title: "Hoje eu produzo cada história com calma",
    description:
      "Normalmente, eu tenho dois ou três vídeos gravados na fila de edição. Às vezes, quando um unboxing finalmente vai ao ar, o aparelho já foi vendido e eu já estou envolvido em outro projeto. Cada vídeo leva cerca de 12 horas entre planejamento, testes, gravação, organização, edição, música, efeitos, thumbnail, título, descrição, revisão e publicação. Só a edição costuma levar oito horas; uma hora gravada vira de 10 a 15 minutos no resultado final.",
    imageUrl: null,
    number: "≈ 12 horas por vídeo",
    relatedProject: null,
    youtubeUrl: null,
    position: 11,
  },
  {
    slug: "falta-de-tempo",
    dateLabel: "Hoje",
    datePrecision: "exact",
    title: "Hoje eu tento equilibrar o canal com o resto da rotina",
    description:
      "Hoje, minha maior dificuldade é equilibrar o canal com trabalhos, responsabilidades, faculdade, academia e descanso. Tem semana em que a academia quase vira meu único momento para respirar.",
    imageUrl: null,
    number: null,
    relatedProject: null,
    youtubeUrl: null,
    position: 12,
  },
  {
    slug: "meta-2027",
    dateLabel: "Até o fim de 2027",
    datePrecision: "exact",
    title: "Minha meta é chegar a 100 mil inscritos",
    description:
      "Depois do iPhone XR, eu parei de pensar seriamente em desistir. Minha meta é chegar a 100 mil inscritos até o fim de 2027 e, mais adiante, construir uma das maiores comunidades de tecnologia do Brasil.",
    imageUrl: null,
    number: "100 mil inscritos",
    relatedProject: null,
    youtubeUrl: null,
    position: 13,
  },
];

const storyVisualDefaults: Record<
  string,
  Pick<
    StoryMilestone,
    | "visualType"
    | "accentValue"
    | "primaryMetric"
    | "secondaryMetric"
    | "visualDescription"
  >
> = {
  "comeco-setembro-2025": {
    visualType: "origin",
    accentValue: "warm",
    primaryMetric: "SET 2025",
    secondaryMetric: "O primeiro sinal",
    visualDescription: "Eu começo como um sinal pequeno que ganha voz.",
  },
  "r-import-imports-tech": {
    visualType: "identity-transform",
    accentValue: "blue",
    primaryMetric: "R IMPORT",
    secondaryMetric: "IMPORTS TECH",
    visualDescription: "Eu reorganizo a primeira ideia até encontrar meu nome.",
  },
  "primeiro-video": {
    visualType: "first-recording",
    accentValue: "red",
    primaryMetric: "1º vídeo",
    secondaryMetric: "Microsoft Clipchamp",
    visualDescription: "Eu gravo, hesito e começo a aprender a cortar.",
  },
  "primeiros-equipamentos": {
    visualType: "equipment-build",
    accentValue: "blue",
    primaryMetric: "3–4 anos",
    secondaryMetric: "Galaxy S23 → S21 FE",
    visualDescription: "Eu monto a estrutura com o que já tenho.",
  },
  "primeiro-investimento": {
    visualType: "first-signal",
    accentValue: "gold",
    primaryMetric: "≈ 6 mil",
    secondaryMetric: "≈ R$ 300",
    visualDescription: "Eu vejo o primeiro sinal atravessar a incerteza.",
  },
  "iphone-x-historias": {
    visualType: "unexpected-discovery",
    accentValue: "violet",
    primaryMetric: "Não seria publicado",
    secondaryMetric: "Um caminho inesperado",
    visualDescription: "Eu abro uma história que muda a direção do canal.",
  },
  "iphone-xr": {
    visualType: "pattern-discovery",
    accentValue: "cyan",
    primaryMetric: "≈ 50 mil",
    secondaryMetric: "≈ 300 inscritos",
    visualDescription: "Eu conecto os pontos e reconheço um formato.",
  },
  "mil-inscritos": {
    visualType: "mechanical-switch",
    accentValue: "green",
    primaryMetric: "999 → 1.000",
    secondaryMetric: "4 JUN 2026",
    visualDescription: "Eu acompanho o contador atravessar um marco exato.",
  },
  "acer-nitro-5": {
    visualType: "massive-number",
    accentValue: "red",
    primaryMetric: "> 200 mil",
    secondaryMetric: "Pode → vai dar certo",
    visualDescription: "Eu vejo um número grande mudar minha convicção.",
  },
  "dell-g7": {
    visualType: "heavy-processing",
    accentValue: "amber",
    primaryMetric: "≈ 500 GB",
    secondaryMetric: "≈ 2 dias",
    visualDescription: "Eu atravesso camadas pesadas de gravação e edição.",
  },
  "processo-atual": {
    visualType: "production-line",
    accentValue: "blue",
    primaryMetric: "≈ 12h",
    secondaryMetric: "1h → 10–15 min",
    visualDescription: "Eu transformo material bruto em uma história concisa.",
  },
  "falta-de-tempo": {
    visualType: "time-balance",
    accentValue: "violet",
    primaryMetric: "Pouco espaço",
    secondaryMetric: "Canal · rotina · descanso",
    visualDescription:
      "Eu tento abrir espaço entre canal, trabalho, faculdade, academia e descanso.",
  },
  "meta-2027": {
    visualType: "future-target",
    accentValue: "gold",
    primaryMetric: "Meta: 100 mil",
    secondaryMetric: "Fim de 2027",
    visualDescription:
      "Eu sigo por uma linha aberta até uma meta ainda à frente.",
  },
};

export function storyVisualTypeForSlug(slug: string): StoryVisualPreset {
  return storyVisualDefaults[slug]?.visualType || "origin";
}

export const storyMilestones: StoryMilestone[] = storyMilestoneBase.map(
  (milestone) => ({
    ...milestone,
    ...storyVisualDefaults[milestone.slug],
    visualAsset: milestone.imageUrl,
    motionVariant: storyVisualDefaults[milestone.slug]?.visualType || "origin",
    fallbackMode: "abstract",
  }),
);
