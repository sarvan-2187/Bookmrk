import { EyeOff, PanelLeft, Plus, Search } from 'lucide-react';
import { useStore } from '../store/useStore';

type ToolbarProps = {
  onOpenSearch: () => void;
};

export function Toolbar({ onOpenSearch }: ToolbarProps) {
  const { toggleSidebar, toggleBlurMode, data, activePageId, openQuickSave } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const activePage = data?.pages.find(p => p.id === activePageId);

  return (
    <header className={`h-14 border-b backdrop-blur-sm flex items-center px-4 justify-between shrink-0 z-20 ${isDark ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.04)]'}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        
        {activePage && (
          <h2 className={`font-semibold text-lg ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{activePage.name}</h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={openQuickSave}
          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Quick Save"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button 
          onClick={toggleBlurMode}
          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Toggle Blur Mode"
        >
          <EyeOff className="w-5 h-5" />
        </button>
        {/* Search could be a simulated keyboard shortcut Ctrl+K */}
        <button 
          className={`p-1.5 rounded-md transition-colors flex items-center gap-2 px-3 ${isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Search (Ctrl+K)"
          onClick={onOpenSearch}
        >
          <Search className="w-4 h-4" />
          <span className="text-xs font-mono opacity-50 block md:hidden lg:block">/</span>
        </button>
      </div>
    </header>
  );
}
