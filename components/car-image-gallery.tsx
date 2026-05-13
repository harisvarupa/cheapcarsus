"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

export function CarImageGallery({
  images,
  title,
  sold,
}: {
  images: string[];
  title: string;
  sold: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const currentImage = images[selectedIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  const showPreviousImage = () => {
    setSelectedIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const showNextImage = () => {
    setSelectedIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) {
      return;
    }

    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current || !hasMultipleImages) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX > 0) {
      showPreviousImage();
      return;
    }

    showNextImage();
  };

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden bg-slate-200 shadow-2xl shadow-slate-900/12 sm:aspect-square sm:rounded-[2.5rem] lg:aspect-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={currentImage}
          alt={`${title} image ${selectedIndex + 1}`}
          width={1200}
          height={800}
          className="h-full w-full object-cover lg:h-[520px]"
          priority
          unoptimized
        />

        {sold ? (
          <div className="absolute left-6 top-6 rounded-full bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white">
            Sold
          </div>
        ) : null}

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Show previous vehicle image"
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label="Show next vehicle image"
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-4 py-2 text-sm font-black text-white backdrop-blur">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="mt-4 hidden grid-cols-3 gap-3 sm:grid sm:grid-cols-4">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show vehicle image ${index + 1}`}
              className={`overflow-hidden rounded-2xl border-2 bg-slate-100 transition ${
                selectedIndex === index
                  ? "border-orange-500 shadow-lg shadow-orange-500/20"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                width={300}
                height={210}
                className="h-24 w-full object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
