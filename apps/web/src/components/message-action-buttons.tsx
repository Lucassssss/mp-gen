"use client";

import { memo } from "react";
import { Copy, Check, Trash2, Loader2 } from "lucide-react";

interface MessageActionButtonsProps {
  copied: boolean;
  isStreaming?: boolean;
  isDeleting?: boolean;
  onCopy: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const MessageActionButtons = memo(function MessageActionButtons({
  copied,
  isStreaming,
  isDeleting,
  onCopy,
  onDelete,
}: MessageActionButtonsProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    console.log("[MessageActionButtons] 删除按钮被点击");
    onDelete(e);
  };

  return (
    <div
      className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${
        isStreaming || isDeleting ? "pointer-events-none" : ""
      }`}
    >
      <button
        onClick={onCopy}
        disabled={isStreaming || isDeleting}
        className="p-1.5 rounded hover:bg-muted cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="复制"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      <button
        onClick={handleDeleteClick}
        disabled={isStreaming || isDeleting}
        className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="删除"
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
});
