import { Download, Check } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallInstructionsDialog } from './InstallInstructionsDialog';

interface InstallStackButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InstallStackButton({
  variant = 'secondary',
  size = 'md',
  className = '',
}: InstallStackButtonProps) {
  const { isInstalled, isDialogOpen, setIsDialogOpen, triggerInstall } =
    usePwaInstall();

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs border border-stack-metal bg-stack-surface text-stack-silver">
        <Check className="w-3.5 h-3.5 text-green-500" />
        <span>STACK Installed</span>
      </span>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={triggerInstall}
        className={className}
      >
        <Download className="w-4 h-4 text-stack-red-hover" />
        <span>Install STACK</span>
      </Button>

      <InstallInstructionsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
