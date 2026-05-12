"use client";

import { Loader2, LockKeyhole, Sparkles, UploadCloud } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import type { CarCondition, FuelType, GeminiCarSuggestion } from "@/lib/types";

const fuelOptions: FuelType[] = ["Gasoline", "Hybrid", "Electric", "Diesel", "Plug-in Hybrid"];
const conditionOptions: CarCondition[] = ["Excellent", "Good", "Fair", "Project", "Mechanic Special"];
const bodyOptions = ["Sedan", "SUV", "Truck", "Hatchback", "Coupe", "Wagon", "Van", "Convertible"];
const drivetrainOptions = ["FWD", "RWD", "AWD", "4WD"];
const transmissionOptions = ["Automatic", "CVT Automatic", "Manual", "Single-speed"];
const pillSuggestions = [
  "Clean title",
  "Not running",
  "Broken engine",
  "Transmission issue",
  "Mechanic special",
  "Tow away",
  "Runs and drives",
  "Great MPG",
  "Low miles",
  "AWD",
  "EV",
  "Hybrid",
  "New tires",
  "Needs body work",
  "Cold AC",
  "One owner",
];
const geminiCooldownStorageKey = "cheapcarsus-gemini-cooldown-until";

type FormState = {
  title: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  price: string;
  mileage: string;
  location: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  condition: string;
  engine: string;
  mpg: string;
  pills: string;
  features: string;
  description: string;
  sold: boolean;
};

const initialForm: FormState = {
  title: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  price: "",
  mileage: "",
  location: "",
  transmission: "Automatic",
  drivetrain: "FWD",
  fuelType: "Gasoline",
  bodyType: "Sedan",
  exteriorColor: "",
  interiorColor: "",
  vin: "",
  condition: "Good",
  engine: "",
  mpg: "",
  pills: "",
  features: "",
  description: "",
  sold: false,
};

