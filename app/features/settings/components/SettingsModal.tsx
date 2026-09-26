import { useState } from 'react';
import {
  X,
  HardDrive,
  Shield,
  Sliders,
  Info,
  Download,
  Upload,
  Check,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { Badge } from '~/components/atoms/Badge';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteCount: number;
}

export function SettingsModal({
  isOpen,
  onClose,
  noteCount,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<
    'general' | 'storage' | 'sync' | 'about'
  >('general');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl rounded-lg border border-stack-metal bg-stack-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stack-metal/80 bg-stack-surface-raised">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-stack-silver" />
            <h2 className="font-mono text-sm font-bold text-stack-bone tracking-wide">
              SYSTEM CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stack-steel hover:text-stack-bone p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation sidebar */}
          <div className="w-44 border-r border-stack-metal/70 bg-stack-bg p-3 space-y-1 shrink-0 font-mono text-xs">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'bg-stack-metal text-stack-bone font-medium'
                  : 'text-stack-steel hover:text-stack-silver'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                activeTab === 'storage'
                  ? 'bg-stack-metal text-stack-bone font-medium'
                  : 'text-stack-steel hover:text-stack-silver'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Storage</span>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                activeTab === 'sync'
                  ? 'bg-stack-metal text-stack-bone font-medium'
                  : 'text-stack-steel hover:text-stack-silver'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Cloud Sync</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'bg-stack-metal text-stack-bone font-medium'
                  : 'text-stack-steel hover:text-stack-silver'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>About</span>
            </button>
          </div>

          {/* Tab details */}
          <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-stack-silver space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stack-bone mb-1">
                    Visual Theme
                  </h3>
                  <p className="text-stack-steel text-[11px] mb-3">
                    Post-war industrial steel palette with restrained red-slate
                    accents.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-2 border-stack-red-slate rounded p-3 bg-stack-bg">
                      <div className="font-bold text-stack-bone text-xs mb-1">
                        Gunmetal Dark (Active)
                      </div>
                      <div className="text-[10px] text-stack-steel">
                        Low eye-strain slate finish
                      </div>
                    </div>
                    <div className="border border-stack-metal/60 rounded p-3 bg-stack-surface-raised opacity-60">
                      <div className="font-bold text-stack-silver text-xs mb-1">
                        Post-War High-Contrast
                      </div>
                      <div className="text-[10px] text-stack-steel">
                        Experimental industrial mono
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stack-metal/40">
                  <h3 className="text-sm font-bold text-stack-bone mb-1">
                    Editor Defaults
                  </h3>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 text-stack-silver">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-stack-metal accent-stack-red-slate"
                      />
                      <span>Display line numbers in CodeMirror</span>
                    </label>
                    <label className="flex items-center gap-2 text-stack-silver">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-stack-metal accent-stack-red-slate"
                      />
                      <span>Wrap long lines automatically</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stack-bone mb-1">
                    Local IndexedDB Status
                  </h3>
                  <p className="text-stack-steel text-[11px] mb-3">
                    All notes exist primarily in your browser's persistent
                    sandboxed IndexedDB storage.
                  </p>
                  <div className="rounded border border-stack-metal bg-stack-bg p-3.5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-stack-steel">Total Notes:</span>
                      <span className="font-bold text-stack-bone">
                        {noteCount} documents
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stack-steel">
                        Estimated Local Size:
                      </span>
                      <span className="text-stack-bone">~48.2 KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stack-steel">Engine Status:</span>
                      <span className="text-emerald-400">Ready & Verified</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stack-metal/40">
                  <h3 className="text-sm font-bold text-stack-bone mb-2">
                    Import / Export
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        alert('Notes exported as plain Markdown files.')
                      }
                    >
                      <Download className="h-3 w-3 mr-1" /> Export All (.md)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert('Select Markdown files from disk.')}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Import Files
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stack-bone mb-1">
                    AWS Cloud Synchronization
                  </h3>
                  <p className="text-stack-steel text-[11px] mb-3">
                    Optional end-to-end encrypted backup to your personal or
                    team AWS infrastructure.
                  </p>
                  <div className="rounded border border-stack-metal bg-stack-bg p-3.5 space-y-3">
                    <div>
                      <label className="text-[10px] text-stack-steel uppercase">
                        Endpoint URL
                      </label>
                      <input
                        type="text"
                        disabled
                        value="https://api.modula.tools/v1/sync"
                        className="mt-1 w-full rounded border border-stack-metal bg-stack-surface px-2.5 py-1.5 text-xs text-stack-steel"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-stack-steel">
                        Cloud Transport Mode:
                      </span>
                      <Badge variant="accent">Disabled (Local First)</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/brand/stack-logo.webp"
                    alt="STACK"
                    className="h-10 w-10 object-contain"
                  />
                  <div>
                    <h3 className="text-base font-bold text-stack-bone">
                      STACK
                    </h3>
                    <p className="text-stack-steel text-[11px]">
                      A Modula Project · v0.1.0
                    </p>
                  </div>
                </div>
                <p className="text-stack-silver text-xs leading-relaxed">
                  STACK is a production-grade, local-first Markdown note-taking
                  engine built for Windows and Linux users with installable PWA
                  support.
                </p>
                <div className="rounded border border-stack-metal/60 bg-stack-bg p-3 text-[11px] space-y-1">
                  <div>
                    License: MIT License, 2026 - crafted with &lt;3 by{' '}
                    <a
                      href="https://github.com/parikesitad-pm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stack-bone underline decoration-stack-red-slate hover:text-stack-silver"
                    >
                      parikesitad-pm
                    </a>
                  </div>
                  <div>
                    Repository:{' '}
                    <a
                      href="https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stack-silver underline hover:text-stack-bone"
                    >
                      github.com/parikesitad-pm/stack-react_ts_with_aws_deployment
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-stack-metal/80 bg-stack-surface-raised">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
