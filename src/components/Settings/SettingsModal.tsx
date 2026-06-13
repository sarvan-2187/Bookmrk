import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, User, HelpCircle as HelpIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Settings as SettingsType } from '../../shared/types';
import { getModalBackgroundStyle, isNeoBrutalistTheme } from '../../shared/utils';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Tab = 'general' | 'account' | 'support';

const FONT_OPTIONS: Array<{ value: NonNullable<SettingsType['fontFamily']>; label: string; preview: string }> = [
  { value: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', preview: 'Default clean UI font' },
  { value: 'satoshi', label: 'Satoshi', preview: 'Modern geometric sans' },
  { value: 'google-sans', label: 'Google Sans', preview: 'Product-style rounded sans' },
  { value: 'electrolize', label: 'Electrolize', preview: 'Technical sci-fi sans' },
  { value: 'space-grotesk', label: 'Space Grotesk', preview: 'Clean modern grotesk' },
  { value: 'comic-sans', label: 'Comic Sans', preview: 'Playful casual classic' },
  { value: 'dm-mono', label: 'DM Mono', preview: 'Readable monospaced font' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', preview: 'Developer-friendly mono' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data, updateSettings, addToast, activePageId, deletePage, dragMode } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isNeoBrutalistMode = isNeoBrutalistTheme(data);
  
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<SettingsType>(data?.settings || {});
  const [helpEmail, setHelpEmail] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [showHelpSuccess, setShowHelpSuccess] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && data?.settings) {
      setSettings(data.settings);
      setActiveTab('general');
      setHelpEmail('');
      setHelpMessage('');
      setShowHelpSuccess(false);
      isInitialized.current = false;
    }
  }, [isOpen, data?.settings]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, [isOpen]);

  const [confirmDeletePage, setConfirmDeletePage] = useState(false);

  const handleDeleteCurrentPage = () => {
    if (dragMode) {
      addToast('Turn off Drag Mode to use this action', 'info');
      return;
    }

    if (!data) return;

    if ((data.pages?.length ?? 0) <= 1) {
      addToast('Cannot delete the last remaining page', 'error');
      return;
    }

    if (!confirmDeletePage) {
      addToast('Please confirm deletion by checking the box', 'info');
      return;
    }

    if (!activePageId) return;

    try {
      deletePage(activePageId);
      addToast('Page deleted', 'success');
      setConfirmDeletePage(false);
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete page', 'error');
    }
  };

  const handleToggle = (key: keyof SettingsType) => {
    if (key === 'compactMode') {
      // If turning on compact mode, turn off show descriptions
      const newSettings = { ...settings, [key]: !settings[key] };
      if (!settings.compactMode) {
        newSettings.showBookmarkDescriptions = false;
      }
      setSettings(newSettings);
    } else if (key === 'showBookmarkDescriptions') {
      // If turning on show descriptions, turn off compact mode
      const newSettings = { ...settings, [key]: !settings[key] };
      if (!settings.showBookmarkDescriptions) {
        newSettings.compactMode = false;
      }
      setSettings(newSettings);
    } else {
      // For other toggles, just toggle normally
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
    }
  };

  const handleFontChange = (fontFamily: NonNullable<SettingsType['fontFamily']>) => {
    setSettings({ ...settings, fontFamily });
  };

  const handleSaveSettings = () => {
    try {
      updateSettings(settings);
      addToast('Settings saved', 'success');
    } catch (error) {
      console.error('Failed to save settings', error);
      addToast('Failed to save settings', 'error');
    }
  };

  const handleSendHelp = async () => {
    if (!helpEmail.trim() || !helpMessage.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const response = await fetch('https://ntfy.sh/bookmrk-help-v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Title': `Help Request from ${helpEmail}`,
        },
        body: JSON.stringify({
          email: helpEmail,
          message: helpMessage,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setShowHelpSuccess(true);
        setHelpEmail('');
        setHelpMessage('');
        addToast('Help request sent successfully', 'success');
        setTimeout(() => setShowHelpSuccess(false), 3000);
      } else {
        addToast('Failed to send help request', 'error');
      }
    } catch (error) {
      console.error('Error sending help request:', error);
      addToast('Failed to send help request', 'error');
    }
  };

  const bgIsImage = data?.background?.type === 'image';
  const modalBgStyle = getModalBackgroundStyle(data, isDark);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto p-4 md:items-center"
      style={isNeoBrutalistMode ? { backgroundColor: 'rgba(255, 255, 255, 0.88)' } : bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`my-auto flex h-150 w-full max-w-4xl flex-row overflow-hidden rounded-2xl border shadow-2xl ${isNeoBrutalistMode ? 'border-2 border-black shadow-[8px_8px_0_#000]' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isNeoBrutalistMode ? '#ffffff' : isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Sidebar */}
        <div className={`w-64 border-r flex flex-col overflow-hidden ${isNeoBrutalistMode ? 'border-black bg-white' : isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className={`px-5 py-4 border-b ${isNeoBrutalistMode ? 'border-black' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <h2 className={`text-lg font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Settings</h2>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-1 p-3">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000]' : isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-blue-100 text-blue-900'
                  : isNeoBrutalistMode ? 'text-black hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000]' : isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-blue-100 text-blue-900'
                  : isNeoBrutalistMode ? 'text-black hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                activeTab === 'support'
                  ? isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000]' : isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-blue-100 text-blue-900'
                  : isNeoBrutalistMode ? 'text-black hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <HelpIcon className="w-4 h-4" />
              Support
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <h3 className={`text-lg font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {activeTab === 'general' && 'General Settings'}
              {activeTab === 'account' && 'Account'}
              {activeTab === 'support' && 'Support'}
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-md transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Appearance Settings */}
                <section>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Appearance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Compact mode</div>
                        <div className={`text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Reduce spacing to show more bookmarks</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('compactMode')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.compactMode ?? false
                            ? isNeoBrutalistMode ? 'bg-black' : 'bg-blue-600'
                            : isNeoBrutalistMode ? 'bg-white border-2 border-black' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (settings.compactMode ?? false) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className={`p-3 rounded-md flex gap-2 items-start ${isNeoBrutalistMode ? 'border-2 border-black bg-white shadow-[2px_2px_0_#000]' : isDark ? 'bg-blue-950/30 border border-blue-900/50' : 'bg-blue-50 border border-blue-200'}`}>
                      <HelpIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <p className={`text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        Compact mode hides descriptions and reduces size to accommodate more bookmarks per board.
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <div className={`text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Font family</div>
                          <div className={`text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Choose the UI typeface for the app</div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${isNeoBrutalistMode ? 'border-2 border-black text-black' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                          {FONT_OPTIONS.find((option) => option.value === (settings.fontFamily ?? 'plus-jakarta-sans'))?.label}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {FONT_OPTIONS.map((option) => {
                          const selected = (settings.fontFamily ?? 'plus-jakarta-sans') === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFontChange(option.value)}
                              className={`rounded-lg border px-3 py-3 text-left transition-colors ${selected ? (isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000]' : isDark ? 'border-zinc-500 bg-zinc-800 text-zinc-100' : 'border-zinc-400 bg-zinc-100 text-zinc-900') : (isNeoBrutalistMode ? 'border-black bg-white text-black hover:bg-zinc-100' : isDark ? 'border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-900' : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50')}`}
                              style={{ fontFamily: `var(--font-${option.value})` }}
                            >
                              <div className="text-sm font-medium">{option.label}</div>
                              <div className={`mt-1 text-xs ${selected ? (isNeoBrutalistMode ? 'text-white/75' : isDark ? 'text-zinc-300' : 'text-zinc-600') : (isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-500')}`}>{option.preview}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Pages - Danger Zone */}
                <section className={`rounded-xl border p-4 ${isNeoBrutalistMode ? 'border-2 border-black bg-white shadow-[2px_2px_0_#000]' : isDark ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 ${isDark ? 'text-rose-300' : 'text-rose-600'}`} />
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-rose-200' : 'text-rose-700'}`}>Delete current page</h4>
                      <p className={`mt-1 text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-rose-200/80' : 'text-rose-700/80'}`}>
                        Deletes the active page including all boards and bookmarks inside it. This cannot be undone.
                      </p>
                      <label className={`mt-3 flex items-center gap-2 text-xs ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                        <input
                          type="checkbox"
                          checked={confirmDeletePage}
                          onChange={(event) => setConfirmDeletePage(event.target.checked)}
                          className="h-3.5 w-3.5"
                        />
                        I understand and want to delete the active page
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!confirmDeletePage}
                      onClick={handleDeleteCurrentPage}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${confirmDeletePage ? isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-300/40 text-rose-500 cursor-not-allowed'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Active Page</span>
                    </button>
                  </div>
                </section>

                {/* Behavior Settings */}
                <section>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Behavior</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Open links in new tab</div>
                        <div className={`text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Open bookmarks in a new browser tab</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('openLinksInNewTab')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.openLinksInNewTab ?? false
                            ? isNeoBrutalistMode ? 'bg-black' : 'bg-blue-600'
                            : isNeoBrutalistMode ? 'bg-white border-2 border-black' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (settings.openLinksInNewTab ?? false) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Show bookmark descriptions</div>
                        <div className={`text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Display saved descriptions below bookmark titles</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('showBookmarkDescriptions')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.showBookmarkDescriptions ?? true
                            ? isNeoBrutalistMode ? 'bg-black' : 'bg-blue-600'
                            : isNeoBrutalistMode ? 'bg-white border-2 border-black' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (settings.showBookmarkDescriptions ?? true) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {activeTab === 'account' && (
              <div className={`py-8 text-center ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <p className="text-sm">Account settings coming soon</p>
              </div>
            )}

            {activeTab === 'support' && (
              <section>
                {showHelpSuccess ? (
                  <div className={`p-4 rounded-md text-sm ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000]' : isDark ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                    ✓ Thank you! Your message has been sent. We'll get back to you soon.
                  </div>
                ) : (
                  <div className="space-y-3 max-w-md">
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={helpEmail}
                      onChange={(e) => setHelpEmail(e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 text-sm ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
                    />
                    <textarea
                      placeholder="How can we help you?"
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value.slice(0, 500))}
                      rows={4}
                      className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 text-sm resize-none ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
                    />
                    <button
                      onClick={handleSendHelp}
                      className={`w-full py-2 rounded-md font-medium text-sm transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : isDark ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'}`}
                    >
                      Send Help Request
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className={`flex items-center justify-between gap-3 border-t px-6 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <p className={`text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Changes are saved only when you click Save.
            </p>
            <button
              type="button"
              onClick={handleSaveSettings}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}
            >
              Save Settings
            </button>
          </div>


        </div>
      </div>
    </div>,
    document.body
  );
}
