"use client";

import { useEffect } from "react";
import { useConversationStore } from "@/hooks/useConversations";
import { MessageSquare, Plus, Trash2, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ConversationsSidebar() {
  const {
    conversations,
    currentConversation,
    loading,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useConversationStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = async () => {
    await createConversation("新对话");
  };

  const handleSelect = async (id: string) => {
    await selectConversation(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这个对话吗？")) {
      await deleteConversation(id);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">对话历史</h2>
            <p className="text-xs text-muted-foreground">{conversations.length} 个对话</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          新对话
        </button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-1">
          {loading && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">加载中...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">暂无对话</p>
              <p className="text-xs text-muted-foreground/70">点击上方按钮开始新对话</p>
            </div>
          ) : (
            conversations.map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                  currentConversation?.id === conv.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  currentConversation?.id === conv.id 
                    ? "bg-primary/20" 
                    : "bg-muted group-hover:bg-muted/70"
                )}>
                  <MessageSquare className={cn(
                    "w-4 h-4",
                    currentConversation?.id === conv.id ? "text-primary" : "text-muted-foreground"
                  )} />
                </div> */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate font-medium">{conv.title}</div>
                  {/* <div className="text-xs text-muted-foreground/70">{formatDate(conv.updatedAt)}</div> */}
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-lg transition-all"
                  aria-label="删除对话"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
