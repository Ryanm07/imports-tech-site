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
  learning?: string;
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
  learning?: string;
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
    description: "Eu testo iPhones, Galaxys e usados no cotidiano.",
  },
  {
    name: "Notebooks",
    icon: "02",
    description: "Eu acompanho máquinas novas e usadas no trabalho real.",
  },
  {
    name: "Consoles",
    icon: "03",
    description: "Eu comparo jogos, reparos e custo por diversão.",
  },
  {
    name: "Periféricos",
    icon: "04",
    description: "Eu testo acessórios úteis sem repetir marketing.",
  },
  {
    name: "Garimpos",
    icon: "05",
    description: "Eu mostro compra, negociação, risco e custo total.",
  },
  {
    name: "OLX",
    icon: "06",
    description: "Eu registro os garimpos que encontrei na OLX.",
    relation: "Subtema de Garimpos",
  },
  {
    name: "Reparos",
    icon: "07",
    description: "Eu documento defeito, peça, custo e resultado.",
  },
  {
    name: "Comparativos",
    icon: "08",
    description: "Eu coloco escolhas lado a lado e explico o contexto.",
  },
  {
    name: "Reviews",
    icon: "09",
    description: "Eu coloco a experiência de uso acima da ficha técnica.",
  },
];

export const reviews: Review[] = [
  {
    slug: "iphone-12-em-2026",
    name: "iPhone 12 em 2026",
    manufacturer: "Apple",
    category: "Smartphones",
    summary:
      "Eu usei um iPhone 12 comprado usado e registrei a bateria, o reparo e o que aconteceu no pós-venda.",
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
    learning:
      "Eu aprendi que o resultado de uma venda não termina quando o aparelho muda de dono; o pós-venda também faz parte da história.",
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
      "Eu testei um S21 Ultra reparado e documentei as limitações reais da tela substituta e da bateria.",
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
    learning:
      "Eu confirmei que um reparo pode recuperar o aparelho sem devolver toda a experiência original.",
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
      "Eu comprei um MacBook Air M1 com caixa e bateria em 90% e avaliei o aparelho no uso cotidiano.",
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
    learning:
      "Eu percebi que condição, bateria e armazenamento pesam tanto quanto o chip na compra de um notebook usado.",
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
    announcedProblem:
      "Eu encontrei o vidro traseiro danificado e a bateria em 76%.",
    repairCost: 22,
    totalCost: 680,
    salePrice: 1100,
    reimbursement: 220,
    result: "Vendido, com ocorrência pós-venda registrada",
    currentStatus: "Vendido",
    learning:
      "Eu aprendi que preciso acompanhar também o que acontece depois da venda.",
    videoId: "i4LXDsWlc8Q",
    tags: ["Smartphones", "Garimpos", "Reparos"],
    updatedAt: "2026-07-14",
    timeline: [
      {
        label: "Compra",
        detail: "Eu paguei R$ 658,36 no aparelho.",
        state: "done",
      },
      {
        label: "Reparo",
        detail: "Eu gastei aproximadamente R$ 22 no vidro traseiro.",
        state: "done",
      },
      {
        label: "Custo total",
        detail: "Meu custo total ficou em aproximadamente R$ 680.",
        state: "done",
      },
      { label: "Venda", detail: "Eu vendi por R$ 1.100.", state: "done" },
      {
        label: "Pós-venda",
        detail: "Eu registrei um reembolso posterior de R$ 220.",
        state: "done",
      },
    ],
  },
  {
    slug: "galaxy-s21-ultra-olx-502-89",
    product: "Galaxy S21 Ultra da OLX",
    announcedPrice: null,
    negotiatedPrice: 502.89,
    announcedProblem: "Eu comprei o aparelho sem tela funcional.",
    repairCost: 408,
    totalCost: 910.89,
    salePrice: null,
    reimbursement: null,
    result: "Recuperado com limitações documentadas",
    currentStatus: "Resultado publicado",
    learning:
      "Eu aprendi a separar aparelho recuperado de aparelho realmente restaurado às condições originais.",
    videoId: "ScBB5TZ-Py8",
    tags: ["Smartphones", "Garimpos", "OLX", "Reparos"],
    updatedAt: "2026-07-14",
    timeline: [
      { label: "Compra na OLX", detail: "Eu paguei R$ 502,89.", state: "done" },
      { label: "Tela e frame", detail: "Eu gastei R$ 408.", state: "done" },
      {
        label: "Custo total",
        detail: "Meu custo total ficou em aproximadamente R$ 910,89.",
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
    announcedProblem:
      "Eu verifiquei a condição e a configuração durante a compra.",
    repairCost: null,
    totalCost: 1247.99,
    salePrice: null,
    reimbursement: null,
    result: "Configuração e preço final catalogados",
    currentStatus: "História publicada",
    learning:
      "Eu percebi que mostrar a configuração e o preço dentro de uma história real aproxima muito mais do que apenas listar especificações.",
    videoId: "Y1nStLptXY0",
    tags: ["Notebooks", "Garimpos"],
    updatedAt: "2026-07-14",
    timeline: [
      { label: "Preço final", detail: "Eu paguei R$ 1.247,99.", state: "done" },
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

export function money(value: number | null) {
  return value === null
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
}
