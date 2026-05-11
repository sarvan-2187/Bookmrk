import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { PageView } from './components/Page/PageView';
import { Toolbar } from './components/Toolbar';
import { BlurOverlay } from './components/BlurOverlay';
import { QuickSaveModal } from './components/Bookmark/QuickSaveModal';
import { SearchModal } from './components/Search/SearchModal';
import { BackgroundModal } from './components/Background/BackgroundModal';

export default function App() {
  const { initialize, isLoading, activeSidebar, blurMode, dragMode, data, toasts, removeToast, backgroundModalOpen, setBackgroundModalOpen, addToast } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/') return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if (isTypingTarget) return;
      if (dragMode) {
        event.preventDefault();
        addToast('Turn off Drag Mode to use search', 'info');
        return;
      }

      event.preventDefault();
      setIsSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragMode, addToast]);

  useEffect(() => {
    if (!dragMode) return;
    setIsSearchOpen(false);
    setBackgroundModalOpen(false);
  }, [dragMode, setBackgroundModalOpen]);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-mono">Loading...</div>;
  }

  const bg = data?.background || null;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = prefersDark;
  const defaultColor = prefersDark ? '#000000' : '#ffffff';

  const bgStyle: React.CSSProperties = bg
    ? bg.type === 'image'
      ? { backgroundImage: `url("${bg.value}")`, filter: 'blur(18px) scale(1.06)' }
      : { backgroundColor: bg.value }
    : { backgroundColor: defaultColor };

  return (
    <div className={`flex h-screen w-screen overflow-hidden relative ${isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-white text-zinc-900'}`}>
      {/* Background Layer (image or color) */}
      <div 
        className={`absolute inset-0 z-0 ${bg && bg.type === 'color' ? '' : isDark ? 'opacity-40' : 'opacity-15'} bg-cover bg-center bg-no-repeat`}
        style={bgStyle}
      />
      
      {/* Sidebar - Made glassy */}
      {activeSidebar && (
        <div className={`z-10 backdrop-blur-md border-r ${isDark ? 'bg-zinc-950/40 border-white/5' : 'bg-white/85 border-zinc-200 shadow-[0_10px_35px_rgba(0,0,0,0.06)]'}`}>
          <Sidebar />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative min-w-0 z-10">
        <Toolbar onOpenSearch={() => setIsSearchOpen(true)} />
        <main className={`flex-1 overflow-x-auto overflow-y-auto relative no-scrollbar ${isDark ? '' : 'bg-white/35'}`}>
          <PageView />
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`min-w-[220px] max-w-sm rounded-md px-4 py-2 shadow-lg ${t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm">{t.message}</div>
              <button onClick={() => removeToast(t.id)} className="text-xs opacity-70">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Background modal (rendered at root so it's centered) */}
      <BackgroundModal isOpen={backgroundModalOpen} onClose={() => setBackgroundModalOpen(false)} />

      {/* Global Modals / Overlays */}
      {blurMode && <BlurOverlay />}
      <QuickSaveModal />
      <SearchModal isOpen={isSearchOpen} data={data} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
