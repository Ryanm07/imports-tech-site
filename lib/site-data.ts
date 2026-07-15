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
  totalCost: number | null;
  verdict: Verdict | null;
  positives: string[];
  negatives: string[];
  scores: {
    performance: number;
    battery: number;
    camera?: number;
    build: number;
    value: number;
  } | null;
  status: string;
  facts: string[];
  updatedAt: string;
  videoId: string;
  imageUrl?: string | null;
};

export type Find = {
  slug: string;
  product: string;
  announcedPrice: number | null;
  negotiatedPrice: number;
  announcedProblem: string;
  repairCost: number | null;
  totalCost: number | null;
  salePrice: number | null;
  reimbursement: number | null;
  result: string;
  currentStatus: string;
  videoId: string;
  imageUrl?: string | null;
  tags: string[];
  updatedAt: string;
  timeline: { label: string; detail: string; state: "done" | "pending" }[];
};

export type Category = {
  name: string;
  icon: string;
  description: string;
  relation?: string;
};

export const categories: Category[] = [
  {
    name: "Smartphones",
    icon: "01",
    description: "iPhone, Galaxy e usados que ainda entregam.",
  },
  {
    name: "Notebooks",
    icon: "02",
    description: "Máquinas novas e usadas no trabalho real.",
  },
  {
    name: "Consoles",
    icon: "03",
    description: "Jogos, reparos e custo por diversão.",
  },
  {
    name: "Periféricos",
    icon: "04",
    description: "Acessórios úteis, sem marketing vazio.",
  },
  {
    name: "Garimpos",
    icon: "05",
    description: "Compras de risco, negociação e custo total.",
  },
  {
    name: "OLX",
    icon: "06",
    description: "Garimpos cuja origem foi a OLX.",
    relation: "Subtema de Garimpos",
  },
  {
    name: "Reparos",
    icon: "07",
    description: "Defeito, peça, custo e resultado.",
  },
  {
    name: "Comparativos",
    icon: "08",
    description: "Escolhas lado a lado, com contexto.",
  },
  {
    name: "Reviews",
    icon: "09",
    description: "Experiência de uso acima da ficha técnica.",
  },
];

export const reviews: Review[] = [
  {
    slug: "iphone-12-em-2026",
    name: "iPhone 12 em 2026",
    manufacturer: "Apple",
    category: "Smartphones",
    summary:
      "Uso real de um iPhone 12 comprado usado, incluindo bateria, reparo e histórico pós-venda.",
    testedAt: "2026-07-10",
    pricePaid: 658.36,
    marketPrice: null,
    repairCost: 22,
    totalCost: 680,
    verdict: null,
    positives: ["Desempenho ainda competente", "Construção premium"],
    negatives: ["Bateria com 76% de saúde", "Ocorrência pós-venda registrada"],
    scores: null,
    status: "Vendido por R$ 1.100; houve reembolso posterior de R$ 220.",
    facts: [
      "Vidro traseiro: aproximadamente R$ 22",
      "Custo total aproximado: R$ 680",
      "Saúde da bateria durante o teste: 76%",
    ],
    updatedAt: "2026-07-14",
    videoId: "fnD2R4YoJ8k",
  },
  {
    slug: "galaxy-s21-ultra-em-2026",
    name: "Galaxy S21 Ultra em 2026",
    manufacturer: "Samsung",
    category: "Smartphones",
    summary:
      "Review de uso do S21 Ultra reparado, com as limitações reais da tela substituta e da bateria.",
    testedAt: "2026-06-30",
    pricePaid: 502.89,
    marketPrice: null,
    repairCost: 408,
    totalCost: 910.89,
    verdict: null,
    positives: ["Conjunto de câmeras versátil", "Desempenho forte"],
    negatives: [
      "Tela substituta com bordas maiores",
      "Leitor digital menos consistente",
      "Aquecimento",
      "Perda aproximada de 30% de bateria durante a noite",
    ],
    scores: null,
    status:
      "Review publicada; o vídeo de garimpo permanece relacionado separadamente.",
    facts: [
      "Tela e frame: R$ 408",
      "Custo total conhecido: aproximadamente R$ 910,89",
    ],
    updatedAt: "2026-07-14",
    videoId: "biatbb6rvwU",
  },
  {
    slug: "macbook-air-m1-usado",
    name: "MacBook Air M1 usado",
    manufacturer: "Apple",
    category: "Notebooks",
    summary:
      "MacBook Air M1 comprado com caixa e bateria em 90%, avaliado pelo uso cotidiano.",
    testedAt: "2026-06-23",
    pricePaid: 2567,
    marketPrice: null,
    repairCost: null,
    totalCost: 2567,
    verdict: null,
    positives: ["Bateria em 90%", "Acompanhado da caixa"],
    negatives: ["Upgrade de armazenamento não é possível"],
    scores: null,
    status: "Configuração confirmada: 256 GB.",
    facts: ["Apple M1", "256 GB", "Saúde da bateria: 90%", "Com caixa"],
    updatedAt: "2026-07-14",
    videoId: "cbodYFxeINo",
  },
];

