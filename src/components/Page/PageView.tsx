import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  closestCorners,
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '../../store/useStore';
import { BoardColumn } from '../Board/BoardColumn';
import { BookmarkTile } from '../Bookmark/BookmarkTile';
import { Plus } from 'lucide-react';
import { Bookmark, Board } from '../../shared/types';
import { InputModal } from '../Shared/InputModal';

export function PageView() {
  const { data, activePageId, moveBoard, moveBookmark, addBoard, dragMode, addToast } = useStore();
  const addBoardAt = useStore((s) => s.addBoardAt);
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const page = data?.pages.find(p => p.id === activePageId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!page) {
    return (
      <div className={`h-full flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
        Select or create a page to get started.
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!dragMode) {
      setActiveId(null);
      setActiveData(null);
      return;
    }
    setActiveId(event.active.id as string);
    setActiveData(event.active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'Bookmark' && overType === 'Board') {
      const activeBoardId = active.data.current?.boardId;
      const overBoardId = over.id; // it's a Board type, so id is boardId

      if (activeBoardId !== overBoardId) {
        // Intentionally minimal here; full cross-container move handled on DragEnd for stability
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveData(null);
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Moving a Board
    if (activeType === 'Board' && overType === 'Board') {
      const oldIndex = page.boards.findIndex(b => b.id === active.id);
      const newIndex = page.boards.findIndex(b => b.id === over.id);
      if (oldIndex !== newIndex) {
        moveBoard(page.id, oldIndex, newIndex);
      }
      return;
    }

    // Moving a Bookmark
    if (activeType === 'Bookmark') {
      const activeBoardId = active.data.current?.boardId;
      let overBoardId = over.data.current?.boardId;
      let newIndex = over.data.current?.sortable?.index;

      // If dropped over a board directly (empty area of board)
      if (overType === 'Board') {
        overBoardId = over.id as string;
        const overBoard = page.boards.find(b => b.id === overBoardId);
        newIndex = overBoard ? overBoard.bookmarks.length : 0;
      }

      if (activeBoardId && overBoardId !== undefined && newIndex !== undefined) {
        moveBookmark(page.id, activeBoardId, page.id, overBoardId, active.id as string, newIndex);
      }
    }
  };

  const handleAddBoard = () => {
    if (dragMode) {
      addToast('Turn off Drag Mode to add boards', 'info');
      return;
    }
    setIsAddBoardOpen(true);
  };

  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false);
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);
  const [columnCount, setColumnCount] = useState<number>(1);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [addingColumnIndex, setAddingColumnIndex] = useState<number | null>(null);
  const boardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [addButtonStyle, setAddButtonStyle] = useState<React.CSSProperties | null>(null);
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(false);
  const boardGapPx = 12;

  const onSaveBoard = (name: string) => {
    if (addingColumnIndex !== null && containerRef.current) {
      // compute insertion index based on column distribution
      const boards = page.boards;
      const M = boards.length;
      const C = columnCount;
      const base = Math.floor(M / C);
      const rem = M % C;
      const counts = Array.from({ length: C }, (_, i) => (i < rem ? base + 1 : base));
      const insertIdx = counts.slice(0, Math.min(addingColumnIndex, counts.length)).reduce((a, b) => a + b, 0);

      addBoardAt(page.id, name, insertIdx);
      useStore.getState().addToast(`Board "${name}" created`, 'success');
      setAddingColumnIndex(null);
      setIsAddBoardOpen(false);
      return;
    }

    addBoard(page.id, name);
    useStore.getState().addToast(`Board "${name}" created`, 'success');
  };

  // helpers to compute column count based on width
  const computeColumnCount = (width: number) => {
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 640) return 2;
    return 1;
  };

  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setColumnCount(computeColumnCount(w));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div ref={containerRef} className="p-6 relative" onMouseMove={(e) => {
        if (!dragMode) return;
        const node = containerRef.current;
        if (!node || !page) return;
        const rect = node.getBoundingClientRect();
        const columnGap = boardGapPx;
        const C = columnCount;
        const availableWidth = Math.max(1, rect.width - (C - 1) * columnGap);
        const colWidth = availableWidth / C;
        const x = e.clientX - rect.left;
        const idx = Math.min(Math.max(0, Math.floor(x / (colWidth + columnGap))), C - 1);
        setHoverColumn(idx);

        // Find last board element in this column
        const boards = page.boards;
        const matched: { id: string; rect: DOMRect }[] = [];
        for (const b of boards) {
          const el = boardRefs.current[b.id];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const leftRel = r.left - rect.left;
          const center = leftRel + r.width / 2;
          const colLeft = idx * (colWidth + columnGap);
          const colRight = colLeft + colWidth;
          if (center >= colLeft - 1 && center <= colRight + 1) matched.push({ id: b.id, rect: r });
        }

        const gapPx = boardGapPx;
        if (matched.length > 0) {
          matched.sort((a, b) => (a.rect.top + a.rect.height) - (b.rect.top + b.rect.height));
          const last = matched[matched.length - 1];
          const left = last.rect.left - rect.left;
          const top = last.rect.top - rect.top + last.rect.height + gapPx;
          const width = last.rect.width;
          setAddButtonStyle({ position: 'absolute', left: left + 'px', top: top + 'px', width: width + 'px', zIndex: 40 });
        } else {
          // empty column: place at top of column
          const left = idx * (colWidth + columnGap);
          const top = 0;
          const width = colWidth;
          setAddButtonStyle({ position: 'absolute', left: left + 'px', top: top + 'px', width: width + 'px', zIndex: 40 });
        }
      }} onMouseLeave={() => { setHoverColumn(null); setAddButtonStyle(null); setIsAddButtonVisible(false); }} style={{ columnGap: '1.5rem' }}>
        <style>{`@media (min-width: 640px) { .masonry { column-count: 2 } } @media (min-width: 1024px) { .masonry { column-count: 3 } } @media (min-width: 1280px) { .masonry { column-count: 4 } }`}</style>
        <div className="masonry">
        <SortableContext 
          items={page.boards.map(b => b.id)}
          strategy={rectSortingStrategy}
        >
          {page.boards.map((board) => (
            <div key={board.id} ref={(el) => (boardRefs.current[board.id] = el)} className="inline-block w-full mb-3">
              <BoardColumn board={board} pageId={page.id} />
            </div>
          ))}
        </SortableContext>
        </div>

        {/* Render Add button positioned under last card in hovered column */}
        {addButtonStyle && (
          <div
            style={addButtonStyle}
            className="pointer-events-auto"
            onMouseEnter={() => setIsAddButtonVisible(true)}
            onMouseLeave={() => setIsAddButtonVisible(false)}
          >
            <div className="inline-block w-full">
              <button
                onClick={() => {
                  if (!dragMode) {
                    addToast('Turn on Drag Mode to place boards precisely', 'info');
                    return;
                  }
                  setAddingColumnIndex(hoverColumn);
                  setIsAddBoardOpen(true);
                }}
                disabled={!dragMode}
                className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all p-6 backdrop-blur-sm group ${!dragMode ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'text-white/50 hover:text-white/80 hover:border-white/40 border-white/10 bg-white/5' : 'text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 border-zinc-300 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)]'} ${isAddButtonVisible ? 'opacity-100' : 'opacity-0'}`}
              >
                <span className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isDark ? 'bg-white/5' : 'bg-zinc-100 shadow-sm'}`}>
                  <Plus className="w-6 h-6" />
                </span>
                <span className="font-bold text-xs tracking-[0.2em] uppercase">Add Board</span>
              </button>
            </div>
          </div>
        )}

        <InputModal
          isOpen={isAddBoardOpen}
          title="New Board"
          label="Board name"
          placeholder="My Board"
          onClose={() => setIsAddBoardOpen(false)}
          onSave={onSaveBoard}
        />
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeId && activeData?.type === 'Board' ? (
          <div className="w-full opacity-50"><BoardColumn board={activeData.board} pageId={page.id} isOverlay /></div>
        ) : null}
        {activeId && activeData?.type === 'Bookmark' ? (
          <div className="w-full opacity-50"><BookmarkTile bookmark={activeData.bookmark} boardId={activeData.boardId} pageId={page.id} isOverlay /></div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
