import * as React from "react";
import { 
  Smartphone, 
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationStore } from "@/hooks/useConversations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface PreviewState {
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  usingDefault: boolean;
}

async function initSessionProject(sessionId: string): Promise<{ exists: boolean; projectId?: string; previewUrl?: string; status?: string; message?: string }> {
  const response = await fetch(`${API_BASE}/api/taro/init-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  return response.json();
}

async function checkTaroStatus(projectId: string): Promise<{ status: string; previewUrl?: string }> {
  const response = await fetch(`${API_BASE}/api/taro/status/${projectId}`);
  return response.json();
}

export function PhonePreviewPanel() {
  const currentConversation = useConversationStore((state) => state.currentConversation);
  const sessionId = currentConversation?.id;
  
  const [state, setState] = React.useState<PreviewState>({
    previewUrl: null,
    loading: true,
    error: null,
    usingDefault: false,
  });

  React.useEffect(() => {
    if (!sessionId) {
      setState({
        previewUrl: null,
        loading: false,
        error: null,
        usingDefault: false,
      });
      return;
    }

    const initPreview = async () => {
      setState(s => ({ ...s, loading: true, error: null }));
      
      try {
        const result = await initSessionProject(sessionId);
        
        if (!result.exists) {
          setState({
            previewUrl: null,
            loading: false,
            error: null,
            usingDefault: false,
          });
          return;
        }

        if (result.previewUrl && result.status === 'ready') {
          setState({
            previewUrl: result.previewUrl,
            loading: false,
            error: null,
            usingDefault: false,
          });
          return;
        }

        if (result.projectId) {
          for (let i = 0; i < 90; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const statusResult = await checkTaroStatus(result.projectId);
            if (statusResult.status === 'ready' && statusResult.previewUrl) {
              setState({
                previewUrl: statusResult.previewUrl,
                loading: false,
                error: null,
                usingDefault: false,
              });
              return;
            }
            if (statusResult.status === 'error') {
              setState({
                previewUrl: null,
                loading: false,
                error: '编译失败',
                usingDefault: false,
              });
              return;
            }
          }
        }
        
        setState(s => ({ ...s, loading: false }));
      } catch (err) {
        setState({
          previewUrl: null,
          loading: false,
          error: String(err),
          usingDefault: false,
        });
      }
    };

    initPreview();
  }, [sessionId]);

  const handleRefresh = () => {
    if (!sessionId) return;
    setState(s => ({ ...s, loading: true, error: null }));
    initSessionProject(sessionId).then(result => {
      if (result.previewUrl && result.status === 'ready') {
        setState({
          previewUrl: result.previewUrl,
          loading: false,
          error: null,
          usingDefault: false,
        });
      }
    });
  };

  if (state.loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">手机预览</h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3370ff]" />
          <p className="text-sm text-muted-foreground">正在启动预览...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">手机预览</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-sm text-red-500">{state.error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (!state.previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">手机预览</h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
            <Smartphone className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">等待生成小程序</p>
          <p className="text-xs text-muted-foreground/60 max-w-[200px]">
            描述你想要的小程序，AI 将自动生成代码并在预览区域展示
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">手机预览</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <div className="w-full h-full max-w-[375px] mx-auto bg-white shadow-2xl">
          <iframe
            src={state.previewUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="小程序预览"
          />
        </div>
      </div>
    </div>
  );
}
