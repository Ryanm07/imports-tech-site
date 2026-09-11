export type StudioItemId =
  | "keyboard"
  | "mouse"
  | "laptop"
  | "recording-rig"
  | "phone"
  | "earbuds"
  | "headset"
  | "chair"
  | "story"
  | "milestone-1000"
  | "milestone-5000"
  | "monitor";

export type StudioItem = {
  id: StudioItemId;
  title: string;
  category: string;
  description: string;
  details: string[];
  videoId?: string;
  href?: string;
};

// Content stays independent of the room geometry so detailed models can replace
// the initial shapes without changing the navigation or editorial content.
export const STUDIO_ITEMS: StudioItem[] = [
  {
    id: "keyboard",
    title: "IROK MG75 Pro",
    category: "Primeiro vídeo",
    description: "O teclado que abriu o canal.",
    details: [
      "Comprei para usar e aproveitei para praticar diante da câmera. Foi o assunto do meu primeiro vídeo.",
    ],
    videoId: "xvl7g6X6OIQ",
  },
  {
    id: "mouse",
    title: "Attack Shark X11",
    category: "Periféricos",
    description: "Um dos mouses que passaram pela bancada.",
    details: [],
    videoId: "qsPBAY-UUf8",
  },
  {
    id: "laptop",
    title: "Acer Nitro 5",
    category: "Uma virada no canal",
    description: "O notebook preto e vermelho que marcou a trajetória.",
    details: [
      "O episódio passou de 200 mil visualizações. Foi um momento em que comecei a acreditar mais no caminho do canal.",
    ],
    // The exact model revision still needs to be checked before final modeling.
    videoId: "Y1nStLptXY0",
  },
  {
    id: "recording-rig",
    title: "Kit de gravação",
    category: "Bastidores",
    description: "Tripé, iluminação e o celular em posição de gravar.",
    details: [
      "É aqui que o Galaxy S25 Ultra se junta ao tripé e à ring bar para os registros da bancada.",
    ],
    videoId: "-dLf-zCO41A",
  },
  {
    id: "phone",
    title: "Galaxy S25 Ultra",
    category: "Gravação",
    description: "Meu celular, junto do kit de gravação.",
    details: [],
  },
  {
    id: "earbuds",
    title: "Buds 4 Pro",
    category: "Áudio",
    description: "Os fones que uso no dia a dia.",
    details: [],
    videoId: "Na9Ma69LPtA",
  },
  {
    id: "headset",
    title: "Headset",
    category: "Áudio",
    description: "O headset também tem seu lugar na bancada.",
    details: [],
    // Confirm the commercial spelling of the model before the detailed asset.
  },
  {
    id: "chair",
    title: "Cadeira ergonômica",
    category: "Meu espaço",
    description: "O lugar de gravar, editar e acompanhar os projetos.",
    details: [],
  },
  {
    id: "story",
    title: "Minha história",
    category: "Na estante",
    description: "Da primeira gravação ao que estou construindo hoje.",
    details: [
      "Os equipamentos, as tentativas e os momentos que fizeram parte do Imports Tech.",
    ],
    href: "/sobre",
  },
  {
    id: "milestone-1000",
    title: "1.000 inscritos",
    category: "Conquista",
    description: "Um momento que registrei em uma foto.",
    details: [],
    href: "/sobre#mil-inscritos",
  },
  {
    id: "milestone-5000",
    title: "5.000 inscritos",
    category: "Conquista",
    description: "Mais um marco alcançado pelo Imports Tech.",
    details: [],
    // Ryan confirmed the milestone, but the exact date is not yet confirmed.
  },
  {
    id: "monitor",
    title: "Monitor da bancada",
    category: "Edição",
    description: "Onde as gravações ganham forma.",
    details: [
      "Entre escolher os trechos, cortar e revisar, boa parte do trabalho acontece aqui.",
    ],
  },
];
