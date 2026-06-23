import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const UPLOAD_URL = "https://functions.poehali.dev/8252b181-3bca-4bb2-9927-93107032d9e6";

interface PhotoUploadProps {
  token: string;
  currentPhoto?: string;
  onUploaded: (url: string) => void;
}

export default function PhotoUpload({ token, currentPhoto, onUploaded }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentPhoto || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Можно загружать только изображения");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой. Максимум 5 МБ");
      return;
    }

    setError("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      const base64 = dataUrl.split(",")[1];
      try {
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, image: base64, contentType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onUploaded(data.url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
        setPreview(currentPhoto || "");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-28 h-28 cursor-pointer group"
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Фото профиля"
            className="w-28 h-28 object-cover"
          />
        ) : (
          <div className="w-28 h-28 bg-neutral-100 flex items-center justify-center border border-dashed border-neutral-300 group-hover:border-neutral-500 transition-colors">
            <Icon name="User" size={36} className="text-neutral-300 group-hover:text-neutral-400 transition-colors" />
          </div>
        )}

        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
          preview ? "bg-black/0 group-hover:bg-black/40" : ""
        }`}>
          {loading ? (
            <Icon name="Loader2" size={20} className="text-white animate-spin" />
          ) : (
            <Icon
              name="Camera"
              size={20}
              className={`text-white transition-opacity duration-200 ${preview ? "opacity-0 group-hover:opacity-100" : "opacity-0"}`}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => !loading && inputRef.current?.click()}
        className="text-xs uppercase tracking-wide text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        {loading ? "Загружаем..." : preview ? "Изменить фото" : "Добавить фото"}
      </button>

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
