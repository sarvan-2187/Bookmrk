import React, { useState } from 'react';
import {
  DndContext,
  pointerWithin,
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
import { promptNewBoard } from '../../shared/actions';

type CanvasLaneProps = {
  columnIndex: number;
  onAddBoard: (columnIndex: number) => void;
  children: React.ReactNode;
};

function CanvasLane({ columnIndex, onAddBoard, children }: CanvasLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnIndex}`,
    data: { type: 'Column', columnIndex },
  });

  return (
    <div
      ref={setNodeRef}
      className="group/lane min-h-[calc(100vh-10rem)] rounded-3xl border-0 shadow-none bg-transparent p-2 transition-all"
      style={isOver ? { boxShadow: 'var(--shadow-inset)' } : undefined}
    >
      {children}
      <button
        type="button"
        onClick={() => onAddBoard(columnIndex)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition-all duration-200 opacity-0 pointer-events-none translate-y-1 group-hover/lane:opacity-100 group-hover/lane:pointer-events-auto group-hover/lane:translate-y-0 hover:opacity-90 [border-width:var(--border-width)]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--surface-raised)', boxShadow: 'var(--shadow-raised)' }}
      >
        <Plus className="h-4 w-4" />
        <span>Add Board</span>
      </button>
    </div>
  );
}

export function PageView() {
  const { data, activePageId, moveBoardToColumn, moveBookmark } = useStore();
  const page = data?.pages.find(p => p.id === activePageId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!page) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Select or create a page to get started.
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveData(event.active.data.current);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Cross-container bookmark moves are handled on DragEnd for stability.
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
        const targetColumnBoards = page.boards
          .filter(b => (b.columnIndex ?? 0) === targetColumn)
          .sort((a, b) => a.order - b.order);

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

  const [columnCount] = useState<number>(4);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const boardColumns = React.useMemo(() => {
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      page.boards
        .filter((board) => (board.columnIndex ?? 0) === columnIndex)
        .slice()
        .sort((left, right) => left.order - right.order)
    );
  }, [page.boards, columnCount]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div ref={containerRef} className="p-6 relative">
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
          {boardColumns.map((columnBoards, columnIndex) => (
            <CanvasLane
              key={`lane-${columnIndex}`}
              columnIndex={columnIndex}
              onAddBoard={(targetColumn) => promptNewBoard(page.id, targetColumn)}
            >
              <SortableContext
                items={columnBoards.map((board) => board.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex min-w-0 flex-col gap-3">
                  {columnBoards.map((board) => (
                    <div key={board.id} className="w-full">
                      <BoardColumn board={board} pageId={page.id} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </CanvasLane>
          ))}
        </div>
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
