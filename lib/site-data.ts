export type Verdict = "Vale a pena" | "Depende do preço" | "Não recomendo";

export type Review = {
  slug: string;
  name: string;
  manufacturer: string;
  category: string;
  summary: string;
  testedAt: string;
  pricePaid: number | null;
  marketPrice: number | null;
  repairCost: number | null;
  verdict: Verdict;
  positives: string[];
  negatives: string[];
  scores: { performance: number; battery: number; camera?: number; build: number; value: number } | null;
  status: string;
  updatedAt: string;
  videoId: string;
};

export type Find = {
  slug: string;
  product: string;
  announcedPrice: number | null;
  negotiatedPrice: number;
  announcedProblem: string;
  repairCost: number | null;
  result: string;
  currentStatus: string;
  videoId: string;
  timeline: { label: string; detail: string; state: "done" | "pending" }[];
};

export const categories = [
  { name: "Smartphones", icon: "01", description: "iPhone, Galaxy e usados que ainda entregam." },
  { name: "Notebooks", icon: "02", description: "Máquinas novas e usadas no trabalho real." },
  { name: "Consoles", icon: "03", description: "Jogos, reparos e custo por diversão." },
  { name: "Periféricos", icon: "04", description: "Acessórios úteis, sem marketing vazio." },
  { name: "OLX", icon: "05", description: "Do anúncio ao diagnóstico final." },
  { name: "Reparos", icon: "06", description: "Defeito, peça, custo e resultado." },
  { name: "Comparativos", icon: "07", description: "Escolhas lado a lado, com contexto." },
  { name: "Reviews", icon: "08", description: "Experiência de uso acima da ficha técnica." },
] as const;

export const reviews: Review[] = [
  {
    slug: "iphone-12-em-2026",
    name: "iPhone 12 em 2026",
    manufacturer: "Apple",
    category: "Smartphones",
    summary: "Um aparelho antigo o bastante para custar menos, mas ainda atual para muita gente. O teste foca no uso real em 2026.",
    testedAt: "2026-07-10",
    pricePaid: 650,
    marketPrice: null,
    repairCost: null,
    verdict: "Depende do preço",
    positives: ["Desempenho ainda competente", "Construção premium", "Boa oferta de acessórios"],
    negatives: ["Bateria exige atenção em usados", "Preço varia muito conforme o estado"],
    scores: null,
    status: "Em acompanhamento após o teste",
    updatedAt: "2026-07-10",
    videoId: "fnD2R4YoJ8k",
  },
  {
    slug: "galaxy-s21-ultra-em-2026",
    name: "Galaxy S21 Ultra em 2026",
    manufacturer: "Samsung",
    category: "Smartphones",
    summary: "Um antigo topo de linha colocado novamente à prova para descobrir o que envelheceu e o que continua excelente.",
    testedAt: "2026-06-30",
    pricePaid: 502.89,
    marketPrice: null,
    repairCost: null,
    verdict: "Vale a pena",
    positives: ["Tela de alto nível", "Conjunto de câmeras versátil", "Desempenho forte"],
    negatives: ["Histórico do aparelho usado precisa ser verificado", "Reparo pode alterar o custo-benefício"],
    scores: null,
    status: "Resultado completo disponível no vídeo",
    updatedAt: "2026-06-30",
    videoId: "biatbb6rvwU",
  },
  {
    slug: "macbook-mais-vendido-do-brasil",
    name: "MacBook mais vendido do Brasil",
    manufacturer: "Apple",
    category: "Notebooks",
    summary: "Um MacBook de R$ 2.500 avaliado pelo que entrega no uso cotidiano, não apenas pela marca na tampa.",
    testedAt: "2026-06-23",
    pricePaid: 2500,
    marketPrice: null,
    repairCost: null,
    verdict: "Depende do preço",
    positives: ["Boa integração entre hardware e sistema", "Construção consistente"],
    negatives: ["Configuração precisa ser conferida antes da compra", "Upgrade limitado"],
    scores: null,
    status: "Avaliação editorial publicada",
    updatedAt: "2026-06-23",
    videoId: "cbodYFxeINo",
  },
];

export const finds: Find[] = [
  {
    slug: "iphone-12-por-650",
    product: "iPhone 12 por R$ 650",
    announcedPrice: null,
    negotiatedPrice: 650,
    announcedProblem: "Condição informada no anúncio — detalhes completos no vídeo.",
    repairCost: null,
    result: "Compra testada no uso real",
    currentStatus: "Em acompanhamento",
    videoId: "i4LXDsWlc8Q",
    timeline: [
      { label: "Anúncio encontrado", detail: "Oferta localizada e analisada antes da negociação.", state: "done" },
      { label: "Preço negociado", detail: "R$ 650 pagos no aparelho.", state: "done" },
      { label: "Testes iniciais", detail: "Funcionamento, bateria, câmeras e sinais de manutenção avaliados.", state: "done" },
      { label: "Reparo e peças", detail: "Dados editoriais aguardando confirmação para publicação.", state: "pending" },
      { label: "Situação atual", detail: "Acompanhamento pós-vídeo em andamento.", state: "pending" },
    ],
  },
  {
    slug: "galaxy-s21-ultra-olx-502",
    product: "Galaxy S21 Ultra da OLX",
    announcedPrice: null,
    negotiatedPrice: 502.89,
    announcedProblem: "Aparelho anunciado em condição de risco; o diagnóstico completo está no vídeo.",
    repairCost: null,
    result: "Aparelho recuperado e testado",
    currentStatus: "Resultado publicado",
    videoId: "ScBB5TZ-Py8",
    timeline: [
      { label: "Garimpo na OLX", detail: "Anúncio de um antigo topo de linha por R$ 502,89.", state: "done" },
      { label: "Risco avaliado", detail: "Preço, estado e possíveis defeitos considerados antes da compra.", state: "done" },
      { label: "Testes iniciais", detail: "Tela, câmeras, bateria e desempenho verificados.", state: "done" },
      { label: "Custo total", detail: "Aguardando consolidação editorial dos custos de peças e serviço.", state: "pending" },
      { label: "Resultado", detail: "História completa disponível no canal.", state: "done" },
    ],
  },
  {
    slug: "notebook-gamer-por-1200",
    product: "Notebook gamer por R$ 1.200",
    announcedPrice: null,
    negotiatedPrice: 1200,
    announcedProblem: "Condição e configuração verificadas durante a compra.",
    repairCost: null,
    result: "Compra avaliada em vídeo",
    currentStatus: "História publicada",
    videoId: "Y1nStLptXY0",
    timeline: [
      { label: "Anúncio encontrado", detail: "Notebook gamer usado encontrado por valor abaixo do mercado.", state: "done" },
      { label: "Preço pago", detail: "R$ 1.200 no total informado pelo vídeo.", state: "done" },
      { label: "Diagnóstico", detail: "Configuração, temperaturas e desempenho testados.", state: "done" },
      { label: "Reparos", detail: "Nenhum custo editorial confirmado nesta página.", state: "pending" },
      { label: "Veredito", detail: "Disponível na análise completa do canal.", state: "done" },
    ],
  },
];

export const communityCategories = ["Celulares", "Notebooks", "Consoles", "Periféricos", "Garimpos e OLX", "Ajuda técnica", "Sugestões de vídeo", "Assuntos gerais"];

export function money(value: number | null) {
  return value === null ? "Não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
