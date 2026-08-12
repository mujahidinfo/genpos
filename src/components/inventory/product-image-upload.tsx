"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { useTranslation } from "@/lib/i18n/language-context";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react";

const MAX_BYTES = 4 * 1024 * 1024; // must match maxFileSize in the file router

export function ProductImageUpload({ value, onChange }: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Next/Image throws for unreachable hosts; fall back to a plain state instead
  // of rendering a broken frame.
  const [brokenPreview, setBrokenPreview] = useState(false);

  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url) {
        setBrokenPreview(false);
        onChange(url);
      }
      setProgress(0);
    },
    onUploadError: (e) => {
      setProgress(0);
      toast({
        title: t("inventory.uploadFailed"),
        description: e.message,
        variant: "destructive",
      });
    },
    onUploadProgress: setProgress,
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      // Validate client-side too, so the user gets an instant, translated error
      // rather than a round-trip rejection.
      if (!file.type.startsWith("image/")) {
        toast({ title: t("inventory.uploadNotImage"), variant: "destructive" });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast({ title: t("inventory.uploadTooLarge"), variant: "destructive" });
        return;
      }
      void startUpload([file]);
    },
    [startUpload, t, toast],
  );

  const hasImage = !!value && !brokenPreview;

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {t("inventory.productImage")}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so picking the same file twice still fires onChange.
          e.target.value = "";
        }}
      />

      {hasImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={value}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 420px"
              className="object-contain"
              onError={() => setBrokenPreview(true)}
              unoptimized
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="h-8 px-3 rounded-lg bg-white/95 backdrop-blur text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              {t("inventory.replaceImage")}
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); setBrokenPreview(false); }}
              disabled={isUploading}
              aria-label={t("inventory.removeImage")}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur flex items-center justify-center text-slate-500 shadow-sm hover:bg-white hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          disabled={isUploading}
          className={cn(
            "w-full rounded-xl border-2 border-dashed px-4 py-7 flex flex-col items-center justify-center gap-2 transition-colors",
            dragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40",
            isUploading && "cursor-wait",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">
                {t("inventory.uploading", { percent: Math.round(progress) })}
              </p>
              <div className="w-40 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                <ImagePlus className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {t("inventory.uploadCta")}
              </p>
              <p className="text-[10px] text-slate-400">{t("inventory.uploadHint")}</p>
            </>
          )}
        </button>
      )}

      {brokenPreview && value && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600 mt-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {t("inventory.imageUnreachable")}
        </p>
      )}
    </div>
  );
}
