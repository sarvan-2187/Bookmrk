import { useEffect, useState, type CSSProperties } from 'react';
import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { PageView } from './components/Page/PageView';
import { Toolbar } from './components/Toolbar';
import { BlurOverlay } from './components/BlurOverlay';
import { QuickSaveModal } from './components/Bookmark/QuickSaveModal';
import { SearchModal } from './components/Search/SearchModal';
import { BackgroundModal } from './components/Background/BackgroundModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { InputModal } from './components/Shared/InputModal';
import { OnboardingModal } from './components/Shared/OnboardingModal';
import { Image } from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'bookmrk_onboarding_seen_v1';

export default function App() {
  const { initialize, isLoading, activeSidebar, activePageId, blurMode, dragMode, data, toasts, removeToast, backgroundModalOpen, setBackgroundModalOpen, settingsModalOpen, closeSettingsModal, addToast, toggleSidebar, addPage, setActivePage, openSettingsModal, toggleBlurMode } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      // supported shortcuts: / (search), s (sidebar), p (new page), i (settings), x (toggle blur)
      if (!['/', 's', 'p', 'i', 'x'].includes(key)) return;
      if (['s', 'p', 'i', 'x'].includes(key) && (event.ctrlKey || event.metaKey || event.altKey)) return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if (isTypingTarget) return;

      // Sidebar toggle
      if (key === 's') {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // Search
      if (key === '/') {
        if (dragMode) {
          event.preventDefault();
          addToast('Turn off Drag Mode to use search', 'info');
          return;
        }
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }


      // New page -> open modal
      if (key === 'p') {
        event.preventDefault();
        if (dragMode) {
          addToast('Turn off Drag Mode to create a page', 'info');
          return;
        }
        setIsAddPageOpen(true);
        return;
      }

      // Open settings
      if (key === 'i') {
        event.preventDefault();
        if (dragMode) {
          addToast('Turn off Drag Mode to use this action', 'info');
          return;
        }
        openSettingsModal();
        return;
      }

      // Toggle blur/privacy
      if (key === 'x') {
        event.preventDefault();
        toggleBlurMode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragMode, addToast, toggleSidebar]);

  useEffect(() => {
    if (!dragMode) return;
    setIsSearchOpen(false);
    setBackgroundModalOpen(false);
  }, [dragMode, setBackgroundModalOpen]);

  useEffect(() => {
    if (isLoading) return;

    const hasSeenOnboarding = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    setShowOnboarding(!hasSeenOnboarding);
  }, [isLoading]);

  const closeOnboarding = () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-mono">Loading...</div>;
  }

  const bg = data?.background || null;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const layoutMode = data?.settings?.themeMode ?? 'discord';
  const isNeoBrutalistMode = layoutMode === 'neobrutalist';
  const isDark = !isNeoBrutalistMode && prefersDark;
  const isSimpleMode = layoutMode !== 'discord';
  const defaultColor = isNeoBrutalistMode ? '#ffffff' : prefersDark ? '#000000' : '#ffffff';

  const bgStyle: CSSProperties = bg
    ? bg.type === 'image'
      ? { backgroundImage: `url("${bg.value}")`, filter: 'blur(18px) scale(1.06)' }
      : { backgroundColor: bg.value }
    : { backgroundColor: defaultColor };

  const handleCreatePage = (name: string) => {
    addPage(name);
    const createdPage = useStore.getState().data?.pages.at(-1);
    if (createdPage) {
      setActivePage(createdPage.id);
    }
    addToast(`Page "${name}" created`, 'success');
  };

  // Note: removed the floating UnblurPreview — mask-based reveal is used instead.

  return (
    <div className={`flex h-screen w-screen overflow-hidden relative ${isNeoBrutalistMode ? 'bg-white text-black' : isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-white text-zinc-900'}`}>
      {/* Background Layer (image or color) */}
      <div 
        className={`absolute inset-0 z-0 ${bg && bg.type === 'color' ? '' : isDark ? 'opacity-40' : 'opacity-15'} bg-cover bg-center bg-no-repeat`}
        style={bgStyle}
      />

      {isSimpleMode && !isNeoBrutalistMode && (
        <button
          type="button"
          onClick={() => setBackgroundModalOpen(true)}
          className={`fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
            isNeoBrutalistMode
              ? 'border-2 border-black bg-white text-black shadow-[4px_4px_0_#000] hover:bg-zinc-100'
              : isDark
                ? 'border-white/10 bg-zinc-950/70 text-zinc-100 hover:bg-zinc-900'
                : 'border-zinc-200 bg-white/90 text-zinc-700 hover:bg-zinc-50'
          }`}
          title="Backgrounds"
          aria-label="Open backgrounds"
        >
          <Image className="h-5 w-5" />
        </button>
      )}
      
      {/* Sidebar - Made glassy */}
      {!isSimpleMode && activeSidebar && (
        <div className={`z-10 backdrop-blur-md border-r ${isNeoBrutalistMode ? 'bg-white border-black' : isDark ? 'bg-zinc-950/40 border-white/5' : 'bg-white/85 border-zinc-200 shadow-[0_10px_35px_rgba(0,0,0,0.06)]'}`}>
          <Sidebar />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative min-w-0 z-10">
        <Toolbar onOpenSearch={() => setIsSearchOpen(true)} onAddPage={() => setIsAddPageOpen(true)} layoutMode={layoutMode} />
        <main className={`flex-1 overflow-x-auto overflow-y-auto relative no-scrollbar ${isNeoBrutalistMode ? 'bg-white text-black' : isDark ? '' : 'bg-white/35'}`}>
          <PageView />
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`min-w-55 max-w-sm rounded-md px-4 py-2 shadow-lg ${t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
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
      {/* Mask-based unblur reveals the bookmark underneath; no floating preview component */}
      <SettingsModal isOpen={settingsModalOpen} onClose={closeSettingsModal} />
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
      <InputModal
        isOpen={isAddPageOpen}
        title="New Page"
        label="Page name"
        placeholder="My Page"
        onClose={() => setIsAddPageOpen(false)}
        onSave={handleCreatePage}
      />
    </div>
  );
}