export const finds: Find[] = [
  {
    slug: "iphone-12-por-658-36",
    product: "iPhone 12 por R$ 658,36",
    announcedPrice: null,
    negotiatedPrice: 658.36,
    announcedProblem: "Vidro traseiro danificado e bateria em 76%.",
    repairCost: 22,
    totalCost: 680,
    salePrice: 1100,
    reimbursement: 220,
    result: "Vendido, com ocorrência pós-venda registrada",
    currentStatus: "Vendido",
    videoId: "i4LXDsWlc8Q",
    tags: ["Smartphones", "Garimpos", "Reparos"],
    updatedAt: "2026-07-14",
    timeline: [
      {
        label: "Compra",
        detail: "R$ 658,36 pagos no aparelho.",
        state: "done",
      },
      {
        label: "Reparo",
        detail: "Vidro traseiro: aproximadamente R$ 22.",
        state: "done",
      },
      {
        label: "Custo total",
        detail: "Aproximadamente R$ 680.",
        state: "done",
      },
      { label: "Venda", detail: "Vendido por R$ 1.100.", state: "done" },
      {
        label: "Pós-venda",
        detail: "Reembolso posterior de R$ 220 registrado.",
        state: "done",
      },
    ],
  },
  {
    slug: "galaxy-s21-ultra-olx-502-89",
    product: "Galaxy S21 Ultra da OLX",
    announcedPrice: null,
    negotiatedPrice: 502.89,
    announcedProblem: "Aparelho comprado sem tela funcional.",
    repairCost: 408,
    totalCost: 910.89,
    salePrice: null,
    reimbursement: null,
    result: "Recuperado com limitações documentadas",
    currentStatus: "Resultado publicado",
    videoId: "ScBB5TZ-Py8",
    tags: ["Smartphones", "Garimpos", "OLX", "Reparos"],
    updatedAt: "2026-07-14",
    timeline: [
      { label: "Compra na OLX", detail: "R$ 502,89.", state: "done" },
      { label: "Tela e frame", detail: "R$ 408.", state: "done" },
      {
        label: "Custo total",
        detail: "Aproximadamente R$ 910,89.",
        state: "done",
      },
      {
        label: "Limitações",
        detail:
          "Bordas maiores, leitor digital menos consistente, aquecimento e perda noturna de bateria.",
        state: "done",
      },
    ],
  },
  {
    slug: "acer-nitro-5-an515-54",
    product: "Acer Nitro 5 AN515-54",
    announcedPrice: null,
    negotiatedPrice: 1247.99,
    announcedProblem: "Condição e configuração verificadas durante a compra.",
    repairCost: null,
    totalCost: 1247.99,
    salePrice: null,
    reimbursement: null,
    result: "Configuração e preço final catalogados",
    currentStatus: "História publicada",
    videoId: "Y1nStLptXY0",
    tags: ["Notebooks", "Garimpos"],
    updatedAt: "2026-07-14",
    timeline: [
      { label: "Preço final", detail: "R$ 1.247,99.", state: "done" },
      { label: "Modelo", detail: "Acer Nitro 5 AN515-54.", state: "done" },
      { label: "GPU", detail: "NVIDIA GeForce GTX 1650.", state: "done" },
      { label: "Memória", detail: "8 GB.", state: "done" },
      {
        label: "Armazenamento",
        detail: "SSD de 128 GB e HDD de 1 TB.",
        state: "done",
      },
    ],
  },
];

export const communityCategories = [
  "Celulares",
  "Notebooks",
  "Consoles",
  "Periféricos",
  "Garimpos e OLX",
  "Ajuda técnica",
  "Sugestões de vídeo",
  "Assuntos gerais",
];

export function money(value: number | null) {
  return value === null
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
}
