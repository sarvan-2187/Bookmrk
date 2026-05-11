import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';

type BackgroundModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BackgroundModal({ isOpen, onClose }: BackgroundModalProps) {
  const { data, setBackground, clearBackground } = useStore();
  const current = data?.background || null;
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [hex, setHex] = useState('');
  const [url, setUrl] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // prefill with current values
    if (current) {
      if (current.type === 'color') setHex(current.value);
      if (current.type === 'image') setUrl(current.value);
    } else {
      setHex('');
      setUrl('');
      setFilePreview(null);
    }

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, current, onClose]);

  if (!isOpen) return null;

  const isValidHex = (v: string) => /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v.trim());

  const applyHex = () => {
    const value = hex.trim();
    if (!isValidHex(value)) {
      alert('Please enter a valid HEX color like #RRGGBB');
      return;
    }
    setBackground({ type: 'color', value });
    onClose();
  };

  const applyUrl = () => {
    const v = url.trim();
    if (!v) return alert('Please enter an image URL');
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
    if (!filePreview) return alert('Please upload an image first');
    setBackground({ type: 'image', value: filePreview });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Backgrounds</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Choose a solid color (HEX), provide an image URL, or upload an image.</p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Solid Color (HEX)</label>
            <div className="flex gap-2">
              <input
                placeholder="#1f6feb"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className={`flex-1 rounded-md border px-3 py-2 outline-none ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500'}`}
              />
              <button onClick={applyHex} className={`px-4 py-2 rounded-md font-medium ${isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-100'}`}>Apply</button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Image URL</label>
            <div className="flex gap-2">
              <input
                placeholder="https://example.com/bg.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`flex-1 rounded-md border px-3 py-2 outline-none ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500'}`}
              />
              <button onClick={applyUrl} className={`px-4 py-2 rounded-md font-medium ${isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-100'}`}>Apply</button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Upload Image</label>
            <div className="flex gap-2 items-center">
              <label className={`px-3 py-2 rounded-md cursor-pointer border ${isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-100' : 'bg-zinc-100 border-zinc-300 text-zinc-900'}`}>
                Choose file
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              <button onClick={applyFile} className={`px-4 py-2 rounded-md font-medium ${isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-100'}`}>Apply</button>
              <div className={`flex-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{filePreview ? 'Ready to apply' : 'No file selected'}</div>
            </div>
            {filePreview && (
              <div className={`mt-3 rounded-md overflow-hidden border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <img src={filePreview} alt="preview" className="w-full max-h-48 object-cover" />
              </div>
            )}
          </div>

          <div className={`pt-4 border-t flex items-center gap-3 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <button onClick={() => { clearBackground(); onClose(); }} className={`px-3 py-2 rounded-md text-sm text-rose-400 ${isDark ? 'hover:bg-zinc-900/40' : 'hover:bg-rose-50'}`}>Clear Background</button>
            <div className="flex-1" />
            <button onClick={onClose} className={`px-3 py-2 rounded-md text-sm ${isDark ? 'text-zinc-300 hover:bg-zinc-900/30' : 'text-zinc-700 hover:bg-zinc-100'}`}>Cancel</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
