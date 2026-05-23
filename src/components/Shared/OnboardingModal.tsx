import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Sparkles, Star } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle, isNeoBrutalistTheme } from '../../shared/utils';

type OnboardingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const GITHUB_URL = 'https://github.com/sarvan-2187/Bookmrk';

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { data } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const modalBgStyle = getModalBackgroundStyle(data, isDark);
  const isNeoBrutalistMode = isNeoBrutalistTheme(data);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      style={isNeoBrutalistMode ? { backgroundColor: 'rgba(255, 255, 255, 0.88)' } : bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl ${isNeoBrutalistMode ? 'border-2 border-black shadow-[8px_8px_0_#000]' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isNeoBrutalistMode ? '#ffffff' : isDark ? '#000000' : '#ffffff', ...(isNeoBrutalistMode ? { backgroundImage: 'none' } : modalBgStyle) }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-6">
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black' : isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
            <Sparkles className="h-4 w-4" />
            Welcome to Bookmrk
          </div>

          <h2 className={`text-2xl font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Welcome To Bookmrk
          </h2>
          <p className={`mt-3 text-sm leading-6 ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Bookmrk is an open source project. If you like it, please star the GitHub repo and help support the project.
          </p>

          <div className={`mt-5 rounded-2xl border p-4 ${isNeoBrutalistMode ? 'border-2 border-black bg-white shadow-[2px_2px_0_#000]' : isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black' : isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Help support the project
                </h3>
                <p className={`mt-1 text-sm leading-6 ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Star the repo to show support and help more people discover Bookmrk.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              Get Started
            </button>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}
            >
              Star on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}