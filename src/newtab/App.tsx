import { useEffect, useRef, useState } from 'react';
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
import { ShortcutsHelpModal } from './components/Shared/ShortcutsHelpModal';
import { Toaster } from './components/Sonner';
import { resolveIsDark, resolveNavStyle } from './shared/utils';
import { promptNewPage } from './shared/actions';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'bookmrk_onboarding_seen_v1';

export default function App() {
  const { initialize, isLoading, activeSidebar, blurMode, data, backgroundModalOpen, setBackgroundModalOpen, settingsModalOpen, closeSettingsModal, addToast, toggleSidebar, openSettingsModal, toggleBlurMode, prompt, closePrompt, importData } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // '>' opens the palette straight into command mode (Ctrl+K); '' is plain search ('/').
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prefersDarkOS, setPrefersDarkOS] = useState(
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const onChange = (e: MediaQueryListEvent) => setPrefersDarkOS(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const layoutMode = data?.settings?.themeMode ?? 'discord';
  const isDark = resolveIsDark(data?.settings?.colorMode, prefersDarkOS);
  const isNeoBrutalistMode = layoutMode === 'neobrutalist';
  // Layout is the user's own setting, independent of which theme is active.
  const navStyle = resolveNavStyle(data?.settings);

  // Everything downstream reads these from CSS (see styles/themes.css) instead
  // of re-deriving isDark/isNeoBrutalist/... booleans per component.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', layoutMode);
    document.documentElement.setAttribute('data-color-mode', isNeoBrutalistMode ? 'light' : isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-font-family', data?.settings?.fontFamily ?? 'plus-jakarta-sans');
  }, [layoutMode, isDark, isNeoBrutalistMode, data?.settings?.fontFamily]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMod = event.ctrlKey || event.metaKey;

      const target = event.target as HTMLElement | null;
      const isTypingTarget = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      // Command palette: Ctrl/Cmd+K works even while typing elsewhere, like most apps.
      if (isMod && key === 'k') {
        event.preventDefault();
        setSearchInitialQuery('>');
        setIsSearchOpen(true);
        return;
      }

      if (isTypingTarget) return;
      if (!['/', 's', 'p', 'i', 'x', '?'].includes(key)) return;
      if (['s', 'p', 'i', 'x'].includes(key) && isMod) return;

      if (key === 's') {
        event.preventDefault();
        // Rather than dying silently in the tabs layout, say where to change it.
        if (resolveNavStyle(useStore.getState().data?.settings) === 'tabs') {
          addToast('Sidebar is off in the Tabs layout — switch it in Settings → Appearance → Layout', 'info');
          return;
        }
        toggleSidebar();
        return;
      }

      if (key === '/') {
        event.preventDefault();
        setSearchInitialQuery('');
        setIsSearchOpen(true);
        return;
      }

      if (key === 'p') {
        event.preventDefault();
        promptNewPage();
        return;
      }

      if (key === 'i') {
        event.preventDefault();
        openSettingsModal();
        return;
      }

      if (key === 'x') {
        event.preventDefault();
        toggleBlurMode();
        return;
      }

      if (key === '?') {
        event.preventDefault();
        setIsShortcutsHelpOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast, toggleSidebar, openSettingsModal, toggleBlurMode]);

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
    return (
      <div className="h-screen w-screen flex items-center justify-center font-mono" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
        Loading...
      </div>
    );
  }

  const bg = data?.background || null;
  const bgStyle = bg
    ? bg.type === 'image'
      ? { backgroundImage: `url("${bg.value}")`, filter: 'blur(18px) scale(1.06)' }
      : { backgroundColor: bg.value }
    : { backgroundColor: 'var(--surface)' };

  return (
    <div className="flex h-screen w-screen overflow-hidden relative" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
      {/* Background Layer (image or color) */}
      <div
        className={`absolute inset-0 z-0 ${bg && bg.type === 'color' ? '' : isDark ? 'opacity-40' : 'opacity-15'} bg-cover bg-center bg-no-repeat`}
        style={bgStyle}
      />

      {/* Sidebar — shown by layout choice, not by theme. Backgrounds and the
          other data actions live in the toolbar's overflow menu in both
          layouts, so no theme can leave a feature unreachable. */}
      {navStyle === 'sidebar' && activeSidebar && (
        <div className="z-10 ui-divider-r" style={{ backgroundColor: 'var(--surface-raised)', backdropFilter: 'var(--surface-blur)' }}>
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative min-w-0 z-10">
        <Toolbar
          onOpenSearch={() => { setSearchInitialQuery(''); setIsSearchOpen(true); }}
          onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
          onOpenImportFilePicker={() => importInputRef.current?.click()}
        />
        <main className="flex-1 overflow-x-auto overflow-y-auto relative no-scrollbar">
          <PageView />
        </main>
      </div>

      <Toaster
        theme="system"
        position="top-right"
        richColors
        closeButton
        className="toaster group"
        style={{ fontFamily: 'var(--font-sans)' }}
        icons={{
          success: <CircleCheckIcon className="h-4 w-4" />,
          info: <InfoIcon className="h-4 w-4" />,
          warning: <TriangleAlertIcon className="h-4 w-4" />,
          error: <OctagonXIcon className="h-4 w-4" />,
          loading: <Loader2Icon className="h-4 w-4 animate-spin" />,
        }}
        toastOptions={{
          duration: 4000,
          classNames: {
            toast: 'cn-toast',
          },
        }}
      />

      <BackgroundModal isOpen={backgroundModalOpen} onClose={() => setBackgroundModalOpen(false)} />

      <QuickSaveModal />
      <SearchModal
        isOpen={isSearchOpen}
        initialQuery={searchInitialQuery}
        data={data}
        onClose={() => setIsSearchOpen(false)}
        onOpenShortcutsHelp={() => { setIsSearchOpen(false); setIsShortcutsHelpOpen(true); }}
        onOpenImportFilePicker={() => importInputRef.current?.click()}
      />
      <ShortcutsHelpModal isOpen={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} />
      <SettingsModal isOpen={settingsModalOpen} onClose={closeSettingsModal} />
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
      {/* One prompt for the whole app (new page / new board / rename), raised
          from the store so the palette and every surface share the same flow. */}
      <InputModal
        isOpen={Boolean(prompt)}
        title={prompt?.title}
        label={prompt?.label}
        placeholder={prompt?.placeholder}
        maxLength={prompt?.maxLength}
        onClose={closePrompt}
        onSave={(value) => prompt?.onSave(value)}
      />

      {/* Shared by the toolbar menu and the 'Import JSON' command. */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="sr-only"
        aria-label="Import Bookmrk JSON export"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await importData(file).catch(() => {});
          event.target.value = '';
        }}
      />
      {blurMode && <BlurOverlay />}
    </div>
  );
}
