import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  FolderTree,
  Columns,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';

interface CoachMarkTourProps {
  userSub?: string;
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STORAGE_PREFIX = 'stack_tour_completed_';

export function CoachMarkTour({
  userSub = 'local',
  isOpen,
  onClose,
}: CoachMarkTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Create a note here.',
      description:
        'Initialize blank notes with the "+ New" button or press Ctrl+N anytime. Keystrokes commit instantly to local IndexedDB.',
      icon: <FileText className="w-5 h-5 text-stack-red-hover" />,
    },
    {
      title: 'Search everything with Ctrl + K.',
      description:
        'Press Ctrl+K (or Cmd+K) to open the Command Palette. Instantly filter documents, jump between notes, or execute actions.',
      icon: <Search className="w-5 h-5 text-stack-silver" />,
    },
    {
      title: 'Drag notes into folders.',
      description:
        'Organize your stack with nested folders. Drag notes into projects without altering their portable Markdown content.',
      icon: <FolderTree className="w-5 h-5 text-stack-silver" />,
    },
    {
      title: 'Switch between Write, Split, and Read.',
      description:
        'Toggle between pure editor focus, side-by-side preview, or presentation reading mode using Ctrl+1, Ctrl+2, and Ctrl+3.',
      icon: <Columns className="w-5 h-5 text-stack-red-hover" />,
    },
  ];

  if (!isOpen) return null;

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${TOUR_STORAGE_PREFIX}${userSub}`, 'true');
    }
    onClose();
  };

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const activeStep = steps[currentStep] || steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/75 backdrop-blur-xs select-none font-mono animate-fade-in">
      <div className="w-full max-w-md border border-stack-metal bg-stack-surface p-6 rounded-lg shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stack-metal/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stack-steel uppercase tracking-widest">
              QUICK TOUR · PROTOCOL {currentStep + 1} OF {steps.length}
            </span>
          </div>
          <button
            onClick={handleFinish}
            title="Skip tour"
            className="text-stack-steel hover:text-stack-bone text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex items-start gap-4 py-2">
          <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised shrink-0">
            {activeStep?.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stack-bone tracking-tight">
              {activeStep?.title}
            </h3>
            <p className="text-xs text-stack-silver leading-relaxed">
              {activeStep?.description}
            </p>
          </div>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-stack-red-slate'
                  : 'w-1.5 bg-stack-metal'
              }`}
            />
          ))}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-stack-metal/60 pt-3">
          <button
            onClick={handleFinish}
            className="text-xs text-stack-steel hover:text-stack-bone transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </Button>
            )}

            {isLast ? (
              <Button variant="primary" size="sm" onClick={handleFinish}>
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>Done</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
