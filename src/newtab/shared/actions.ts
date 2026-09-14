import { useStore } from '../store/useStore';

/**
 * Store-only action helpers shared by the toolbar, the sidebar, the board
 * canvas and the command palette. They exist so those surfaces can't drift
 * into slightly different versions of "create a page" — and so the palette can
 * trigger any flow without prop drilling through the component tree.
 */

export function promptNewPage() {
  const { openPrompt, addPage, setActivePage, addToast } = useStore.getState();
  openPrompt({
    title: 'New Page',
    label: 'Page name',
    placeholder: 'My Page',
    onSave: (name) => {
      addPage(name);
      const created = useStore.getState().data?.pages.at(-1);
      if (created) setActivePage(created.id);
      addToast(`Page "${name}" created`, 'success');
    },
  });
}

export function promptNewBoard(pageId: string, columnIndex = 0) {
  const { openPrompt, addBoardAt, addToast } = useStore.getState();
  openPrompt({
    title: 'New Board',
    label: 'Board name',
    placeholder: 'My Board',
    maxLength: 25,
    onSave: (name) => {
      addBoardAt(pageId, name, columnIndex);
      addToast(`Board "${name}" created`, 'success');
    },
  });
}

export function promptRenamePage(pageId: string) {
  const { openPrompt, updatePage, addToast, data } = useStore.getState();
  const page = data?.pages.find((candidate) => candidate.id === pageId);
  if (!page) return;

  openPrompt({
    title: 'Rename Page',
    label: 'Page name',
    placeholder: page.name,
    maxLength: 80,
    onSave: (name) => {
      updatePage(pageId, name);
      addToast(`Page renamed to "${name}"`, 'success');
    },
  });
}

export function promptRenameBoard(pageId: string, boardId: string) {
  const { openPrompt, updateBoard, addToast, data } = useStore.getState();
  const board = data?.pages.find((page) => page.id === pageId)?.boards.find((candidate) => candidate.id === boardId);
  if (!board) return;

  openPrompt({
    title: 'Rename Board',
    label: 'Board name',
    placeholder: board.name,
    maxLength: 25,
    onSave: (name) => {
      updateBoard(pageId, boardId, name, board.accentColor);
      addToast(`Board renamed to "${name}"`, 'success');
    },
  });
}

/** Opens every bookmark on a board in new tabs. */
export function summonBoard(pageId: string, boardId: string) {
  const { data } = useStore.getState();
  const board = data?.pages.find((page) => page.id === pageId)?.boards.find((candidate) => candidate.id === boardId);
  if (!board || board.bookmarks.length === 0) return;

  for (const bookmark of board.bookmarks) {
    try {
      const safeUrl = new URL(bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`).toString();
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Skip malformed URLs / popup-blocked opens.
    }
  }
}

/** Guarded page delete — refuses to remove the last page. */
export function deletePageGuarded(pageId: string) {
  const { data, deletePage, addToast } = useStore.getState();
  if (!data) return;

  if (data.pages.length <= 1) {
    addToast('Cannot delete the last remaining page', 'error');
    return;
  }

  // deletePage() raises the "Deleted..." toast with its own Undo action.
  deletePage(pageId);
}
