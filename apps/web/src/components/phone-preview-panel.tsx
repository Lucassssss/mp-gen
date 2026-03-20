import * as React from "react";
import {
  Smartphone,
  RefreshCw,
  Play,
  Square,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationStore } from "@/hooks/useConversations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface PreviewState {
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'compiling' | 'ready' | 'error';
}

interface TaroApiResponse {
  success: boolean;
  projectId?: string;
  previewUrl?: string | null;
  status?: string;
  message?: string;
  error?: string;
}

async function startPreview(sessionId: string): Promise<TaroApiResponse> {
  const response = await fetch(`${API_BASE}/api/mp/start/${sessionId}`, {
    method: 'POST',
  });
  return response.json();
}

async function restartPreview(sessionId: string): Promise<TaroApiResponse> {
  const response = await fetch(`${API_BASE}/api/mp/restart/${sessionId}`, {
    method: 'POST',
  });
  return response.json();
}

async function stopPreview(sessionId: string): Promise<TaroApiResponse> {
  const response = await fetch(`${API_BASE}/api/mp/stop/${sessionId}`, {
    method: 'POST',
  });
  return response.json();
}

async function refreshPreview(sessionId: string): Promise<TaroApiResponse> {
  const response = await fetch(`${API_BASE}/api/mp/refresh/${sessionId}`, {
    method: 'POST',
  });
  return response.json();
}

async function getStatus(sessionId: string): Promise<TaroApiResponse> {
  const response = await fetch(`${API_BASE}/api/mp/status/${sessionId}`);
  return response.json();
}

function StatusBadge({ status }: { status: PreviewState['status'] }) {
  const config = {
    idle: { icon: null, text: '', className: '' },
    compiling: { icon: Loader2, text: '编译中', className: 'text-yellow-500' },
    ready: { icon: CheckCircle2, text: '运行中', className: 'text-green-500' },
    error: { icon: AlertCircle, text: '错误', className: 'text-red-500' },
  }[status];

  if (!config.icon) return null;

  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1 text-xs ${config.className}`}>
      {status === 'compiling' ? (
        <Icon className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>{config.text}</span>
    </div>
  );
}

export function PhonePreviewPanel() {
  const currentConversation = useConversationStore((state) => state.currentConversation);
  const sessionId = currentConversation?.id;

  const [state, setState] = React.useState<PreviewState>({
    previewUrl: null,
    loading: false,
    error: null,
    status: 'idle',
  });

  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const initPreview = React.useCallback(async () => {
    if (!sessionId) return;

    setState(s => ({ ...s, loading: true, error: null, status: 'compiling' }));

    try {
      const result = await startPreview(sessionId);
      console.log('[PhonePreview] startPreview result:', result);

      if (result.success && result.previewUrl) {
        setState({
          previewUrl: result.previewUrl,
          loading: false,
          error: null,
          status: 'ready',
        });
      } else if (result.status === 'compiling') {
        setState(s => ({ ...s, status: 'compiling', loading: true }));
        for (let i = 0; i < 90; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const statusResult = await getStatus(sessionId);
          console.log('[PhonePreview] polling status:', statusResult);

          if (statusResult.status === 'ready' && statusResult.previewUrl) {
            setState({
              previewUrl: statusResult.previewUrl,
              loading: false,
              error: null,
              status: 'ready',
            });
            return;
          }
          if (statusResult.status === 'error') {
            setState({
              previewUrl: null,
              loading: false,
              error: statusResult.error || '编译失败',
              status: 'error',
            });
            return;
          }
        }
        setState(s => ({ ...s, loading: false, status: 'idle' }));
      } else {
        setState({
          previewUrl: null,
          loading: false,
          error: result.error || '启动失败',
          status: 'error',
        });
      }
    } catch (err) {
      console.error('[PhonePreview] Error:', err);
      setState({
        previewUrl: null,
        loading: false,
        error: String(err),
        status: 'error',
      });
    }
  }, [sessionId]);

  React.useEffect(() => {
    if (!sessionId) {
      setState({ previewUrl: null, loading: false, error: null, status: 'idle' });
      return;
    }
    initPreview();
  }, [sessionId, initPreview]);

  const handleStart = async () => {
    if (!sessionId) return;
    setActionLoading('start');
    try {
      const result = await startPreview(sessionId);
      console.log('[PhonePreview] handleStart:', result);
      if (result.success) {
        setState(s => ({ ...s, status: result.previewUrl ? 'ready' : 'compiling', previewUrl: result.previewUrl || s.previewUrl }));
        if (!result.previewUrl) {
          await initPreview();
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    if (!sessionId) return;
    setActionLoading('restart');
    try {
      const result = await restartPreview(sessionId);
      console.log('[PhonePreview] handleRestart:', result);
      if (result.success) {
        setState(s => ({ ...s, status: 'compiling', previewUrl: null }));
        await initPreview();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    setActionLoading('stop');
    try {
      const result = await stopPreview(sessionId);
      console.log('[PhonePreview] handleStop:', result);
      if (result.success) {
        setState(s => ({ ...s, previewUrl: null, status: 'idle' }));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    if (!sessionId) return;
    setActionLoading('refresh');
    try {
      const result = await refreshPreview(sessionId);
      console.log('[PhonePreview] handleRefresh:', result);
      if (result.success) {
        setState(s => ({ ...s, status: result.status === 'ready' ? 'ready' : s.status }));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const renderHeader = () => (
    <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-foreground">手机预览</h2>
          <StatusBadge status={state.status} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStart}
          disabled={actionLoading !== null || state.status === 'ready'}
          title="启动预览"
        >
          {actionLoading === 'start' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          disabled={actionLoading !== null}
          title="重启预览"
        >
          {actionLoading === 'restart' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          disabled={actionLoading !== null || state.status === 'idle'}
          title="停止预览"
        >
          {actionLoading === 'stop' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={actionLoading !== null || state.status !== 'ready'}
          title="刷新预览"
        >
          {actionLoading === 'refresh' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );

  if (state.loading) {
    return (
      <div className="flex flex-col h-full">
        {renderHeader()}
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
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-500">{state.error}</p>
          <Button variant="outline" size="sm" onClick={handleRestart}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (!state.previewUrl) {
    return (
      <div className="flex flex-col h-full">
        {renderHeader()}
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
      {renderHeader()}
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
