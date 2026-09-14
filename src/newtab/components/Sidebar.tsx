import { Plus, Hash } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../shared/utils';
import { promptNewPage } from '../shared/actions';

/**
 * Page navigation for the "sidebar" layout. Deliberately pages-only: the data
 * actions (export/import/backgrounds/chrome import) live in the toolbar's
 * overflow menu and page settings in its Pages menu, so the sidebar and tabs
 * layouts differ *only* in how pages are listed — never in which features you
 * can reach, and never in where an action lives.
 */
export function Sidebar() {
  const { data, activePageId, setActivePage } = useStore();

  return (
    <aside className="w-64 bg-transparent flex flex-col pt-4 h-full" aria-label="Pages">
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          <img src="/icons/favicon-32x32.png" alt="" className="h-6 w-6 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.2)]" />
          <h1 className="font-sans text-sm tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>BOOKMRK</h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1" aria-label="Page list">
        {data?.pages.map((page) => (
          <div
            key={page.id}
            className={cn('w-full flex items-center gap-1 rounded-md', activePageId === page.id && 'bg-[var(--surface-muted)]')}
          >
            <button
              onClick={() => setActivePage(page.id)}
              aria-current={activePageId === page.id ? 'page' : undefined}
              className="flex-1 flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-90" 
              style={{
                backgroundColor: activePageId === page.id ? 'var(--surface-raised)' : 'transparent',
                color: activePageId === page.id ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              <Hash className="w-4 h-4" />
              <span className="flex-1 text-left truncate">{page.name}</span>
            </button>
          </div>
        ))}
      </nav>

      <div className="px-2 py-4 ui-divider-t">
        <button
          onClick={promptNewPage}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium hover:opacity-90" 
          style={{ color: 'var(--text-muted)' }}
        >
          <Plus className="w-4 h-4" />
          <span>New Page</span>
        </button>
      </div>
    </aside>
  );
}
