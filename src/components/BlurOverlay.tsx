import { useStore } from '../store/useStore';
import { Eye } from 'lucide-react';

export function BlurOverlay() {
  const { toggleBlurMode } = useStore();

  return (
    // allow pointer events to pass through the overlay so underlying items can still receive clicks
    <div className="fixed inset-0 z-60 bg-zinc-950/25 flex items-center justify-center pointer-events-none">
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
