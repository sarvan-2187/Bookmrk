import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle, isNeoBrutalistTheme } from '../../shared/utils';

type InputModalProps = {
  isOpen: boolean;
  title?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function InputModal({ isOpen, title = 'Input', label = 'Name', placeholder = '', maxLength, onClose, onSave }: InputModalProps) {
  const { data } = useStore();
  const [value, setValue] = useState('');
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const isNeoBrutalistMode = isNeoBrutalistTheme(data);

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
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={isNeoBrutalistMode ? { backgroundColor: 'rgba(255, 255, 255, 0.88)' } : bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isNeoBrutalistMode ? 'border-2 border-black shadow-[8px_8px_0_#000]' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isNeoBrutalistMode ? '#ffffff' : isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b px-5 py-4 ${isNeoBrutalistMode ? 'border-black' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</label>
              {maxLength && <span className={`text-xs ${value.length > maxLength * 0.8 ? (isNeoBrutalistMode ? 'text-black' : isDark ? 'text-amber-400' : 'text-amber-600') : (isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-500' : 'text-zinc-500')}`}>{value.length}/{maxLength}</span>}
            </div>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`}>Cancel</button>
            <button type="submit" className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}>Save</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
