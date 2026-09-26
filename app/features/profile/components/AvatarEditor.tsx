import { useState, useRef } from 'react';
import { Camera, Trash2, Upload, Check } from 'lucide-react';
import { Button } from '~/components/atoms/Button';

interface AvatarEditorProps {
  currentAvatar?: string;
  userName?: string;
  onSave: (avatarWebPBase64: string) => void;
  onRemove: () => void;
}

export function AvatarEditor({
  currentAvatar,
  userName = 'Operator',
  onSave,
  onRemove,
}: AvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImageTo512WebP = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate center square crop
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, 512, 512);

        // Convert to WebP format (or PNG fallback)
        const webpDataUrl = canvas.toDataURL('image/webp', 0.88);
        setPreview(webpDataUrl);
        onSave(webpDataUrl);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageTo512WebP(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageTo512WebP(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processImageTo512WebP(file);
          break;
        }
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
  };

  return (
    <div
      onPaste={handlePaste}
      tabIndex={0}
      className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-lg border border-stack-metal bg-stack-surface-raised font-mono focus:outline-none focus:border-stack-steel"
    >
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar circular preview */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative group cursor-pointer w-20 h-20 rounded-full border-2 border-stack-metal overflow-hidden bg-stack-surface flex items-center justify-center shrink-0 hover:border-stack-red-slate transition-colors"
      >
        {preview ? (
          <img
            src={preview}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stack-metal/40 text-stack-bone font-bold text-xl uppercase">
            {userName.slice(0, 2)}
          </div>
        )}

        <div className="absolute inset-0 bg-stack-bg/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-stack-bone">
          <Camera className="w-5 h-5 text-stack-red-hover" />
        </div>
      </div>

      {/* Controls & instructions */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-stack-bone">Operator Avatar</h4>
          <p className="text-[11px] text-stack-steel leading-relaxed">
            Drag & drop, paste clipboard screenshot, or select image.
            Auto-cropped via native HTML5 Canvas to 512×512 WebP.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="w-3 h-3" />
            <span>{isProcessing ? 'Processing…' : 'Upload Image'}</span>
          </Button>

          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-stack-red-hover hover:border-stack-red-hover"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
