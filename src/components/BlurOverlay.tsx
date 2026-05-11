import { useStore } from '../store/useStore';
import { Eye } from 'lucide-react';

export function BlurOverlay() {
  const { toggleBlurMode } = useStore();
  
  return (
    <div className="fixed inset-0 z-50 backdrop-blur-md bg-zinc-950/50 flex items-center justify-center pointer-events-auto">
      <button 
        onClick={toggleBlurMode}
        className="flex items-center gap-3 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg shadow-xl shadow-black/50 transition-transform hover:scale-105"
      >
        <Eye className="w-5 h-5" />
        <span className="font-medium">Unblur Screen</span>
      </button>
    </div>
  );
}
