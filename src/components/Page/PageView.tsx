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
  useDroppable,
} from '@dnd-kit/core';
import { 
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '../../store/useStore';
import { BoardColumn } from '../Board/BoardColumn';
import { BookmarkTile } from '../Bookmark/BookmarkTile';
import { Plus } from 'lucide-react';
import { Bookmark } from '../../shared/types';
import { InputModal } from '../Shared/InputModal';

type CanvasLaneProps = {
  columnIndex: number;
  isDark: boolean;
  onAddBoard: (columnIndex: number) => void;
  children: React.ReactNode;
};

function CanvasLane({ columnIndex, isDark, onAddBoard, children }: CanvasLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnIndex}`,
    data: { type: 'Column', columnIndex },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group min-h-[calc(100vh-10rem)] rounded-3xl border border-dashed bg-transparent p-2 transition-colors ${isDark ? 'border-white/0' : 'border-zinc-200/0'} ${isOver ? (isDark ? 'border-white/15 bg-white/[0.02]' : 'border-zinc-300/20 bg-zinc-100/[0.02]') : ''}`}
    >
      {children}
      <button
        type="button"
        onClick={() => onAddBoard(columnIndex)}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm font-semibold transition-all duration-200 ${isDark ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-700'} opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 ${isDark ? 'group-hover:border-white/20 group-hover:bg-white/5' : 'group-hover:border-zinc-300 group-hover:bg-zinc-100'}`}
      >
        <Plus className="h-4 w-4" />
        <span>Add Board</span>
      </button>
    </div>
  );
}

export function PageView() {
  const { data, activePageId, moveBoardToColumn, moveBookmark, addBoardAt, dragMode, addToast } = useStore();
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
      const activeBoard = page.boards.find((board) => board.id === active.id);
      const overBoard = page.boards.find((board) => board.id === over.id);
      if (!activeBoard || !overBoard) return;

      const activeColumnIndex = activeBoard.columnIndex ?? 0;
      const targetColumn = overBoard.columnIndex ?? 0;

      // Cross-column move: compute insertion index
      if (activeColumnIndex !== targetColumn) {
        // Get boards in target column sorted by order
        const targetColumnBoards = page.boards
          .filter(b => (b.columnIndex ?? 0) === targetColumn)
          .sort((a, b) => a.order - b.order);

        // Use the sortable index if available, otherwise append
        let insertIndex = targetColumnBoards.length;
        if (typeof over.data.current?.sortable?.index === 'number') {
          insertIndex = over.data.current.sortable.index;
        }

        moveBoardToColumn(page.id, active.id as string, targetColumn, insertIndex);
        return;
      }

      // Same column: use sortable index for reordering
      if (typeof over.data.current?.sortable?.index === 'number') {
        const newIndex = over.data.current.sortable.index;
        moveBoardToColumn(page.id, active.id as string, targetColumn, newIndex);
      }
      return;
    }

    if (activeType === 'Board' && overType === 'Column') {
      const targetColumn = over.data.current?.columnIndex ?? 0;
      moveBoardToColumn(page.id, active.id as string, targetColumn);
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

  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false);
  const [columnCount] = useState<number>(4);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [addingColumnIndex, setAddingColumnIndex] = useState<number | null>(null);
  const boardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const boardColumns = React.useMemo(() => {
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      page.boards
        .filter((board) => (board.columnIndex ?? 0) === columnIndex)
        .slice()
        .sort((left, right) => left.order - right.order)
    );
  }, [page.boards, columnCount]);

  const onSaveBoard = (name: string) => {
    const targetColumn = addingColumnIndex ?? 0;
    addBoardAt(page.id, name, targetColumn);
    useStore.getState().addToast(`Board "${name}" created`, 'success');
    setAddingColumnIndex(null);
    setIsAddBoardOpen(false);
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div ref={containerRef} className="p-6 relative" onMouseMove={(e) => {
        if (!dragMode) return;
      }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
          {boardColumns.map((columnBoards, columnIndex) => (
              <CanvasLane
                key={`lane-${columnIndex}`}
                columnIndex={columnIndex}
                isDark={isDark}
                onAddBoard={(targetColumn) => {
                  setAddingColumnIndex(targetColumn);
                  setIsAddBoardOpen(true);
                }}
              >
              <SortableContext
                items={columnBoards.map((board) => board.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex min-w-0 flex-col gap-3">
                  {columnBoards.map((board) => (
                    <div key={board.id} ref={(el) => (boardRefs.current[board.id] = el)} className="w-full">
                      <BoardColumn board={board} pageId={page.id} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </CanvasLane>
          ))}
        </div>

        <InputModal
          isOpen={isAddBoardOpen}
          title="New Board"
          label="Board name"
          placeholder="My Board"
          maxLength={25}
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
