import { useState, useRef } from 'react';
import { Upload, Globe, X, Image as ImageIcon } from 'lucide-react';

export interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
  onInsertExternalUrl: (url: string, altText: string) => void;
}

export function InsertImageModal({
  isOpen,
  onClose,
  onUploadClick,
  onInsertExternalUrl,
}: InsertImageModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide an image URL');
      return;
    }
    onInsertExternalUrl(url.trim(), altText.trim() || 'Image');
    onClose();
  };

  const handleLocalUpload = () => {
    onClose();
    onUploadClick();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-stack-metal bg-stack-surface shadow-2xl overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stack-metal px-4 py-3 bg-stack-surface-raised">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stack-bone">
            <ImageIcon className="h-4 w-4 text-stack-steel" />
            <span>Insert Image</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-stack-steel hover:bg-stack-metal hover:text-stack-bone transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stack-metal/60 bg-stack-bg">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-red-500 text-stack-bone bg-stack-surface'
                : 'text-stack-steel hover:text-stack-bone'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Local Image</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${
              activeTab === 'url'
                ? 'border-b-2 border-red-500 text-stack-bone bg-stack-surface'
                : 'text-stack-steel hover:text-stack-bone'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>External URL</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'upload' ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="h-12 w-12 rounded-full bg-stack-metal/40 border border-stack-metal flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-stack-silver" />
              </div>
              <p className="text-xs text-stack-silver mb-1">
                Upload image from your device
              </p>
              <p className="text-[11px] text-stack-steel mb-5 max-w-xs">
                Images are optimized to WebP and persisted locally in user
                storage.
              </p>
              <button
                type="button"
                onClick={handleLocalUpload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-stack-metal hover:bg-stack-steel/40 text-stack-bone text-xs font-medium transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Choose Image File…</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stack-silver mb-1 font-medium">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.png"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  className="w-full rounded border border-stack-metal bg-stack-bg px-3 py-1.5 text-stack-bone placeholder-stack-steel/50 focus:border-red-500 focus:outline-none"
                  autoFocus
                />
                {error && (
                  <p className="text-red-400 text-[11px] mt-1">{error}</p>
                )}
              </div>

              <div>
                <label className="block text-stack-silver mb-1 font-medium">
                  Alt Text (optional)
                </label>
                <input
                  type="text"
                  placeholder="Descriptive image label"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full rounded border border-stack-metal bg-stack-bg px-3 py-1.5 text-stack-bone placeholder-stack-steel/50 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded border border-stack-metal text-stack-silver hover:bg-stack-metal text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white font-medium text-xs transition-colors"
                >
                  Insert
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
