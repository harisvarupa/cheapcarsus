"use client";

import {
  Loader2,
  LockKeyhole,
  Plus,
  Printer,
  RotateCcw,
  ScanLine,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  PRIJEVOZNIK,
  createEmptyTovarniList,
  createSeededTovarniList,
  emptyRed,
  generateTovarniListBroj,
  type PosiljkaRed,
  type TovarniListData,
  type TovarniListSuggestion,
} from "@/lib/tovarni-list";

const geminiCooldownStorageKey = "bds-tovarni-gemini-cooldown-until";

type Prijevoznik = typeof PRIJEVOZNIK;

type UploadedImage = {
  data: string;
  mimeType: string;
  name: string;
  preview: string;
};

export function TovarniListGenerator({ initialAdminKey = "" }: { initialAdminKey?: string }) {
  const [adminKey] = useState(initialAdminKey);
  const [data, setData] = useState<TovarniListData>(() => createSeededTovarniList());
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [busy, setBusy] = useState<"scan" | "">("");
  const [status, setStatus] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [geminiCooldownUntil, setGeminiCooldownUntil] = useState(() => getStoredCooldownUntil());
  const [geminiCooldownSeconds, setGeminiCooldownSeconds] = useState(() =>
    secondsUntil(getStoredCooldownUntil()),
  );
  const scanInFlight = useRef(false);

  // Povećanje formKey-a remountuje uređiva polja da pokupe nove vrijednosti
  // (nakon skeniranja, brisanja reda, novog broja ili reseta).
  const refreshFields = () => setFormKey((current) => current + 1);

  const setField = <K extends keyof TovarniListData>(key: K, value: TovarniListData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const updateRed = (index: number, key: keyof PosiljkaRed, value: string) => {
    setData((current) => ({
      ...current,
      posiljke: current.posiljke.map((red, i) => (i === index ? { ...red, [key]: value } : red)),
    }));
  };

  const addRed = () => {
    setData((current) => ({ ...current, posiljke: [...current.posiljke, { ...emptyRed }] }));
  };

  const removeRed = (index: number) => {
    setData((current) => ({
      ...current,
      posiljke:
        current.posiljke.length > 1
          ? current.posiljke.filter((_, i) => i !== index)
          : [{ ...emptyRed }],
    }));
    refreshFields();
  };

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

  const handleImage = async (files: FileList) => {
    const file = files[0];
    if (!file) {
      return;
    }

    const image = await readUploadedImage(file);
    setUploadedImage(image);
  };

  const applySuggestion = (suggestion: TovarniListSuggestion) => {
    setData((current) => {
      const posiljke =
        Array.isArray(suggestion.posiljke) && suggestion.posiljke.length
          ? suggestion.posiljke.map((red) => ({
              primalac: textOr(red?.primalac, ""),
              adresa: textOr(red?.adresa, ""),
              mjesto: textOr(red?.mjesto, ""),
              telefon: textOr(red?.telefon, ""),
              brojPaketa: textOr(red?.brojPaketa, ""),
              tezina: textOr(red?.tezina, ""),
              napomena: textOr(red?.napomena, ""),
            }))
          : current.posiljke;

      return {
        ...current,
        datumUtovara: textOr(suggestion.datumUtovara, current.datumUtovara),
        napomene: textOr(suggestion.napomene, current.napomene),
        posiljke,
      };
    });
    refreshFields();
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

  const scanImage = async () => {
    if (scanInFlight.current || busy === "scan") {
      return;
    }

    if (geminiCooldownSeconds > 0) {
      setStatus(`Gemini se hladi. Pokušaj ponovo za ${formatCooldown(geminiCooldownSeconds)}.`);
      return;
    }

    if (!uploadedImage) {
      setStatus("Prvo dodaj sliku spiska pošiljki.");
      return;
    }

    setBusy("scan");
    scanInFlight.current = true;
    setStatus("Gemini čita spisak i popunjava redove...");

    let response: Response;
    try {
      response = await fetch("/api/gemini/scan-tovarni-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          imageData: uploadedImage.data,
          imageMimeType: uploadedImage.mimeType,
        }),
      });
    } catch {
      scanInFlight.current = false;
      setBusy("");
      setStatus("Ne mogu dohvatiti Gemini rutu. Provjeri da li dev server radi i pokušaj ponovo.");
      return;
    }

    const result = await readJsonResponse<{
      suggestion?: TovarniListSuggestion;
      error?: string;
      retryDelay?: string;
      rateLimited?: boolean;
    }>(response);
    scanInFlight.current = false;
    setBusy("");

    if (!response.ok || !result.suggestion) {
      if (response.status === 429 || result.rateLimited) {
        const secondsRemaining = startGeminiCooldown(result.retryDelay);
        setStatus(`Dostignut Gemini limit. Hlađenje: preostalo ${formatCooldown(secondsRemaining)}.`);
        return;
      }

      setStatus(result.error || "Skeniranje nije uspjelo. Provjeri API ključ i pokušaj ponovo.");
      return;
    }

    applySuggestion(result.suggestion);
    const broj = Array.isArray(result.suggestion.posiljke) ? result.suggestion.posiljke.length : 0;
    setStatus(
      broj
        ? `Pročitano ${broj} ${broj === 1 ? "red" : "redova"}. Provjeri sve na dokumentu prije generisanja.`
        : "Podaci popunjeni. Provjeri sve na dokumentu prije generisanja.",
    );
  };

  const resetForm = () => {
    setData(createEmptyTovarniList());
    setUploadedImage(null);
    refreshFields();
    setStatus("Forma je očišćena. Novi tovarni list je spreman.");
  };

  const newBroj = () => {
    setField("brojTovarnogLista", generateTovarniListBroj());
    refreshFields();
  };

  const handlePrint = () => {
    window.print();
  };

  const ukupnoPaketa = sumNumbers(data.posiljke.map((red) => red.brojPaketa));
  const ukupnoTezina = sumNumbers(data.posiljke.map((red) => red.tezina));

  return (
    <div className="print-unwrap mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="no-print mb-6 rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/20">
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
          <LockKeyhole size={15} /> Privatni alat — Bosnia Delivery Service
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Tovarni list</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Klikni na bilo koje polje na dokumentu ispod i piši direktno. Ili pošalji sliku spiska da je
          Gemini popuni. Kad je sve tačno, klikni{" "}
          <span className="font-black text-white">Generiši i štampaj</span>.
        </p>
      </div>

      <div className="no-print mb-6 flex flex-col gap-4 rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 font-black text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            <Printer size={18} /> Generiši i štampaj (A4 PDF)
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
          >
            <RotateCcw size={18} /> Novi
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-orange-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-orange-400 hover:text-orange-700">
            <UploadCloud size={18} className="text-orange-500" />
            {uploadedImage ? uploadedImage.name : "Dodaj sliku spiska"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) void handleImage(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={scanImage}
            disabled={busy !== "" || geminiCooldownSeconds > 0 || !uploadedImage}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "scan" ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {geminiCooldownSeconds > 0
              ? `Hlađenje: ${formatCooldown(geminiCooldownSeconds)}`
              : "Skeniraj i popuni"}
          </button>
          {uploadedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploadedImage.preview}
              alt="Pregled spiska"
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ScanLine size={15} className="text-slate-400" />
          {status || "Klikni na polje na dokumentu da uređuješ, ili skeniraj spisak slikom."}
        </div>
      </div>

      <div className="print-unwrap">
        <p className="no-print mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Dokument (A4) — klikni i piši
        </p>
        <div className="print-unwrap overflow-x-auto rounded-[1.5rem] bg-slate-200/60 p-4 lg:p-6">
          <TovarniListSheet
            data={data}
            prijevoznik={PRIJEVOZNIK}
            ukupnoPaketa={ukupnoPaketa}
            ukupnoTezina={ukupnoTezina}
            formKey={formKey}
            onField={setField}
            onRed={updateRed}
            onRemoveRed={removeRed}
            onAddRed={addRed}
            onNewBroj={newBroj}
          />
        </div>
      </div>
    </div>
  );
}

