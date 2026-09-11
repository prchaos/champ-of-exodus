"use client";

import { useState, type ChangeEvent, type ClipboardEvent } from "react";

import { Button } from "@/components/ui/button";

type ImageFieldMode = "upload" | "paste" | "url";

const MODES: { key: ImageFieldMode; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "paste", label: "Paste" },
  { key: "url", label: "URL" },
];

function readFileAsDataUrl(file: File, onLoad: (dataUrl: string) => void, onError: (message: string) => void) {
  if (!file.type.startsWith("image/")) {
    onError("Please choose an image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result as string);
  reader.onerror = () => onError("Could not read that file.");
  reader.readAsDataURL(file);
}

export function ImageField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const [mode, setMode] = useState<ImageFieldMode>("upload");
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(file, (dataUrl) => {
      setError(null);
      onChange(dataUrl);
    }, setError);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) {
      setError("Clipboard does not contain an image.");
      return;
    }
    readFileAsDataUrl(file, (dataUrl) => {
      setError(null);
      onChange(dataUrl);
    }, setError);
  }

  function handleUrlChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    onChange(event.target.value.trim() || undefined);
  }

  return (
    <div>
      <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
        {MODES.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={mode === key ? "default" : "outline"}
            onClick={() => {
              setMode(key);
              setError(null);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {mode === "upload" && <input type="file" accept="image/*" onChange={handleFileChange} />}

      {mode === "paste" && (
        <div tabIndex={0} onPaste={handlePaste} className="paste-target">
          Click here, then press Ctrl+V (or Cmd+V) to paste an image.
        </div>
      )}

      {mode === "url" && (
        <input
          type="url"
          placeholder="https://example.com/image.png"
          defaultValue={value ?? ""}
          onChange={handleUrlChange}
        />
      )}

      {error && <p className="field-error">{error}</p>}

      {value && (
        <div style={{ marginTop: "0.6rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied source (data URL or external URL) */}
          <img src={value} alt="Event preview" className="image-preview" />
          <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(undefined)}>
              Remove image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
