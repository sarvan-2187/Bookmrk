import { useEffect, useId, useState } from 'react';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';
import { Modal } from '../Shared/Modal';
import { Button } from '../Shared/ui/Button';
import { Field } from '../Shared/ui/Field';
import { Panel } from '../Shared/ui/Panel';

type PageSettingsModalProps = {
  isOpen: boolean;
  pageName: string;
  onClose: () => void;
  onSaveName: (nextName: string) => void;
  visibleCount?: number;
  onSaveVisibleCount?: (count: number) => void;
  onDeletePage: () => void;
};

export function PageSettingsModal({ isOpen, pageName, onClose, onSaveName, visibleCount = 6, onSaveVisibleCount, onDeletePage }: PageSettingsModalProps) {
  const titleId = useId();
  const [name, setName] = useState(pageName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [visible, setVisible] = useState<number>(visibleCount);

  useEffect(() => {
    if (!isOpen) return;
    setName(pageName);
    setConfirmDelete(false);
    setVisible(visibleCount);
  }, [isOpen, pageName, visibleCount]);

  const trimmedName = name.trim();
  const canSaveName = trimmedName.length > 0 && trimmedName !== pageName;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="w-full max-w-lg rounded-2xl overflow-hidden">
      <div className="px-5 py-4 ui-divider-b">
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Page Settings</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Manage {pageName}.</p>
      </div>

      <div className="px-5 py-5">
        <section className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Edit page name</h4>
          <Field label="Page name" hideLabel counter={{ current: trimmedName.length, max: 80 }}>
            {(id) => (
              <input
                id={id}
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 80))}
                placeholder="Page name"
                className="ui-input"
              />
            )}
          </Field>
          <div className="flex justify-end">
            <Button size="sm" disabled={!canSaveName} onClick={() => onSaveName(trimmedName)}>
              <Save className="h-4 w-4" />
              <span>Save Name</span>
            </Button>
          </div>
        </section>

        <section className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Bookmarks per board</h4>
          <div className="flex items-end gap-3">
            <div className="w-28">
              <Field label="Bookmarks per board" hideLabel>
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={1}
                    max={100}
                    value={visible}
                    onChange={(e) => setVisible(Math.max(1, Math.min(100, Number(e.target.value || 0))))}
                    className="ui-input"
                  />
                )}
              </Field>
            </div>
            <div className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Show this many bookmarks per board on the page; the rest will be hidden under a "Show more" button.
            </div>
            <Button size="sm" disabled={!onSaveVisibleCount} onClick={() => onSaveVisibleCount?.(visible)}>
              <Save className="h-4 w-4" />
              <span>Save</span>
            </Button>
          </div>
        </section>

        <Panel tone="danger" className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4" style={{ color: 'var(--danger)' }} />
            <div className="flex-1">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Danger zone</h4>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Deleting this page removes all boards and bookmarks inside it. You can undo it from the toast right after — after that, it's permanent.
              </p>
              <label className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--danger)' }}>
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(event) => setConfirmDelete(event.target.checked)}
                  className="h-3.5 w-3.5"
                />
                I understand and want to delete this page
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="danger" size="sm" disabled={!confirmDelete} onClick={onDeletePage}>
              <Trash2 className="h-4 w-4" />
              <span>Delete Page</span>
            </Button>
          </div>
        </Panel>
      </div>

      <div className="flex justify-end px-5 py-4 ui-divider-t">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
