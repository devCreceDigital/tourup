export const LEVEL_COLORS: Record<string, string> = {
  elite:    "#E6C84A",
  premium:  "#8B7FF0",
  advanced: "#34D399",
  growing:  "#22D3EE",
  emerging: "#FB923C",
  risk:     "#F87171",
};

export const levelColor = (l: string) => LEVEL_COLORS[l] ?? "#F87171";

export const COVERS = [
  "/images/machu-picchu.png",
  "/images/amazonas.png",
  "/images/sacred-valley.png",
  "/images/nazca.png",
  "/images/colca.png",
  "/images/lima.png",
  "/images/titicaca.png",
  "/images/rainbow-mountain.png",
];

export const HEROES = [
  "/images/machu-picchu.png",
  "/images/sacred-valley.png",
  "/images/rainbow-mountain.png",
  "/images/titicaca.png",
];

export const REGIONS = [
  "Amazonas","Ancash","Apurimac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco",
  "Huancavelica","Huanuco","Ica","Junin","La Libertad","Lambayeque","Lima","Loreto",
  "Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martin","Tacna","Tumbes","Ucayali",
];

export const CLASES = [
  "Operador de Turismo","Minorista","Mayorista",
  "Minorista, Operador de Turismo","Mayorista, Minorista",
  "Mayorista, Operador de Turismo","Mayorista, Minorista, Operador de Turismo",
];

export const LEVELS = ["elite","premium","advanced","growing","emerging","risk"];
