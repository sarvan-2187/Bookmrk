import { useStore } from '../store/useStore';
import { Eye } from 'lucide-react';

export function BlurOverlay() {
  const { toggleBlurMode } = useStore();

  return (
    // allow pointer events to pass through the overlay so underlying items can still receive clicks
    <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none" style={{ backgroundColor: 'rgba(9, 9, 11, 0.25)' }}>
      <button
        onClick={toggleBlurMode}
        // the button itself needs to be clickable
        className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-md shadow-xl shadow-black/50 transition-transform hover:scale-105"
        style={{ position: 'fixed', right: 20, bottom: 20, backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
        aria-label="Turn off privacy blur">
        <Eye className="w-4 h-4" />
        <span className="font-medium text-sm">Unblur</span>
      </button>
    </div>
  );
}
