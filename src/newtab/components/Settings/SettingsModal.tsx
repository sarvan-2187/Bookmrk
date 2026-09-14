import { useEffect, useId, useState } from 'react';
import { X, Settings, User, HelpCircle as HelpIcon, AlertTriangle, Trash2, Sun, Moon, Laptop, PanelLeft, LayoutGrid } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Settings as SettingsType, ColorMode, NavStyle } from '../../shared/types';
import { resolveNavStyle } from '../../shared/utils';
import { Modal } from '../Shared/Modal';
import { Button } from '../Shared/ui/Button';
import { Field } from '../Shared/ui/Field';
import { IconButton } from '../Shared/ui/IconButton';
import { Panel } from '../Shared/ui/Panel';

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

const COLOR_MODE_OPTIONS: Array<{ value: ColorMode; label: string; icon: typeof Sun }> = [
  { value: 'system', label: 'System', icon: Laptop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const NAV_STYLE_OPTIONS: Array<{ value: NavStyle; label: string; icon: typeof Sun }> = [
  { value: 'sidebar', label: 'Sidebar', icon: PanelLeft },
  { value: 'tabs', label: 'Tabs', icon: LayoutGrid },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors [border-width:var(--border-width)]"
      style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--surface-muted)', borderColor: 'var(--border)' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  );
}

/** Segmented picker used by both Color mode and Layout. Local to this file —
 *  two call sites in one screen isn't a shared primitive, just shared markup. */
function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Array<{ value: T; label: string; icon: typeof Sun }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--text)' }}>{legend}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(({ value: optionValue, label, icon: Icon }) => {
          const selected = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(optionValue)}
              className="flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors [border-width:var(--border-width)]"
              style={{
                borderColor: 'var(--border)',
                ...(selected
                  ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-muted)' }),
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data, updateSettings, addToast, activePageId, deletePage } = useStore();
  const titleId = useId();

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<SettingsType>(data?.settings || {});
  const [helpEmail, setHelpEmail] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [showHelpSuccess, setShowHelpSuccess] = useState(false);
  const [confirmDeletePage, setConfirmDeletePage] = useState(false);

  useEffect(() => {
    if (isOpen && data?.settings) {
      setSettings(data.settings);
      setActiveTab('general');
      setHelpEmail('');
      setHelpMessage('');
      setShowHelpSuccess(false);
    }
  }, [isOpen, data?.settings]);

  const handleDeleteCurrentPage = () => {
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
      // deletePage() shows the "Deleted..." toast with an Undo action itself.
      deletePage(activePageId);
      setConfirmDeletePage(false);
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete page', 'error');
    }
  };

  const handleToggle = (key: keyof SettingsType) => {
    if (key === 'compactMode') {
      const newSettings = { ...settings, [key]: !settings[key] };
      if (!settings.compactMode) newSettings.showBookmarkDescriptions = false;
      setSettings(newSettings);
    } else if (key === 'showBookmarkDescriptions') {
      const newSettings = { ...settings, [key]: !settings[key] };
      if (!settings.showBookmarkDescriptions) newSettings.compactMode = false;
      setSettings(newSettings);
    } else {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  const handleFontChange = (fontFamily: NonNullable<SettingsType['fontFamily']>) => {
    setSettings({ ...settings, fontFamily });
  };

  const handleColorModeChange = (colorMode: ColorMode) => {
    setSettings({ ...settings, colorMode });
  };

  const handleNavStyleChange = (navStyle: NavStyle) => {
    setSettings({ ...settings, navStyle });
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

  if (!isOpen) return null;

  const tabButton = (tab: Tab, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors hover:opacity-90"
      style={activeTab === tab ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' } : { color: 'var(--text-muted)' }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="my-auto flex h-150 w-full max-w-4xl flex-row overflow-hidden rounded-2xl">
      {/* Sidebar */}
      <div className="w-64 flex flex-col overflow-hidden ui-divider-r" style={{ backgroundColor: 'var(--surface-muted)' }}>
        <div className="px-5 py-4 ui-divider-b">
          <h2 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Settings</h2>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 p-3">
          {tabButton('general', <Settings className="w-4 h-4" />, 'General')}
          {tabButton('account', <User className="w-4 h-4" />, 'Account')}
          {tabButton('support', <HelpIcon className="w-4 h-4" />, 'Support')}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 ui-divider-b">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {activeTab === 'general' && 'General Settings'}
            {activeTab === 'account' && 'Account'}
            {activeTab === 'support' && 'Support'}
          </h3>
          <IconButton onClick={onClose} aria-label="Close settings">
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Appearance</h4>
                <div className="space-y-4">
                  <div>
                    <SegmentedControl
                      legend="Color mode"
                      options={COLOR_MODE_OPTIONS}
                      value={settings.colorMode ?? 'system'}
                      onChange={handleColorModeChange}
                    />
                  </div>

                  <div>
                    <SegmentedControl
                      legend="Layout"
                      options={NAV_STYLE_OPTIONS}
                      value={resolveNavStyle(settings)}
                      onChange={handleNavStyleChange}
                    />
                    <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      How pages are navigated. Independent of your theme — every control is available in both layouts.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Compact mode</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Reduce spacing to show more bookmarks</div>
                    </div>
                    <Switch checked={settings.compactMode ?? false} onChange={() => handleToggle('compactMode')} label="Toggle compact mode" />
                  </div>

                  <div className="p-3 rounded-md flex gap-2 items-start border [border-width:var(--border-width)]" style={{ backgroundColor: 'var(--surface-muted)' }}>
                    <HelpIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Compact mode hides descriptions and reduces size to accommodate more bookmarks per board.
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Font family</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Choose the UI typeface for the app</div>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
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
                            className="rounded-lg border px-3 py-3 text-left transition-colors [border-width:var(--border-width)]"
                            style={{
                              fontFamily: `var(--font-${option.value})`,
                              borderColor: 'var(--border)',
                              ...(selected ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' } : { backgroundColor: 'var(--surface)', color: 'var(--text)' }),
                            }}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="mt-1 text-xs" style={{ opacity: 0.75 }}>{option.preview}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <Panel tone="danger" className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4" style={{ color: 'var(--danger)' }} />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Delete current page</h4>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Deletes the active page including all boards and bookmarks inside it. You can undo it from the toast right after.
                    </p>
                    <label className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--danger)' }}>
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
                  <Button variant="danger" size="sm" disabled={!confirmDeletePage} onClick={handleDeleteCurrentPage}>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Active Page</span>
                  </Button>
                </div>
              </Panel>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Behavior</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Open links in new tab</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Open bookmarks in a new browser tab</div>
                    </div>
                    <Switch checked={settings.openLinksInNewTab ?? false} onChange={() => handleToggle('openLinksInNewTab')} label="Toggle open links in new tab" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Show bookmark descriptions</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Display saved descriptions below bookmark titles</div>
                    </div>
                    <Switch checked={settings.showBookmarkDescriptions ?? true} onChange={() => handleToggle('showBookmarkDescriptions')} label="Toggle bookmark descriptions" />
                  </div>
                </div>
              </section>
            </div>
          )}
          {activeTab === 'account' && (
            <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">Account settings coming soon</p>
            </div>
          )}

          {activeTab === 'support' && (
            <section>
              {showHelpSuccess ? (
                <div
                  className="p-4 rounded-md text-sm border [border-width:var(--border-width)]"
                  style={{ borderColor: 'var(--success)', backgroundColor: 'var(--surface-muted)', color: 'var(--success)' }}
                >
                  ✓ Thank you! Your message has been sent. We'll get back to you soon.
                </div>
              ) : (
                <div className="space-y-3 max-w-md">
                  <Field label="Your email address" hideLabel>
                    {(id) => (
                      <input
                        id={id}
                        type="email"
                        placeholder="Your email address"
                        value={helpEmail}
                        onChange={(e) => setHelpEmail(e.target.value)}
                        className="ui-input text-sm"
                      />
                    )}
                  </Field>
                  <Field label="How can we help you?" hideLabel>
                    {(id) => (
                      <textarea
                        id={id}
                        placeholder="How can we help you?"
                        value={helpMessage}
                        onChange={(e) => setHelpMessage(e.target.value.slice(0, 500))}
                        rows={4}
                        className="ui-textarea text-sm"
                      />
                    )}
                  </Field>
                  <Button className="w-full" onClick={handleSendHelp}>Send Help Request</Button>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 ui-divider-t">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Changes are saved only when you click Save.
          </p>
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </div>
      </div>
    </Modal>
  );
}
