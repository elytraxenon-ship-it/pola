"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/language-context";

type ImageKind = "avatar" | "cover" | "post" | "story";

interface ImageCropDialogProps {
  file: File | null;
  kind: ImageKind;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: (positionX: number, positionY: number) => void;
}

export function ImageCropDialog({ file, kind, isSaving, onCancel, onConfirm }: ImageCropDialogProps) {
  const { language, dir } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState("");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragPoint = useRef<{ x: number; y: number } | null>(null);
  const isAvatar = kind === "avatar";
  const isPost = kind === "post";
  const isStory = kind === "story";
  const title = isAvatar
    ? (language === "en" ? "Adjust profile photo" : "وێنەی پڕۆفایل ڕێک بخە")
    : isPost
      ? (language === "en" ? "Adjust post image" : "وێنەی پۆست ڕێک بخە")
      : isStory
        ? (language === "en" ? "Adjust story image" : "وێنەی سات ڕێک بخە")
      : (language === "en" ? "Adjust cover photo" : "وێنەی بەرگ ڕێک بخە");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPosition({ x: 50, y: 50 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isSaving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragPoint.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragPoint.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - dragPoint.current.x;
    const dy = event.clientY - dragPoint.current.y;
    dragPoint.current = { x: event.clientX, y: event.clientY };
    setPosition((previous) => ({
      x: Math.max(0, Math.min(100, previous.x - dx / rect.width * 100)),
      y: Math.max(0, Math.min(100, previous.y - dy / rect.height * 100)),
    }));
  };

  const onPointerUp = () => {
    dragPoint.current = null;
    setIsDragging(false);
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => { if (!open && !isSaving) onCancel(); }}>
      <DialogContent
        dir={dir}
        className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border-border/70 p-4 shadow-2xl sm:w-full sm:p-6"
        showCloseButton={!isSaving}
      >
        <DialogHeader className="pr-7">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <ImagePlus className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {language === "en"
              ? "Drag the image to frame it. Your preview updates before anything is saved."
              : "وێنەکە ڕابکێشە بۆ ڕێکخستنی چوارچێوەکە؛ پێش پاشەکەوتکردن پێشبینینەکە دەگۆڕێت."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`relative mx-auto overflow-hidden bg-muted ring-1 ring-border/70 ${
            isAvatar
              ? "aspect-square w-52 max-w-full rounded-full sm:w-60"
              : isPost
                ? "aspect-[4/3] w-full rounded-xl sm:rounded-2xl"
                : isStory
                  ? "mx-auto h-[min(54dvh,26rem)] aspect-[9/16] max-w-full rounded-xl sm:rounded-2xl"
                : "aspect-[2.67/1] w-full rounded-xl sm:rounded-2xl"
          }`}>
            {previewUrl && (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`absolute inset-0 touch-none select-none ${isSaving ? "cursor-wait" : isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              >
                <img
                  src={previewUrl}
                  alt={language === "en" ? "Image crop preview" : "پێشبینینی وێنە"}
                  draggable={false}
                  className="pointer-events-none h-full w-full object-cover"
                  style={{ objectPosition: `${position.x}% ${position.y}%` }}
                />
                {isAvatar && (
                  <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/35" />
                )}
                {!isDragging && !isSaving && (
                  <span className="pointer-events-none absolute inset-x-2 bottom-2 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur sm:bottom-3 sm:px-3 sm:text-xs">
                    <Move className="h-3 w-3" />
                    {language === "en" ? "Drag to move" : "ڕابکێشە بۆ جووڵاندن"}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:grid-cols-2 sm:p-4">
            {(["x", "y"] as const).map((axis) => (
              <label key={axis} className="space-y-1.5">
                <span className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>{axis === "x" ? (language === "en" ? "Horizontal" : "ئاسۆیی") : (language === "en" ? "Vertical" : "ستوونی")}</span>
                  <span>{Math.round(position[axis])}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position[axis]}
                  disabled={isSaving}
                  aria-label={axis === "x" ? "Horizontal image position" : "Vertical image position"}
                  onChange={(event) => setPosition((previous) => ({ ...previous, [axis]: Number(event.target.value) }))}
                  className="h-2 w-full cursor-pointer accent-primary disabled:cursor-wait"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setPosition({ x: 50, y: 50 })} className="w-full gap-2 sm:w-auto">
              <RotateCcw className="h-3.5 w-3.5" />
              {language === "en" ? "Reset framing" : "گەڕاندنەوەی چوارچێوە"}
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel} className="w-full sm:w-auto">
                {language === "en" ? "Cancel" : "پاشگەزبوونەوە"}
              </Button>
              <Button type="button" disabled={!file || isSaving} onClick={() => onConfirm(position.x, position.y)} className="w-full gap-2 sm:w-auto">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSaving
                  ? (language === "en" ? "Saving…" : "پاشەکەوت دەکرێت...")
                  : isStory
                    ? (language === "en" ? "Crop and continue" : "ڕێکخستن و بەردەوامبوون")
                    : (language === "en" ? "Confirm and save" : "پەسەندکردن و پاشەکەوتکردن")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
