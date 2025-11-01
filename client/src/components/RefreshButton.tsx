import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  label?: string;
  showLabel?: boolean;
}

export function RefreshButton({ onRefresh, label = '更新', showLabel = true }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Keep spinning for at least 500ms for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="outline"
      size={showLabel ? 'default' : 'icon'}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {showLabel && label}
    </Button>
  );
}