function TovarniListSheet({
  data,
  prijevoznik,
  ukupnoPaketa,
  ukupnoTezina,
  formKey,
  onField,
  onRed,
  onRemoveRed,
  onAddRed,
  onNewBroj,
}: {
  data: TovarniListData;
  prijevoznik: Prijevoznik;
  ukupnoPaketa: string;
  ukupnoTezina: string;
  formKey: number;
  onField: <K extends keyof TovarniListData>(key: K, value: TovarniListData[K]) => void;
  onRed: (index: number, key: keyof PosiljkaRed, value: string) => void;
  onRemoveRed: (index: number) => void;
  onAddRed: () => void;
  onNewBroj: () => void;
}) {
  return (
    <div
      id="tovarni-print"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm",
        margin: "0 auto",
        background: "#ffffff",
        color: "#000000",
        fontSize: "10px",
        lineHeight: 1.35,
        boxShadow: "0 10px 40px rgba(15, 23, 42, 0.18)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ maxWidth: "62%" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, lineHeight: 1.15 }}>
            {prijevoznik.naziv || "—"}
          </div>
          <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.06em", color: "#444" }}>
            PRIJEVOZNIK
          </div>
          {prijevoznik.adresa ? <div>{prijevoznik.adresa}</div> : null}
          <div style={{ color: "#222" }}>
            {prijevoznik.idBroj ? <span>ID/PDV broj: {prijevoznik.idBroj}</span> : null}
          </div>
          <div style={{ color: "#222" }}>
            {prijevoznik.telefon ? <span>Tel: {prijevoznik.telefon}&nbsp;&nbsp;</span> : null}
            {prijevoznik.email ? <span>{prijevoznik.email}</span> : null}
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: "38%" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "0.04em" }}>TOVARNI LIST</div>
          <div style={{ marginTop: "3px", display: "flex", justifyContent: "flex-end", gap: "4px" }}>
            <strong>Broj:</strong>
            <Editable
              formKey={formKey}
              value={data.brojTovarnogLista}
              onCommit={(v) => onField("brojTovarnogLista", v)}
              align="right"
              style={{ minWidth: "120px" }}
            />
            <button
              type="button"
              onClick={onNewBroj}
              title="Novi broj"
              className="no-print"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#f97316", padding: 0 }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
            <strong>Mjesto izdavanja:</strong>
            <Editable
              formKey={formKey}
              value={data.mjestoIzdavanja}
              onCommit={(v) => onField("mjestoIzdavanja", v)}
              align="right"
              style={{ minWidth: "90px" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
            <strong>Datum izdavanja:</strong>
            <Editable
              formKey={formKey}
              value={data.datumIzdavanja}
              onCommit={(v) => onField("datumIzdavanja", v)}
              align="right"
              style={{ minWidth: "90px" }}
            />
          </div>
        </div>
      </div>

      <div style={{ height: "8px" }} />

      <div style={{ display: "flex", border: "1px solid #000" }}>
        <FieldCell label="Mjesto utovara" borderRight>
          <Editable formKey={formKey} value={data.mjestoUtovara} onCommit={(v) => onField("mjestoUtovara", v)} bold />
        </FieldCell>
        <FieldCell label="Datum utovara" borderRight>
          <Editable formKey={formKey} value={data.datumUtovara} onCommit={(v) => onField("datumUtovara", v)} bold />
        </FieldCell>
        <FieldCell label="Reg. oznaka vozila" borderRight>
          <Editable
            formKey={formKey}
            value={data.voziloRegistracija}
            onCommit={(v) => onField("voziloRegistracija", v)}
            bold
            placeholder="—"
          />
        </FieldCell>
        <FieldCell label="Vozač">
          <Editable
            formKey={formKey}
            value={data.vozac}
            onCommit={(v) => onField("vozac", v)}
            bold
            placeholder="—"
          />
        </FieldCell>
      </div>

      <div style={{ height: "8px" }} />

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <Th width="4%">Rb.</Th>
            <Th width="20%">Primalac</Th>
            <Th width="24%">Adresa</Th>
            <Th width="13%">Mjesto</Th>
            <Th width="14%">Telefon</Th>
            <Th width="7%">Br. pak.</Th>
            <Th width="8%">Težina (kg)</Th>
            <Th width="10%">Potpis primaoca</Th>
          </tr>
        </thead>
        <tbody>
          {data.posiljke.map((red, index) => (
            <tr key={`${formKey}-${index}`} style={{ pageBreakInside: "avoid" }}>
              <Td center>
                <div style={{ position: "relative" }}>
                  {index + 1}
                  <button
                    type="button"
                    onClick={() => onRemoveRed(index)}
                    title="Ukloni red"
                    className="no-print"
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-3px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#dc2626",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              </Td>
              <Td>
                <Editable formKey={formKey} value={red.primalac} onCommit={(v) => onRed(index, "primalac", v)} placeholder="Ime i prezime" />
              </Td>
              <Td>
                <Editable formKey={formKey} value={red.adresa} onCommit={(v) => onRed(index, "adresa", v)} placeholder="Ulica i broj" />
              </Td>
              <Td>
                <Editable formKey={formKey} value={red.mjesto} onCommit={(v) => onRed(index, "mjesto", v)} placeholder="Grad" />
              </Td>
              <Td>
                <Editable formKey={formKey} value={red.telefon} onCommit={(v) => onRed(index, "telefon", v)} placeholder="Telefon" />
              </Td>
              <Td center>
                <Editable formKey={formKey} value={red.brojPaketa} onCommit={(v) => onRed(index, "brojPaketa", v)} align="center" />
              </Td>
              <Td center>
                <Editable formKey={formKey} value={red.tezina} onCommit={(v) => onRed(index, "tezina", v)} align="center" />
              </Td>
              <Td />
            </tr>
          ))}
          <tr style={{ pageBreakInside: "avoid" }}>
            <Td center colSpan={5}>
              <strong>UKUPNO ({data.posiljke.length} primalaca)</strong>
            </Td>
            <Td center>
              <strong>{ukupnoPaketa || "0"}</strong>
            </Td>
            <Td center>
              <strong>{ukupnoTezina}</strong>
            </Td>
            <Td />
          </tr>
        </tbody>
      </table>

      <button
        type="button"
        onClick={onAddRed}
        className="no-print"
        style={{
          marginTop: "6px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          border: "1px dashed #cbd5e1",
          borderRadius: "8px",
          background: "transparent",
          padding: "5px 10px",
          cursor: "pointer",
          fontWeight: 700,
          color: "#475569",
          fontSize: "10px",
        }}
      >
        <Plus size={13} /> Dodaj primaoca
      </button>

      <div style={{ height: "8px" }} />

      <div style={{ border: "1px solid #000", padding: "6px 8px", minHeight: "40px" }}>
        <div style={cellLabelStyle}>NAPOMENE</div>
        <Editable
          formKey={formKey}
          value={data.napomene}
          onCommit={(v) => onField("napomene", v)}
          placeholder="—"
        />
      </div>

      <div style={{ height: "16px", breakInside: "avoid" }} />

      <div style={{ display: "flex", textAlign: "center", breakInside: "avoid" }}>
        <SignatureBox
          title={`Isporučilac${data.isporucilac ? ` — ${data.isporucilac}` : ""}`}
          borderRight
        />
        <SignatureBox title="Prijevoznik (vozač)" />
      </div>

      <div style={{ marginTop: "10px", fontSize: "8px", color: "#555", textAlign: "center", breakInside: "avoid" }}>
        Tovarni list izdat u skladu sa Zakonom o cestovnom prijevozu. Svaki primalac potpisom u svom redu
        potvrđuje prijem pošiljke; isporučilac i prijevoznik potvrđuju utovar i preuzimanje tereta.
      </div>
    </div>
  );
}

