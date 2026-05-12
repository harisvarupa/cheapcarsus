"use client";

import { Loader2, LockKeyhole, Pencil, Sparkles, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import type { Car, CarCondition, FuelType, GeminiCarSuggestion } from "@/lib/types";
import { currency, number } from "@/lib/utils";

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

type UploadedImage = {
  data: string;
  mimeType: string;
  name: string;
  preview: string;
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
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [editingCarId, setEditingCarId] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [deletingCarId, setDeletingCarId] = useState("");
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

  const loadCars = useCallback(async () => {
    if (!adminKey) {
      return;
    }

    setInventoryLoading(true);
    const response = await fetch("/api/cars", {
      headers: {
        "x-admin-key": adminKey,
      },
    });
    const result = await readJsonResponse<{ cars?: Car[]; error?: string }>(response);
    setInventoryLoading(false);

    if (!response.ok || !result.cars) {
      setStatus(result.error || "Unable to load current inventory.");
      return;
    }

    setCars(result.cars);
  }, [adminKey]);

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
    const timeout = window.setTimeout(() => {
      void loadCars();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCars]);

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

  const handleImages = async (files: FileList) => {
    const images = await Promise.all(Array.from(files).map(readUploadedImage));
    setUploadedImages((current) => [...current, ...images]);
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
      vin: textOr(suggestion.vin, current.vin),
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

    const primaryImage = uploadedImages[0];

    if (!primaryImage) {
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
        body: JSON.stringify({
          imageData: primaryImage.data,
          imageMimeType: primaryImage.mimeType,
        }),
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

  const resetEditor = () => {
    setForm(initialForm);
    setUploadedImages([]);
    setExistingImages([]);
    setEditingCarId("");
  };

  const editCar = (car: Car) => {
    setForm(carToForm(car));
    setExistingImages(car.images);
    setUploadedImages([]);
    setEditingCarId(car.id);
    setStatus(`Editing ${car.title}. Save changes when ready.`);
  };

  const removeExistingImage = (image: string) => {
    setExistingImages((current) => current.filter((currentImage) => currentImage !== image));
  };

  const deleteCar = async (car: Car) => {
    if (!window.confirm(`Remove ${car.title} from the site? This cannot be undone.`)) {
      return;
    }

    setDeletingCarId(car.id);
    setStatus(`Removing ${car.title}...`);

    const response = await fetch(`/api/cars/${car.id}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": adminKey,
      },
    });
    const result = await readJsonResponse<{ ok?: boolean; error?: string }>(response);
    setDeletingCarId("");

    if (!response.ok || !result.ok) {
      setStatus(result.error || "Unable to remove vehicle.");
      return;
    }

    setCars((current) => current.filter((item) => item.id !== car.id));
    if (editingCarId === car.id) {
      resetEditor();
    }
    setStatus(`${car.title} was removed from the site.`);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy("save");
    setStatus(editingCarId ? "Updating vehicle in Supabase..." : "Saving vehicle to Supabase...");

    const payload = {
      ...form,
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
      pills: splitList(form.pills),
      features: splitList(form.features),
      imageUploads: uploadedImages.map((image) => ({
        data: image.data,
        mimeType: image.mimeType,
        name: image.name,
      })),
      images: existingImages,
    };

    const response = await fetch(editingCarId ? `/api/cars/${editingCarId}` : "/api/cars", {
      method: editingCarId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await readJsonResponse<{ error?: string; car?: Car }>(response);
    setBusy("");

    if (!response.ok) {
      setStatus(result.error || "Unable to save vehicle.");
      return;
    }

    const savedCar = result.car;
    if (savedCar) {
      setCars((current) =>
        editingCarId
          ? current.map((car) => (car.id === savedCar.id ? savedCar : car))
          : [savedCar, ...current],
      );
    }

    resetEditor();
    setStatus(`${savedCar?.title || "Vehicle"} was ${editingCarId ? "updated" : "saved"}.`);
  };

  const primaryPreview = uploadedImages[0]?.preview || existingImages[0] || "";
  const isEditing = Boolean(editingCarId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20">
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
          <LockKeyhole size={15} /> Private inventory tools
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Manage inventory fast.</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Add new cars, edit current listings, remove vehicles from the site, and use Gemini to
          draft listing details from the first newly uploaded image.
        </p>
      </div>

      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Current inventory</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {inventoryLoading ? "Loading cars..." : `${cars.length} car${cars.length === 1 ? "" : "s"} in Supabase`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadCars()}
              disabled={inventoryLoading}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inventoryLoading ? "Refreshing..." : "Refresh"}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={resetEditor}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Add new car
              </button>
            ) : null}
          </div>
        </div>

        {cars.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car) => (
              <div
                key={car.id}
                className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition ${
                  editingCarId === car.id ? "border-orange-400 ring-4 ring-orange-100" : "border-slate-200"
                }`}
              >
                <div className="flex gap-4 p-4">
                  <Image
                    src={car.images[0]}
                    alt={car.title}
                    width={140}
                    height={105}
                    className="h-24 w-32 rounded-2xl object-cover"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-black text-slate-950">{car.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white ${
                          car.sold ? "bg-red-600" : "bg-emerald-500"
                        }`}
                      >
                        {car.sold ? "Sold" : "Live"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {currency(car.price)} | {number(car.mileage)} mi
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      {car.images.length} image{car.images.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 border-t border-slate-100 text-sm font-black">
                  <button
                    type="button"
                    onClick={() => editCar(car)}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-slate-700 transition hover:bg-orange-50 hover:text-orange-700"
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <a
                    href={`/cars/${car.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center px-3 py-3 text-slate-700 transition hover:bg-slate-50"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => void deleteCar(car)}
                    disabled={deletingCarId === car.id}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingCarId === car.id ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            {inventoryLoading ? "Loading current cars..." : "No cars found yet."}
          </div>
        )}
      </section>

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
            {primaryPreview ? (
              <Image
                src={primaryPreview}
                alt="Primary vehicle preview"
                width={640}
                height={420}
                className="max-h-72 rounded-2xl object-cover shadow-lg"
                unoptimized
              />
            ) : (
              <>
                <UploadCloud className="mb-4 text-orange-500" size={42} />
                <span className="text-lg font-black text-slate-950">Upload vehicle images</span>
                <span className="mt-2 text-sm text-slate-600">
                  JPG, PNG, or WebP. The first image is used for Gemini autofill.
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) void handleImages(event.target.files);
                event.target.value = "";
              }}
            />
          </label>

          {existingImages.length ? (
            <div className="mt-4">
              <p className="text-sm font-black text-slate-700">
                Current listing images ({existingImages.length})
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {existingImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={image}
                      alt={`Current vehicle image ${index + 1}`}
                      width={220}
                      height={160}
                      className="h-24 w-full object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image)}
                      className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {uploadedImages.length ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black text-slate-700">
                  {uploadedImages.length} new image{uploadedImages.length === 1 ? "" : "s"} selected
                </p>
                <button
                  type="button"
                  onClick={() => setUploadedImages([])}
                  className="text-sm font-black text-red-600 hover:text-red-700"
                >
                  Clear images
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {uploadedImages.map((image, index) => (
                  <div key={`${image.name}-${index}`} className="relative overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={image.preview}
                      alt={`${image.name} preview`}
                      width={220}
                      height={160}
                      className="h-24 w-full object-cover"
                      unoptimized
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      {index === 0 ? "Gemini" : index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {isEditing ? "Edit car listing" : "Add new car"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isEditing
                  ? "Update fields, remove current images, or add new images."
                  : "Fill the fields below and save the car to Supabase."}
              </p>
            </div>
            {isEditing ? (
              <button
                type="button"
                onClick={resetEditor}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
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
              {isEditing ? "Update car" : "Save car"}
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

function carToForm(car: Car): FormState {
  return {
    title: car.title,
    year: String(car.year),
    make: car.make,
    model: car.model,
    trim: car.trim,
    price: String(car.price),
    mileage: String(car.mileage),
    location: car.location,
    transmission: car.transmission,
    drivetrain: car.drivetrain,
    fuelType: car.fuelType,
    bodyType: car.bodyType,
    exteriorColor: car.exteriorColor,
    interiorColor: car.interiorColor,
    vin: car.vin,
    condition: car.condition,
    engine: car.engine,
    mpg: car.mpg,
    pills: car.pills.join(", "),
    features: car.features.join(", "),
    description: car.description,
    sold: car.sold,
  };
}

function appendListValue(current: string, next: string) {
  const values = splitList(current);
  return values.includes(next) ? current : [...values, next].join(", ");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function readUploadedImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const preview = String(reader.result);
      resolve({
        data: preview.split(",")[1] || "",
        mimeType: file.type,
        name: file.name,
        preview,
      });
    };

    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
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
