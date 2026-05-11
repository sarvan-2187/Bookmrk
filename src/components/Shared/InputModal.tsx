import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';

type InputModalProps = {
  isOpen: boolean;
  title?: string;
  label?: string;
  placeholder?: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function InputModal({ isOpen, title = 'Input', label = 'Name', placeholder = '', onClose, onSave }: InputModalProps) {
  const [value, setValue] = useState('');
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  useEffect(() => {
    if (!isOpen) return;
    setValue('');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSave(v);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
      >
        <div className={`border-b px-5 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</label>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`}>Cancel</button>
            <button type="submit" className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}>Save</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
