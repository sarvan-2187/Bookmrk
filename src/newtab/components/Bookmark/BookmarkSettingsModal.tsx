import { useEffect, useId, useMemo, useState } from 'react';
import { Save, Upload, Trash2, X } from 'lucide-react';
import { Bookmark } from '../../shared/types';
import { useStore } from '../../store/useStore';
import { BookmarkFavicon } from '../Shared/BookmarkFavicon';
import { Modal } from '../Shared/Modal';

type BookmarkSettingsModalProps = {
  isOpen: boolean;
  bookmark: Bookmark;
  pageId: string;
  boardId: string;
  onClose: () => void;
  onDelete?: () => void;
};

function getChromeFaviconUrl(bookmarkUrl: string): string {
  try {
    const resolvedUrl = new URL(bookmarkUrl.startsWith('http') ? bookmarkUrl : `https://${bookmarkUrl}`);
    return `https://www.google.com/s2/favicons?domain=${resolvedUrl.hostname}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${bookmarkUrl}&sz=64`;
  }
}

export function BookmarkSettingsModal({ isOpen, bookmark, pageId, boardId, onClose }: BookmarkSettingsModalProps) {
  const { updateBookmark, setBookmarkTags, addToast } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const titleId = useId();
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [description, setDescription] = useState(bookmark.description ?? bookmark.note ?? '');
  const [faviconUrl, setFaviconUrl] = useState(bookmark.favicon ?? getChromeFaviconUrl(bookmark.url));
  const [faviconLabel, setFaviconLabel] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(bookmark.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setDescription(bookmark.description ?? bookmark.note ?? '');
      setFaviconUrl(bookmark.favicon ?? getChromeFaviconUrl(bookmark.url));
      setFaviconLabel(null);
      setTags(bookmark.tags ?? []);
      setTagInput('');
    }
  }, [isOpen, bookmark]);

  const trimmedTitle = title.trim();
  const trimmedUrl = url.trim();
  const trimmedDescription = description.trim();
  const trimmedFaviconUrl = faviconUrl.trim();
  const resolvedFaviconUrl = trimmedFaviconUrl || getChromeFaviconUrl(trimmedUrl || bookmark.url);
  const initialFaviconUrl = bookmark.favicon ?? getChromeFaviconUrl(bookmark.url);
  const tagsChanged = JSON.stringify(tags) !== JSON.stringify(bookmark.tags ?? []);
  const canSave = trimmedTitle.length > 0 && trimmedUrl.length > 0 && (
    trimmedTitle !== bookmark.title ||
    trimmedUrl !== bookmark.url ||
    trimmedDescription !== (bookmark.description ?? bookmark.note ?? '') ||
    resolvedFaviconUrl !== initialFaviconUrl ||
    tagsChanged
  );

  const titleColor = useMemo(() => (trimmedTitle.length === 0 ? 'var(--danger)' : 'var(--text-muted)'), [trimmedTitle.length]);

  const addTagFromInput = () => {
    const next = tagInput.trim().replace(/^#/, '');
    if (!next) return;
    if (!tags.includes(next)) setTags([...tags, next]);
    setTagInput('');
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file for the favicon', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFaviconUrl(reader.result);
        setFaviconLabel(file.name);
      }
    };
    reader.onerror = () => {
      addToast('Failed to read the selected favicon image', 'error');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl">
      <div className="px-5 py-4 ui-divider-b">
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Bookmark Settings</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Edit the bookmark details.</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Edit name</h4>
            <span className="text-xs" style={{ color: titleColor }}>{trimmedTitle.length}/120</span>
          </div>
          <label htmlFor={`${titleId}-title`} className="sr-only">Bookmark title</label>
          <input
            id={`${titleId}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 120))}
            placeholder="Bookmark title"
            className="ui-input"
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tags</h4>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}>
                #{tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <label htmlFor={`${titleId}-tag`} className="sr-only">Add a tag</label>
          <input
            id={`${titleId}-tag`}
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addTagFromInput();
              }
            }}
            onBlur={addTagFromInput}
            placeholder="Add a tag and press Enter"
            className="ui-input"
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Add description</h4>
          <label htmlFor={`${titleId}-desc`} className="sr-only">Description</label>
          <textarea
            id={`${titleId}-desc`}
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 500))}
            placeholder="Optional description"
            rows={4}
            className="ui-textarea"
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Edit URL</h4>
          <label htmlFor={`${titleId}-url`} className="sr-only">URL</label>
          <input
            id={`${titleId}-url`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            className="ui-input"
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Favicon</h4>
            <span className="max-w-48 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{faviconLabel ?? 'Optional'}</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border p-3 [border-width:var(--border-width)]" style={{ backgroundColor: 'var(--surface-muted)' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border [border-width:var(--border-width)]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <BookmarkFavicon
                favicon={faviconUrl}
                title={bookmark.title}
                url={trimmedUrl || bookmark.url}
                isDark={!!isDark}
                imageClassName="h-6 w-6 object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Edit the favicon URL directly or upload a custom image.
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                The Chrome favicon URL is used by default.
              </p>

              <div className="mt-3 space-y-2">
                <label htmlFor={`${titleId}-favicon`} className="sr-only">Favicon URL</label>
                <input
                  id={`${titleId}-favicon`}
                  value={faviconUrl}
                  onChange={(event) => setFaviconUrl(event.target.value)}
                  placeholder={getChromeFaviconUrl(trimmedUrl || bookmark.url)}
                  className="ui-input text-sm"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                  <Upload className="h-4 w-4" />
                  <span>Upload favicon</span>
                  <input type="file" accept="image/*,.ico" className="sr-only" onChange={handleFaviconUpload} />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setFaviconUrl(getChromeFaviconUrl(trimmedUrl || bookmark.url));
                    setFaviconLabel(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-3 px-5 py-4 ui-divider-t">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          Close
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            try {
              updateBookmark(pageId, boardId, bookmark.id, trimmedTitle, trimmedUrl, trimmedDescription, resolvedFaviconUrl === initialFaviconUrl ? undefined : resolvedFaviconUrl);
              if (tagsChanged) setBookmarkTags(pageId, boardId, bookmark.id, tags);
              addToast('Bookmark updated', 'success');
              onClose();
            } catch (err) {
              console.error('Failed to update bookmark', err);
              addToast('Failed to update bookmark', 'error');
            }
          }}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={canSave ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' } : { backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </button>
      </div>
    </Modal>
  );
}
