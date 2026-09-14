import { useId } from 'react';
import { ExternalLink, Sparkles, Star } from 'lucide-react';
import { Modal } from './Modal';

type OnboardingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const GITHUB_URL = 'https://github.com/sarvan-2187/Bookmrk';

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="w-full max-w-lg overflow-hidden rounded-3xl">
      <div className="px-6 py-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] [border-width:var(--border-width)]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <Sparkles className="h-4 w-4" />
          Welcome to Bookmrk
        </div>

        <h2 id={titleId} className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Welcome To Bookmrk
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
          Bookmrk is an open source project. If you like it, please star the GitHub repo and help support the project.
        </p>

        <div className="mt-5 rounded-2xl border p-4 [border-width:var(--border-width)]" style={{ backgroundColor: 'var(--surface-muted)' }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Help support the project
              </h3>
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                Star the repo to show support and help more people discover Bookmrk.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Get Started
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Star on GitHub
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Modal>
  );
}
