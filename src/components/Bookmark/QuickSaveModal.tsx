import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';

export function QuickSaveModal() {
  const { data, activePageId, addBookmark, quickSaveOpen, openQuickSave, closeQuickSave } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [boardId, setBoardId] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+Y or Cmd+Shift+Y
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        openQuickSave();
        // Default board based on active page
        const activePage = data?.pages.find(p => p.id === activePageId);
        if (activePage && activePage.boards.length > 0 && !boardId) {
          setBoardId(activePage.boards[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, activePageId, boardId, openQuickSave]);

  useEffect(() => {
    if (!quickSaveOpen) {
      setUrl('');
      setTitle('');
      return;
    }

    const activePage = data?.pages.find(p => p.id === activePageId);
    if (activePage && activePage.boards.length > 0 && !boardId) {
      setBoardId(activePage.boards[0].id);
    }
  }, [activePageId, boardId, data, quickSaveOpen]);

  if (!quickSaveOpen || !data) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !boardId) return;

    // Find page ID for board
    let targetPageId = activePageId;
    for (const p of data.pages) {
      if (p.boards.some(b => b.id === boardId)) {
        targetPageId = p.id;
        break;
      }
    }

    if (targetPageId) {
      addBookmark(targetPageId, boardId, url, title);
    }
    
    closeQuickSave();
    setUrl('');
    setTitle('');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeQuickSave();
      }}
    >
      <div
        className={`rounded-xl shadow-2xl w-full max-w-md overflow-hidden border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`font-medium text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Quick Save</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Save the current tab to a board</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>URL</label>
            <input 
              autoFocus
              type="url" 
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Title (Optional)</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Example Website"
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Destination Board</label>
            <select 
              value={boardId}
              onChange={e => setBoardId(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-600 focus:ring-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 focus:ring-zinc-400'}`}
            >
              <option value="" disabled>Select a board...</option>
              {data.pages.map(p => (
                <optgroup key={p.id} label={p.name}>
                  {p.boards.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => closeQuickSave()}
              className={`px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}
            >
              Save Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