export function AdminCMS({ initialAdminKey = "" }: { initialAdminKey?: string }) {
  const [adminKey, setAdminKey] = useState(initialAdminKey);
  const [form, setForm] = useState<FormState>(initialForm);
  const [imageData, setImageData] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");
  const [imageName, setImageName] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<"analyze" | "save" | "">("");
  const [geminiCooldownUntil, setGeminiCooldownUntil] = useState(() => getStoredCooldownUntil());
  const [geminiCooldownSeconds, setGeminiCooldownSeconds] = useState(() =>
    secondsUntil(getStoredCooldownUntil()),
  );
  const analyzeInFlight = useRef(false);

  const selectOptions = useMemo(
    () => ({
      fuel: fuelOptions.map((value) => ({ label: value, value })),
      condition: conditionOptions.map((value) => ({ label: value, value })),
      body: bodyOptions.map((value) => ({ label: value, value })),
      drivetrain: drivetrainOptions.map((value) => ({ label: value, value })),
      transmission: transmissionOptions.map((value) => ({ label: value, value })),
    }),
    [],
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedCooldown = getStoredCooldownUntil();

      if (storedCooldown) {
        setGeminiCooldownUntil(storedCooldown);
        setGeminiCooldownSeconds(secondsUntil(storedCooldown));
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!geminiCooldownUntil) {
      return;
    }

    const updateCooldown = () => {
      const secondsRemaining = secondsUntil(geminiCooldownUntil);
      setGeminiCooldownSeconds(secondsRemaining);

      if (secondsRemaining === 0) {
        window.localStorage.removeItem(geminiCooldownStorageKey);
        setGeminiCooldownUntil(0);
      }
    };

    updateCooldown();
    const interval = window.setInterval(updateCooldown, 1000);

    return () => window.clearInterval(interval);
  }, [geminiCooldownUntil]);

  const handleImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setPreview(result);
      setImageData(result.split(",")[1] || "");
      setImageMimeType(file.type);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const applySuggestion = (suggestion: GeminiCarSuggestion) => {
    setForm((current) => ({
      ...current,
      title: textOr(suggestion.title, current.title) || assumedTitle(suggestion, current),
      year: suggestion.year ? String(suggestion.year) : current.year || "2018",
      make: textOr(suggestion.make, current.make),
      model: textOr(suggestion.model, current.model),
      trim: textOr(suggestion.trim, current.trim) || "Base",
      price: suggestion.price ? String(suggestion.price) : current.price || "12900",
      mileage: suggestion.mileage ? String(suggestion.mileage) : current.mileage || "95000",
      location: current.location || "Los Angeles, CA",
      transmission: textOr(suggestion.transmission, current.transmission) || "Automatic",
      drivetrain: textOr(suggestion.drivetrain, current.drivetrain) || "FWD",
      fuelType: textOr(suggestion.fuelType, current.fuelType) || "Gasoline",
      bodyType: textOr(suggestion.bodyType, current.bodyType) || "Sedan",
      exteriorColor: textOr(suggestion.exteriorColor, current.exteriorColor) || "Black",
      interiorColor: textOr(suggestion.interiorColor, current.interiorColor) || "Black",
      vin: textOr(suggestion.vin, current.vin) || assumedVin(suggestion, current),
      condition: textOr(suggestion.condition, current.condition) || "Good",
      engine: textOr(suggestion.engine, current.engine) || assumedEngine(suggestion, current),
      mpg: textOr(suggestion.mpg, current.mpg) || assumedMpg(suggestion, current),
      pills: listOr(suggestion.pills, current.pills) || "Clean title, Daily driver",
      features:
        listOr(suggestion.features, current.features) ||
        "Backup camera, Bluetooth, Premium alloy wheels, LED headlights",
      description:
        textOr(suggestion.description, current.description) ||
        "Well-presented used car with a clean exterior, comfortable cabin, and practical features for daily driving.",
    }));
  };

  const startGeminiCooldown = (retryDelay?: string) => {
    const delayMs = parseRetryDelayMs(retryDelay);
    const cooldownUntil = Date.now() + delayMs;
    const secondsRemaining = Math.ceil(delayMs / 1000);

    setGeminiCooldownUntil(cooldownUntil);
    setGeminiCooldownSeconds(secondsRemaining);
    window.localStorage.setItem(geminiCooldownStorageKey, String(cooldownUntil));

    return secondsRemaining;
  };

  const analyzeImage = async () => {
    if (analyzeInFlight.current || busy === "analyze") {
      return;
    }

    if (geminiCooldownSeconds > 0) {
      setStatus(`Gemini is cooling down. Try again in ${formatCooldown(geminiCooldownSeconds)}.`);
      return;
    }

    if (!imageData || !imageMimeType) {
      setStatus("Upload a vehicle image first.");
      return;
    }

    setBusy("analyze");
    analyzeInFlight.current = true;
    setStatus("Gemini is reading the image and drafting listing fields...");

    let response: Response;
    try {
      response = await fetch("/api/gemini/analyze-car", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ imageData, imageMimeType }),
      });
    } catch {
      analyzeInFlight.current = false;
      setBusy("");
      setStatus("Unable to reach the Gemini API route. Check the dev server and try again.");
      return;
    }

    const result = await readJsonResponse<{
      suggestion?: GeminiCarSuggestion;
      error?: string;
      retryDelay?: string;
      rateLimited?: boolean;
    }>(response);
    analyzeInFlight.current = false;
    setBusy("");

    if (!response.ok || !result.suggestion) {
      if (response.status === 429 || result.rateLimited) {
        const secondsRemaining = startGeminiCooldown(result.retryDelay);
        setStatus(
          `Gemini rate limit reached. Cooldown started: ${formatCooldown(secondsRemaining)} remaining.`,
        );
        return;
      }

      setStatus(result.error || "Gemini analysis failed. Check your API key and try again.");
      return;
    }

    applySuggestion(result.suggestion);
    setStatus("Autofill complete. Review the details before saving.");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy("save");
    setStatus("Saving vehicle to Supabase...");

    const payload = {
      ...form,
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
      pills: splitList(form.pills),
      features: splitList(form.features),
      imageData,
      imageName,
      imageMimeType,
    };

    const response = await fetch("/api/cars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await readJsonResponse<{ error?: string; car?: { title: string } }>(response);
    setBusy("");

    if (!response.ok) {
      setStatus(result.error || "Unable to save vehicle.");
      return;
    }

    setForm(initialForm);
    setImageData("");
    setImageMimeType("");
    setImageName("");
    setPreview("");
    setStatus(`${result.car?.title || "Vehicle"} was saved. Refresh inventory to see it live.`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20">
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
          <LockKeyhole size={15} /> Private inventory tools
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Add inventory fast.</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Enter the admin key, upload a car photo, optionally let Gemini draft the listing, then
          save the vehicle and images into Supabase.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          {initialAdminKey ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
              Admin link verified.
            </div>
          ) : (
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Admin key
              </span>
              <input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Paste ADMIN_ACCESS_KEY"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                required
              />
            </label>
          )}

          <label className="mt-6 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-orange-200 bg-orange-50/60 p-6 text-center transition hover:border-orange-400 hover:bg-orange-50">
            {preview ? (
              <Image
                src={preview}
                alt="Vehicle preview"
                width={640}
                height={420}
                className="max-h-72 rounded-2xl object-cover shadow-lg"
                unoptimized
              />
            ) : (
              <>
                <UploadCloud className="mb-4 text-orange-500" size={42} />
                <span className="text-lg font-black text-slate-950">Upload vehicle image</span>
                <span className="mt-2 text-sm text-slate-600">JPG, PNG, or WebP. Used for listing and Gemini autofill.</span>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImage(file);
              }}
            />
          </label>

          <button
            type="button"
            onClick={analyzeImage}
            disabled={busy !== "" || geminiCooldownSeconds > 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "analyze" ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {geminiCooldownSeconds > 0
              ? `Gemini cooldown: ${formatCooldown(geminiCooldownSeconds)}`
              : "Autofill with Gemini"}
          </button>

          <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm">
            {status || "Status messages will appear here."}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" value={form.title} onChange={(value) => setField("title", value)} required />
            <TextField label="Location" value={form.location} onChange={(value) => setField("location", value)} required />
            <TextField label="Year" value={form.year} onChange={(value) => setField("year", digits(value))} required />
            <TextField label="Make" value={form.make} onChange={(value) => setField("make", value)} required />
            <TextField label="Model" value={form.model} onChange={(value) => setField("model", value)} required />
            <TextField label="Trim" value={form.trim} onChange={(value) => setField("trim", value)} />
            <TextField label="Price" value={form.price} onChange={(value) => setField("price", digits(value))} required />
            <TextField label="Mileage" value={form.mileage} onChange={(value) => setField("mileage", digits(value))} required />
            <CustomSelect
              label="Fuel type"
              value={form.fuelType}
              options={selectOptions.fuel}
              onChange={(value) => setField("fuelType", value)}
              placeholder="Fuel type"
            />
            <CustomSelect
              label="Body type"
              value={form.bodyType}
              options={selectOptions.body}
              onChange={(value) => setField("bodyType", value)}
              placeholder="Body type"
            />
            <CustomSelect
              label="Transmission"
              value={form.transmission}
              options={selectOptions.transmission}
              onChange={(value) => setField("transmission", value)}
              placeholder="Transmission"
            />
            <CustomSelect
              label="Drivetrain"
              value={form.drivetrain}
              options={selectOptions.drivetrain}
              onChange={(value) => setField("drivetrain", value)}
              placeholder="Drivetrain"
            />
            <CustomSelect
              label="Condition"
              value={form.condition}
              options={selectOptions.condition}
              onChange={(value) => setField("condition", value)}
              placeholder="Condition"
            />
            <TextField label="Engine" value={form.engine} onChange={(value) => setField("engine", value)} required />
            <TextField label="Exterior color" value={form.exteriorColor} onChange={(value) => setField("exteriorColor", value)} />
            <TextField label="Interior color" value={form.interiorColor} onChange={(value) => setField("interiorColor", value)} />
            <TextField label="VIN" value={form.vin} onChange={(value) => setField("vin", value.toUpperCase())} />
            <TextField label="MPG / range" value={form.mpg} onChange={(value) => setField("mpg", value)} />
          </div>

          <div className="mt-4">
            <TextField
              label="Pills"
              value={form.pills}
              onChange={(value) => setField("pills", value)}
              placeholder="Clean title, not running, broken engine"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {pillSuggestions.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setField("pills", appendListValue(form.pills, pill))}
                  className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-orange-700 transition hover:bg-orange-100"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          <TextField
            label="Features"
            value={form.features}
            onChange={(value) => setField("features", value)}
            placeholder="Backup camera, heated seats, Bluetooth"
            className="mt-4"
          />

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              required
            />
          </label>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setField("sold", !form.sold)}
              className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                form.sold ? "bg-red-600 text-white" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {form.sold ? "Marked sold" : "Available for sale"}
            </button>
            <button
              type="submit"
              disabled={busy !== ""}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 font-black text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "save" ? <Loader2 className="animate-spin" size={18} /> : null}
              Save car
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function appendListValue(current: string, next: string) {
  const values = splitList(current);
  return values.includes(next) ? current : [...values, next].join(", ");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function textOr(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed && !["unknown", "n/a", "na", "null"].includes(trimmed.toLowerCase())
    ? trimmed
    : fallback;
}

function listOr(value: unknown, fallback: string) {
  if (Array.isArray(value)) {
    const items = value.map((item) => textOr(item, "")).filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }

  return fallback;
}

function assumedTitle(suggestion: GeminiCarSuggestion, current: FormState) {
  const year = suggestion.year ? String(suggestion.year) : current.year || "2018";
  const make = textOr(suggestion.make, current.make) || "Used";
  const model = textOr(suggestion.model, current.model) || "Car";
  const trim = textOr(suggestion.trim, current.trim);

  return [year, make, model, trim].filter(Boolean).join(" ");
}

function assumedEngine(suggestion: GeminiCarSuggestion, current: FormState) {
  const fuelType = textOr(suggestion.fuelType, current.fuelType);
  const bodyType = textOr(suggestion.bodyType, current.bodyType);

  if (fuelType === "Electric") return "Electric motor";
  if (fuelType === "Hybrid" || fuelType === "Plug-in Hybrid") return "2.0L hybrid I4";
  if (bodyType === "Truck" || bodyType === "SUV") return "3.5L V6";

  return "2.0L I4";
}

function assumedMpg(suggestion: GeminiCarSuggestion, current: FormState) {
  const fuelType = textOr(suggestion.fuelType, current.fuelType);
  const bodyType = textOr(suggestion.bodyType, current.bodyType);

  if (fuelType === "Electric") return "250 mile EPA range";
  if (fuelType === "Hybrid" || fuelType === "Plug-in Hybrid") return "48 city / 45 highway";
  if (bodyType === "Truck") return "17 city / 23 highway";
  if (bodyType === "SUV") return "22 city / 29 highway";

  return "28 city / 36 highway";
}

function assumedVin(suggestion: GeminiCarSuggestion, current: FormState) {
  const title = assumedTitle(suggestion, current).replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const seed = `${title}CHEAPCARSUS2026`.padEnd(17, "0");

  return seed.slice(0, 17).replace(/[IOQ]/g, "X");
}

async function readJsonResponse<T extends { error?: string }>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return { error: `Request failed with status ${response.status}.` } as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: text } as T;
  }
}

function parseRetryDelayMs(retryDelay?: string) {
  if (!retryDelay) {
    return 60_000;
  }

  const secondsMatch = retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
  if (secondsMatch) {
    return Math.ceil(Number(secondsMatch[1]) * 1000);
  }

  const milliseconds = Number(retryDelay);
  return Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : 60_000;
}

function getStoredCooldownUntil() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedCooldown = Number(window.localStorage.getItem(geminiCooldownStorageKey));
  return Number.isFinite(storedCooldown) && storedCooldown > Date.now() ? storedCooldown : 0;
}

function secondsUntil(timestamp: number) {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

function formatCooldown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
