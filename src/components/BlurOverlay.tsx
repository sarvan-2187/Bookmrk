import { useStore } from '../store/useStore';
import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BlurOverlay() {
  const { toggleBlurMode, tempUnblurRect } = useStore();

  // If tempUnblurRect is provided, create an SVG mask that makes a rounded-rectangle hole
  let maskStyle: Record<string, any> | undefined;
  if (tempUnblurRect) {
    const { left, top, width, height } = tempUnblurRect;
    // corner radius relative to the smaller side of the rect
    const rx = Math.max(6, Math.round(Math.min(width, height) * 0.12));

    const svg = `<?xml version='1.0' encoding='utf-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${window.innerWidth} ${window.innerHeight}'>` +
      `<rect width='100%' height='100%' fill='black'/>` +
      `<rect x='${left}' y='${top}' width='${width}' height='${height}' rx='${rx}' ry='${rx}' fill='transparent'/>` +
      `</svg>`;

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    const url = `url("${dataUrl}")`;

    maskStyle = {
      maskImage: url,
      WebkitMaskImage: url,
    };
  }

  return (
    // allow pointer events to pass through the overlay so underlying items can still receive clicks
    <div style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', ...(maskStyle || {}) }} className="fixed inset-0 z-60 backdrop-blur-md bg-zinc-950/50 flex items-center justify-center pointer-events-none">
      <button 
        onClick={toggleBlurMode}
        // the button itself needs to be clickable
        className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md shadow-xl shadow-black/50 transition-transform hover:scale-105"
        style={{ position: 'fixed', right: 20, bottom: 20 }}
      >
        <Eye className="w-4 h-4" />
        <span className="font-medium text-sm">Unblur</span>
      </button>
    </div>
  );
}
