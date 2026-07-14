export const VIDEO_CATEGORIES = [
  "Smartphones",
  "Notebooks",
  "Consoles",
  "Periféricos",
  "Garimpos",
  "OLX",
  "Reparos",
  "Comparativos",
  "Reviews",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

const editorialMap: Record<
  string,
  { category: VideoCategory; tags: VideoCategory[] }
> = {
  fnD2R4YoJ8k: { category: "Smartphones", tags: ["Smartphones", "Reviews"] },
  i4LXDsWlc8Q: {
    category: "Garimpos",
    tags: ["Garimpos", "Smartphones", "Reparos"],
  },
  biatbb6rvwU: { category: "Smartphones", tags: ["Smartphones", "Reviews"] },
  cbodYFxeINo: {
    category: "Notebooks",
    tags: ["Notebooks", "Garimpos", "Reviews"],
  },
  "ScBB5TZ-Py8": {
    category: "Garimpos",
    tags: ["Garimpos", "OLX", "Smartphones", "Reparos"],
  },
  Y1nStLptXY0: {
    category: "Notebooks",
    tags: ["Notebooks", "Garimpos", "Reviews"],
  },
  "4gf5vtyihyU": {
    category: "Notebooks",
    tags: ["Notebooks", "Garimpos"],
  },
  "WMQfOCaop-w": {
    category: "Periféricos",
    tags: ["Periféricos", "Garimpos"],
  },
  UtcI5DhUlaQ: { category: "Smartphones", tags: ["Smartphones", "Reviews"] },
  Omm5Leo1WMM: {
    category: "Garimpos",
    tags: ["Garimpos", "Smartphones", "Reparos"],
  },
};

export function classifyVideo(title: string, id?: string) {
  if (id && editorialMap[id]) return editorialMap[id];
  const normalized = normalize(title);
  const tags = new Set<VideoCategory>();

  if (/\b(vs|versus)\b|comparativ/.test(normalized)) tags.add("Comparativos");
  if (
    /reparei|reparo|conserto|troquei|tela quebrada|defeito/.test(normalized)
  ) {
    tags.add("Reparos");
  }
  if (/notebook|macbook|acer|nitro|laptop|pc gamer/.test(normalized)) {
    tags.add("Notebooks");
  }
  if (/iphone|galaxy|samsung|celular|smartphone|\bs\d{2}\b/.test(normalized)) {
    tags.add("Smartphones");
  }
  if (/playstation|xbox|nintendo|console|ps[345]/.test(normalized)) {
    tags.add("Consoles");
  }
  if (/fone|headset|mouse|teclado|periferic|lucky box/.test(normalized)) {
    tags.add("Periféricos");
  }
  if (/\bolx\b/.test(normalized)) {
    tags.add("OLX");
    tags.add("Garimpos");
  }
  if (/comprei|paguei|garimpo|barato|r\$|lucky box/.test(normalized)) {
    tags.add("Garimpos");
  }
  if (/review|vale a pena|usei|teste/.test(normalized)) tags.add("Reviews");

  const priority: VideoCategory[] = [
    "Comparativos",
    "Reparos",
    "Notebooks",
    "Smartphones",
    "Consoles",
    "Periféricos",
    "Garimpos",
    "Reviews",
  ];
  const category = priority.find((item) => tags.has(item)) || "Reviews";
  tags.add(category);
  return { category, tags: [...tags] };
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
