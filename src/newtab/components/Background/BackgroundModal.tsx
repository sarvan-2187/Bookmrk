import { useEffect, useId, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../Shared/Modal';

type BackgroundModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Free-to-use Unsplash photos (Unsplash License — no attribution required),
// hotlinked directly from Unsplash's CDN. Picked for being calm/low-contrast
// so bookmark cards stay legible on top of them.
const PRESET_BACKGROUNDS: Array<{ id: string; label: string; full: string; thumb: string }> = [
  { id: 'mountain-lake', label: 'Mountain lake', full: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=240&q=60' },
  { id: 'forest-path', label: 'Forest path', full: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=240&q=60' },
  { id: 'misty-mountains', label: 'Misty mountains', full: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=240&q=60' },
  { id: 'starry-sky', label: 'Starry sky', full: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=240&q=60' },
  { id: 'ocean-waves', label: 'Ocean waves', full: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=240&q=60' },
  { id: 'desert-dunes', label: 'Desert dunes', full: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=240&q=60' },
  { id: 'autumn-forest', label: 'Autumn forest', full: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=240&q=60' },
  { id: 'gradient-sky', label: 'Gradient sky', full: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1600&q=80', thumb: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=240&q=60' },
];

export function BackgroundModal({ isOpen, onClose }: BackgroundModalProps) {
  const { data, setBackground, clearBackground, addToast } = useStore();
  const current = data?.background || null;
  const titleId = useId();

  const [url, setUrl] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (current?.type === 'image') {
      setUrl(current.value);
    } else {
      setUrl('');
      setFilePreview(null);
    }
  }, [isOpen, current]);

  if (!isOpen) return null;

  const applyUrl = () => {
    const v = url.trim();
    if (!v) return addToast('Please enter an image URL', 'error');
    setBackground({ type: 'image', value: v });
    onClose();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFilePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const applyFile = () => {
    if (!filePreview) return addToast('Please upload an image first', 'error');
    setBackground({ type: 'image', value: filePreview });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="w-full max-w-2xl rounded-2xl overflow-hidden">
      <div className="px-6 py-4 ui-divider-b">
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Backgrounds</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Provide an image URL or upload an image.</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div>
          <span className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Presets</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {PRESET_BACKGROUNDS.map((preset) => {
              const isSelected = current?.type === 'image' && current.value === preset.full;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setBackground({ type: 'image', value: preset.full });
                    onClose();
                  }}
                  className="aspect-square overflow-hidden rounded-lg border-2 transition-transform hover:scale-105"
                  style={{ borderColor: isSelected ? 'var(--accent)' : 'var(--border)' }}
                  title={preset.label}
                  aria-label={`Use "${preset.label}" background`}
                  aria-pressed={isSelected}
                >
                  <img src={preset.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>Free photos via Unsplash.</p>
        </div>

        <div>
          <label htmlFor={`${titleId}-url`} className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Image URL</label>
          <div className="flex gap-2">
            <input
              id={`${titleId}-url`}
              placeholder="https://example.com/bg.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="ui-input flex-1"
            />
            <button onClick={applyUrl} className="ui-btn ui-btn-primary ui-btn-md">Apply</button>
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Upload Image</span>
          <div className="flex gap-2 items-center">
            <label className="ui-btn ui-btn-ghost ui-btn-md cursor-pointer" style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}>
              Choose file
              <input type="file" accept="image/*" className="sr-only" onChange={handleFile} aria-label="Choose a background image file" />
            </label>
            <button onClick={applyFile} className="ui-btn ui-btn-primary ui-btn-md">Apply</button>
            <div className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>{filePreview ? 'Ready to apply' : 'No file selected'}</div>
          </div>
          {filePreview && (
            <div className="mt-3 rounded-md overflow-hidden border [border-width:var(--border-width)]" style={{ borderColor: 'var(--border)' }}>
              <img src={filePreview} alt="Background preview" className="w-full max-h-48 object-cover" />
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center gap-3 ui-divider-t">
          <button onClick={() => { clearBackground(); onClose(); }} className="px-3 py-2 rounded-md text-sm hover:opacity-80" style={{ color: 'var(--danger)' }}>Clear Background</button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-3 py-2 rounded-md text-sm hover:opacity-80" style={{ color: 'var(--text-muted)' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