const cellLabelStyle: React.CSSProperties = {
  fontSize: "7.5px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "#555",
  textTransform: "uppercase",
};

function Editable({
  value,
  onCommit,
  formKey,
  placeholder,
  align,
  bold,
  style,
}: {
  value: string;
  onCommit: (value: string) => void;
  formKey: number;
  placeholder?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
    // Sinhroniziraj sadržaj pri mount-u i na svaku promjenu formKey-a (skeniranje,
    // reset, brisanje reda, novi broj). Kucanje NE mijenja formKey, pa kursor ne skače.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      data-placeholder={placeholder}
      onInput={(event) => onCommit(event.currentTarget.textContent ?? "")}
      className="tl-edit"
      style={{
        minHeight: "1.15em",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textAlign: align ?? "left",
        fontWeight: bold ? 600 : undefined,
        ...style,
      }}
    />
  );
}

function SignatureBox({ title, borderRight }: { title: string; borderRight?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #000",
        borderRight: borderRight ? "none" : "1px solid #000",
        padding: "6px 8px",
        height: "64px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={cellLabelStyle}>{title}</div>
      <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", color: "#555" }}>
        Potpis i pečat
      </div>
    </div>
  );
}

function FieldCell({
  label,
  borderRight,
  children,
}: {
  label: string;
  borderRight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "5px 8px",
        borderRight: borderRight ? "1px solid #000" : "none",
        minWidth: 0,
      }}
    >
      <div style={cellLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

function Th({ children, width }: { children?: React.ReactNode; width?: string }) {
  return (
    <th
      style={{
        border: "1px solid #000",
        padding: "4px 5px",
        textAlign: "left",
        fontSize: "8.5px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        background: "#eeeeee",
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  center,
  colSpan,
}: {
  children?: React.ReactNode;
  center?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        border: "1px solid #000",
        padding: "3px 5px",
        textAlign: center ? "center" : "left",
        verticalAlign: "top",
        height: "18px",
        wordBreak: "break-word",
      }}
    >
      {children ?? "\u00A0"}
    </td>
  );
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

    reader.onerror = () => reject(new Error(`Ne mogu pročitati ${file.name}.`));
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

function sumNumbers(values: string[]) {
  const total = values.reduce((sum, value) => {
    const parsed = parseFloat(String(value).replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? sum + parsed : sum;
  }, 0);

  if (total === 0) {
    return "";
  }

  return Number.isInteger(total) ? String(total) : total.toFixed(2);
}

async function readJsonResponse<T extends { error?: string }>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return { error: `Zahtjev nije uspio, status ${response.status}.` } as T;
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
