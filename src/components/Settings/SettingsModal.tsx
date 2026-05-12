import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, User, HelpCircle as HelpIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Settings as SettingsType } from '../../shared/types';
import { getModalBackgroundStyle } from '../../shared/utils';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Tab = 'general' | 'account' | 'support';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data, updateSettings, addToast } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
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
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    updateSettings(settings);
  }, [settings, updateSettings]);

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
      style={bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`my-auto flex h-[600px] w-full max-w-4xl flex-row overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Sidebar */}
        <div className={`w-64 border-r flex flex-col overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className={`px-5 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Settings</h2>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-1 p-3">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-blue-100 text-blue-900'
                  : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
                  ? isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-blue-100 text-blue-900'
                  : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
                  ? isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-blue-100 text-blue-900'
                  : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
            <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {activeTab === 'general' && 'General Settings'}
              {activeTab === 'account' && 'Account'}
              {activeTab === 'support' && 'Support'}
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
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
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Appearance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Compact mode</div>
                        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Reduce spacing to show more bookmarks</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('compactMode')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.compactMode ?? false
                            ? 'bg-blue-600'
                            : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (settings.compactMode ?? false) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className={`p-3 rounded-md flex gap-2 items-start ${isDark ? 'bg-blue-950/30 border border-blue-900/50' : 'bg-blue-50 border border-blue-200'}`}>
                      <HelpIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        Compact mode hides descriptions and reduces size to accommodate more bookmarks per board.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Behavior Settings */}
                <section>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Behavior</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Open links in new tab</div>
                        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Open bookmarks in a new browser tab</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('openLinksInNewTab')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.openLinksInNewTab ?? false
                            ? 'bg-blue-600'
                            : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
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
                        <div className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Show bookmark descriptions</div>
                        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>Display saved descriptions below bookmark titles</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('showBookmarkDescriptions')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.showBookmarkDescriptions ?? true
                            ? 'bg-blue-600'
                            : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
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
              <div className={`py-8 text-center ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <p className="text-sm">Account settings coming soon</p>
              </div>
            )}

            {activeTab === 'support' && (
              <section>
                {showHelpSuccess ? (
                  <div className={`p-4 rounded-md text-sm ${isDark ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                    ✓ Thank you! Your message has been sent. We'll get back to you soon.
                  </div>
                ) : (
                  <div className="space-y-3 max-w-md">
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={helpEmail}
                      onChange={(e) => setHelpEmail(e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 text-sm ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
                    />
                    <textarea
                      placeholder="How can we help you?"
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value.slice(0, 500))}
                      rows={4}
                      className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 text-sm resize-none ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
                    />
                    <button
                      onClick={handleSendHelp}
                      className={`w-full py-2 rounded-md font-medium text-sm transition-colors ${isDark ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'}`}
                    >
                      Send Help Request
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>


        </div>
      </div>
    </div>,
    document.body
  );
}
