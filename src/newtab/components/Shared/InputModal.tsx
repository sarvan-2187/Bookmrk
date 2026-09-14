import { useEffect, useId, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { Field } from './ui/Field';

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
  const [value, setValue] = useState('');
  const titleId = useId();

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSave(v);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      className="w-full max-w-md rounded-2xl overflow-hidden">
      <div className="border-b px-5 py-4">
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <Field label={label} counter={maxLength ? { current: value.length, max: maxLength } : undefined}>
          {(id) => (
            <input
              id={id}
              autoFocus
              value={value}
              onChange={(e) => setValue(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
              placeholder={placeholder}
              className="ui-input"
            />
          )}
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
