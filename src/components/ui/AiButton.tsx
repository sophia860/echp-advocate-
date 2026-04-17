import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AiButtonProps {
  onClick: () => void;
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function AiButton({ onClick, isLoading, children, className }: AiButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-900/10 hover:bg-brand-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Thinking...</span>
        </>
      ) : (
        <>
          <Sparkles size={14} />
          {children}
        </>
      )}
    </button>
  );
}
