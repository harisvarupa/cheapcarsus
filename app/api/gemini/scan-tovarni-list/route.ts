import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { TovarniListSuggestion } from "@/lib/tovarni-list";

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");

  if (!process.env.ADMIN_ACCESS_KEY || adminKey !== process.env.ADMIN_ACCESS_KEY) {
    return NextResponse.json({ error: "Invalid admin key." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  const { imageData, imageMimeType } = (await request.json()) as {
    imageData?: string;
    imageMimeType?: string;
  };

  if (!imageData || !imageMimeType) {
    return NextResponse.json({ error: "Image data and MIME type are required." }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: imageMimeType,
        },
      },
      `Ti si asistent koji čita SPISAK POŠILJKI (manifest) za firmu za dostavu paketa u Bosni i Hercegovini. Slika je obično tabela ili rukom pisan/štampan spisak gdje je SVAKI RED jedan primalac, a jedan primalac može imati više paketa.
Iz slike izvuci SVE redove i vrati ISKLJUČIVO validan JSON ovog oblika:
{
  "datumUtovara": "",
  "napomene": "",
  "posiljke": [
    {
      "primalac": "",
      "adresa": "",
      "mjesto": "",
      "telefon": "",
      "brojPaketa": "",
      "tezina": "",
      "napomena": ""
    }
  ]
}
Mapiranje kolona (nazivi mogu varirati):
- "primalac" = ime i prezime / naziv osobe kojoj se isporučuje paket.
- "adresa" = ulica i broj (ili opis lokacije).
- "mjesto" = grad/općina isporuke (npr. B. Luka, Bihać, Bijeljina, Travnik). Skraćenice ostavi kako jesu.
- "telefon" = kontakt telefon primaoca.
- "brojPaketa" = broj paketa/koleta za tog primaoca (samo broj, npr. "1", "3"). Ako nije naveden a jasno je jedan paket, upiši "1".
- "tezina" = težina u kilogramima (samo broj ako je vidljiva).
- "napomena" = bilo koja dodatna oznaka u tom redu.
Pravila:
- Ovo je zvanični prevozni dokument, zato NE izmišljaj podatke. Upiši samo ono što jasno pročitaš.
- Pročitaj SVE redove sa spiska, ne samo prvi. Zadrži isti redoslijed kao na slici.
- Ako neki podatak u redu nije vidljiv ili nisi siguran, ostavi PRAZAN string ("") za to polje. Nikada ne vraćaj "unknown", "N/A" ni null.
- Vrati samo JSON, bez dodatnog teksta i bez markdown oznaka.`,
    ]);

    const text = result.response.text();
    const suggestion = parseJson(text);

    if (!suggestion) {
      return NextResponse.json({ error: "Gemini nije vratio JSON koji se može pročitati." }, { status: 502 });
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    const status = getGeminiStatus(error);
    const retryDelay = getGeminiRetryDelay(error);

    if (status === 429) {
      return NextResponse.json({
        rateLimited: true,
        error: `Dostignut je Gemini limit. Sačekaj ${retryDelay || "minutu"} pa pokušaj ponovo, ili provjeri kvotu za svoj Google AI Studio ključ.`,
        retryDelay,
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Gemini skeniranje nije uspjelo: ${error.message}`
            : "Gemini skeniranje nije uspjelo. Pokušaj ponovo kasnije.",
      },
      { status: status >= 400 ? status : 502 },
    );
  }
}

function parseJson(text: string): TovarniListSuggestion | null {
  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as TovarniListSuggestion;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]) as TovarniListSuggestion;
    } catch {
      return null;
    }
  }
}

function getGeminiStatus(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : 502;
}

function getGeminiRetryDelay(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("errorDetails" in error) ||
    !Array.isArray(error.errorDetails)
  ) {
    return "";
  }

  const retryInfo = error.errorDetails.find(
    (detail) => typeof detail === "object" && detail !== null && "retryDelay" in detail,
  );

  return typeof retryInfo === "object" &&
    retryInfo !== null &&
    "retryDelay" in retryInfo &&
    typeof retryInfo.retryDelay === "string"
    ? retryInfo.retryDelay
    : "";
}
