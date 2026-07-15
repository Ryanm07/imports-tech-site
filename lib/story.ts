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
};

// Every fallback below is based only on facts confirmed by Ryan in the brief.
// Published D1 entries with the same slug can replace them; archived entries
// act as tombstones. Draft and review states never reach the public site.
export const storyMilestones: StoryMilestone[] = [
  {
    slug: "comeco-setembro-2025",
    dateLabel: "Setembro de 2025",
    datePrecision: "exact",
    title: "Eu comecei para enfrentar a timidez",
    description:
      "Eu não imaginava que o canal teria sucesso. Meu objetivo era melhorar minha comunicação e enfrentar a timidez. Nos primeiros vídeos, eu falava baixo, me enrolava e tinha menos confiança. Hoje, eu vejo o canal também como um registro dessa evolução.",
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
      "Antes do formato atual, eu tentei criar uma renda extra importando e revendendo mouses e teclados. A primeira identidade foi R Import. Eu percebi que o nome era genérico e limitava o conteúdo, então mudei para Imports Tech para unir importações e tecnologia. O nome ainda pode evoluir com o canal.",
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
      "Eu gravei o primeiro vídeo sobre um teclado que comprei para usar. A intenção principal era praticar minha fala. Editei no Microsoft Clipchamp e acreditava que cortes demais poderiam tirar o realismo. Mantive o vídeo publicado porque ele mostra de onde eu parti.",
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
      "Eu comecei gravando com o Galaxy S23 e, depois de cerca de três vídeos, passei para o Galaxy S21 FE. Deixava o celular perto da boca para captar o áudio. Meu PC de edição levou cerca de três a quatro anos de trabalho para ser montado: Ryzen 5 5500, RTX 3060 e 16 GB de memória na época. No começo, eu não tinha iluminação.",
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
      "Eu investi cerca de R$ 300 em um tripé e luzes. Fiquei feliz com a evolução da gravação, mas também preocupado porque ainda não sabia se teria retorno. Os reviews costumavam ficar entre 100 e 500 visualizações; alguns chegaram a 2 mil ou 5 mil. O vídeo do GameSir X5 Lite chegou a cerca de 6 mil naquele momento e me deu motivação.",
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
      "Eu comprei um iPhone X na OLX para reparar e revender. Gravei o unboxing como prática e nem planejava publicar. A edição simples alcançou milhares de visualizações e me ensinou que o anúncio, o preço, o estado, o problema, o reparo, os testes e o resultado formavam uma história mais interessante do que uma ficha técnica isolada.",
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
      "Quando publiquei o projeto do iPhone XR, o canal ainda tinha menos de mil inscritos. O vídeo chegou a cerca de 50 mil visualizações naquele período e trouxe aproximadamente 300 inscritos. Foi quando eu reconheci um padrão: as pessoas queriam acompanhar o caminho inteiro.",
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
      "Passei o dia entre roteiros, edição, academia e faculdade. Quando voltei para casa, o canal estava com 999 inscritos. Eu acompanhei a chegada ao número mil, tirei uma foto e recebi os parabéns do meu irmão. Depois de meses, a monetização representou o primeiro retorno concreto.",
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
      "O vídeo do Acer Nitro 5 passou de 200 mil visualizações pouco depois. Minha cabeça saiu de ‘Este canal pode dar certo’ para ‘Este canal vai dar certo’.",
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
      "O Dell G7 foi o projeto mais difícil que produzi até agora. Foi o primeiro notebook que abri, e precisei desmontá-lo várias vezes. Gravei em 4K, meu PC sofreu na edição e os arquivos proxy ocuparam cerca de 500 GB. Passei aproximadamente dois dias editando.",
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
      "Normalmente, eu tenho dois ou três vídeos gravados esperando edição. Quando um unboxing vai ao ar, o aparelho às vezes já foi vendido e eu já estou em outro projeto. Um vídeo completo leva cerca de 12 horas entre planejamento, testes, gravação, organização, edição, música, efeitos, thumbnail, título, descrição, revisão e publicação. Só a edição costuma ocupar oito horas; uma hora gravada vira de 10 a 15 minutos no vídeo final.",
    imageUrl: null,
    number: "≈ 12 horas por vídeo",
    relatedProject: null,
    youtubeUrl: null,
    position: 11,
  },
  {
    slug: "meta-2027",
    dateLabel: "Até o fim de 2027",
    datePrecision: "exact",
    title: "Minha meta é chegar a 100 mil inscritos",
    description:
      "Depois do iPhone XR, eu parei de pensar seriamente em desistir. Minha dificuldade hoje é equilibrar canal, trabalhos, responsabilidades, faculdade, academia e descanso. Em algumas semanas, a academia quase vira meu único momento de descompressão. Minha meta é chegar a 100 mil inscritos até o fim de 2027 e, no longo prazo, construir uma das maiores comunidades de tecnologia do Brasil.",
    imageUrl: null,
    number: "100 mil inscritos",
    relatedProject: null,
    youtubeUrl: null,
    position: 12,
  },
];
