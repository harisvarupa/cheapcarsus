export type PosiljkaRed = {
  primalac: string;
  adresa: string;
  mjesto: string;
  telefon: string;
  brojPaketa: string;
  tezina: string;
  napomena: string;
};

export type TovarniListData = {
  brojTovarnogLista: string;
  mjestoIzdavanja: string;
  datumIzdavanja: string;

  mjestoUtovara: string;
  datumUtovara: string;

  voziloRegistracija: string;
  vozac: string;
  isporucilac: string;

  posiljke: PosiljkaRed[];

  napomene: string;
};

export type TovarniListSuggestion = Partial<Omit<TovarniListData, "posiljke">> & {
  posiljke?: Partial<PosiljkaRed>[];
};

// Podaci prijevoznika preuzeti sa uvjerenja o registraciji (UIO BiH).
export const PRIJEVOZNIK = {
  naziv: "BOSNIA DELIVERY SERVICE-BOSNA DOSTAVA PREVOZ d.o.o. Travnik",
  adresa: "Polje Slavka Gavrančića bb, Dolac na Lašvi, 72270 Travnik",
  // ID broj iz Jedinstvenog registra obveznika indirektnih poreza (ujedno PDV broj).
  idBroj: "236735330002",
  telefon: "",
  email: "",
};

export const emptyRed: PosiljkaRed = {
  primalac: "",
  adresa: "",
  mjesto: "",
  telefon: "",
  brojPaketa: "",
  tezina: "",
  napomena: "",
};

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Današnji datum u bosanskom formatu dd.mm.gggg.
export function todayDisplay() {
  const now = new Date();
  const dan = String(now.getDate()).padStart(2, "0");
  const mjesec = String(now.getMonth() + 1).padStart(2, "0");
  return `${dan}.${mjesec}.${now.getFullYear()}.`;
}

// Broj tovarnog lista u formatu BDS-YYYYMMDD-##### na osnovu vremena izdavanja.
export function generateTovarniListBroj() {
  const now = new Date();
  const datum = now.toISOString().slice(0, 10).replace(/-/g, "");
  const sekund = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds())
    .toString()
    .padStart(5, "0");

  return `BDS-${datum}-${sekund}`;
}

export function createEmptyTovarniList(): TovarniListData {
  return {
    brojTovarnogLista: generateTovarniListBroj(),
    mjestoIzdavanja: "Travnik",
    datumIzdavanja: todayDisplay(),

    mjestoUtovara: "Dolac na Lašvi, Travnik",
    datumUtovara: todayDisplay(),

    voziloRegistracija: "",
    vozac: "",
    isporucilac: PRIJEVOZNIK.naziv,

    posiljke: [{ ...emptyRed }],

    napomene: "",
  };
}

const red = (
  primalac: string,
  adresa: string,
  mjesto: string,
  telefon: string,
  brojPaketa: string,
  tezina: string,
): PosiljkaRed => ({ primalac, adresa, mjesto, telefon, brojPaketa, tezina, napomena: "" });

// Početna lista pošiljki (popunjeno sa primljenog spiska).
export const seedPosiljke: PosiljkaRed[] = [
  red("Dijana Bešlić", "Lipovača 134", "B. Gradiška", "065 312 317", "2", "56"),
  red("Semira Todorović", "Dubrave 688", "B. Gradiška", "", "5", "100"),
  red("Slobodan Regulić", "Zorke Malić 18", "B. Gradiška", "066 302 276", "2", "60"),
  red("Edina Vakupac", "Suhača 27a, Donji Agići", "Bosanski Novi", "", "11", "200"),
  red("Sedija Dedić", "Urijanski put 121", "Bosanski Novi", "066 298 837", "2", "60"),
  red("Mira Kovačević", "Rudice 61", "Rudice", "065 192 901", "2", "25"),
  red("Sead Mehić", "Tećija bb", "Bosanska Krupa", "061 163 409", "2", "25"),
  red("Danian Celebic", "Zborište bb", "Velika Kladuša", "064 455 6637 / 062 659 383", "1", "20"),
  red("Sahija Sadikovic", "Vrnogračka brda 5", "Vrnograč", "061 811 757", "1", "20"),
  red("Mehmed/Fadila Ramulić", "Vrnograč bb", "Vrnograč", "061 939054", "1", "15"),
  red("Mehmed Sefić", "Vrnogračka Slapnica", "Vrnograč", "062 953 149", "4", "70"),
  red("Almira Sagrković", "Vejinac 19, Todorovo", "Velika Kladuša", "", "2", "130"),
  red("Vanes Kajtazović", "Sabici bb", "Velika Kladuša", "061 981 757", "1", "10"),
  red("Elvira Dizdarević", "Ul. Muhameda Talakic 14", "Velika Kladuša", "061 288 816", "2", "40"),
  red("Mima Nizandžić", "Ibre Miljkovića Uče 54", "Velika Kladuša", "061 917 642", "1", "25"),
  red("Jasmina/Asim Bećiragić", "462 Coralici", "Cazin", "061 105 197", "1", "25"),
  red("Mustafa Aida Abdihodžić", "Bećira Islamovića bb", "Bihać", "061 860 080", "1", "30"),
  red("Kasim Vojić", "Kotorvaroška 31", "Bihać", "061 394 298", "1", "30"),
  red("Aziz Okugic", "Pokojskih branitelja 46", "Bihać", "061 772 463", "1", "15"),
];

export function createSeededTovarniList(): TovarniListData {
  return {
    ...createEmptyTovarniList(),
    posiljke: seedPosiljke.map((stavka) => ({ ...stavka })),
  };
}
