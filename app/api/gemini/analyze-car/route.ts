import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { GeminiCarSuggestion } from "@/lib/types";

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
      `You are helping create a used-car listing for cheapcarsus.
Analyze the image and return only valid JSON with this shape:
{
  "title": "2018 Toyota Camry SE",
  "year": 2018,
  "make": "Toyota",
  "model": "Camry",
  "trim": "SE",
  "price": 12000,
  "mileage": 90000,
  "transmission": "Automatic",
  "drivetrain": "FWD",
  "fuelType": "Gasoline",
  "bodyType": "Sedan",
  "exteriorColor": "Black",
  "interiorColor": "Unknown",
  "condition": "Good",
  "engine": "2.5L I4",
  "mpg": "28 city / 39 highway",
  "vin": "1HGCM82633A004352",
  "pills": ["Clean title", "Daily driver"],
  "features": ["Backup camera", "Bluetooth"],
  "description": "Short honest seller note."
}
Never return null, unknown, N/A, or empty strings. If an exact value cannot be inferred from the image, make a realistic assumption for a used-car listing. VIN can be a clearly placeholder but valid-looking 17-character VIN. Price and mileage should be conservative estimates if unknown. Condition must be one of Excellent, Good, Fair, Project, Mechanic Special. Fuel type must be Gasoline, Hybrid, Electric, Diesel, or Plug-in Hybrid.`,
    ]);

    const text = result.response.text();
    const suggestion = parseJson(text);

    if (!suggestion) {
      return NextResponse.json({ error: "Gemini did not return parseable JSON." }, { status: 502 });
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    const status = getGeminiStatus(error);
    const retryDelay = getGeminiRetryDelay(error);

    if (status === 429) {
      return NextResponse.json(
        {
          rateLimited: true,
          error: `Gemini rate limit reached. Wait ${retryDelay || "a minute"} and try again, or check the quota for your Google AI Studio key.`,
          retryDelay,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Gemini analysis failed: ${error.message}`
            : "Gemini analysis failed. Try again later.",
      },
      { status: status >= 400 ? status : 502 },
    );
  }
}

function parseJson(text: string): GeminiCarSuggestion | null {
  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as GeminiCarSuggestion;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]) as GeminiCarSuggestion;
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
