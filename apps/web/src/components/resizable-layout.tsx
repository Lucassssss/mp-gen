"use client";

import * as React from "react";
import { ConversationsSidebar } from "@/components/conversations-sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { ArtifactPanel } from "@/components/artifact-panel";
import { PhonePreviewPanel } from "@/components/phone-preview-panel";
import { WebhooksModal } from "@/components/modals/webhooks-modal";
import { SystemModal } from "@/components/modals/system-modal";
import { AgentsModal } from "@/components/modals/agents-modal";
import { SetupWizard } from "@/components/setup-wizard";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const LAYOUT_STORAGE_KEY = "resizable-layout-state";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface LayoutState {
  sidebarWidth: number;
  artifactWidth: number;
  chatWidth: number;
  isSidebarCollapsed: boolean;
  isArtifactCollapsed: boolean;
}

function loadLayoutState(): LayoutState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load layout state:", e);
  }
  return null;
}

function saveLayoutState(state: LayoutState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save layout state:", e);
  }
}

interface ResizableLayoutProps {
  defaultSidebarWidth?: number;
  defaultArtifactWidth?: number;
  defaultChatWidth?: number;
  minSidebarWidth?: number;
  minArtifactWidth?: number;
  minChatWidth?: number;
  maxChatWidth?: number;
}

export function ResizableLayout({
  defaultSidebarWidth = 220,
  defaultArtifactWidth = 400,
  defaultChatWidth = 600,
  minSidebarWidth = 200,
  minArtifactWidth = 220,
  minChatWidth = 420,
  maxChatWidth = 800,
}: ResizableLayoutProps) {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [sidebarWidth, setSidebarWidth] = React.useState(defaultSidebarWidth);
  const [artifactWidth, setArtifactWidth] = React.useState(defaultArtifactWidth);
  const [chatWidth, setChatWidth] = React.useState(defaultChatWidth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isArtifactCollapsed, setIsArtifactCollapsed] = React.useState(false);
  
  const [isSidebarFloating, setIsSidebarFloating] = React.useState(false);
  const [isArtifactFloating, setIsArtifactFloating] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDraggingSidebar = React.useRef(false);
  const isDraggingArtifact = React.useRef(false);
  
  const [webhooksOpen, setWebhooksOpen] = React.useState(false);
  const [systemOpen, setSystemOpen] = React.useState(false);
  const [agentsOpen, setAgentsOpen] = React.useState(false);
  const [showSetupWizard, setShowSetupWizard] = React.useState(false);
  const [checkingConfig, setCheckingConfig] = React.useState(true);

  React.useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/status`);
      if (res.ok) {
        const data = await res.json();
        if (!data.isConfigured) {
          setShowSetupWizard(true);
        }
      }
    } catch (error) {
      console.error('Failed to check config:', error);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleOpenSettings = (tab: string) => {
    switch (tab) {
      case "webhooks":
        setWebhooksOpen(true);
        break;
      case "system":
        setSystemOpen(true);
        break;
      case "agents":
        setAgentsOpen(true);
        break;
    }
  };

  React.useEffect(() => {
    const saved = loadLayoutState();
    if (saved) {
      setSidebarWidth(saved.sidebarWidth);
      setArtifactWidth(saved.artifactWidth);
      setChatWidth(saved.chatWidth);
      setIsSidebarCollapsed(saved.isSidebarCollapsed);
      setIsArtifactCollapsed(saved.isArtifactCollapsed);
    }
    setIsInitialized(true);
    setTimeout(() => setIsMounted(true), 50);
  }, []);

  React.useEffect(() => {
    if (!isInitialized) return;
    saveLayoutState({
      sidebarWidth,
      artifactWidth,
      chatWidth,
      isSidebarCollapsed,
      isArtifactCollapsed,
    });
  }, [sidebarWidth, artifactWidth, chatWidth, isSidebarCollapsed, isArtifactCollapsed, isInitialized]);

  React.useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    const observer = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener("resize", updateContainerWidth);
      observer.disconnect();
    };
  }, []);

  const getLayoutState = React.useCallback(() => {
    const hasRoomForSidebar = containerWidth >= sidebarWidth;
    
    return {
      showSidebar: hasRoomForSidebar,
      showArtifact: true,
      floating: false
    };
  }, [containerWidth, sidebarWidth]);

  const layoutState = getLayoutState();
  
  // 计算实际显示状态
  const effectiveShowSidebar = !isSidebarCollapsed && (layoutState.showSidebar || isSidebarFloating);
  const effectiveShowArtifact = !isArtifactCollapsed && (layoutState.showArtifact || isArtifactFloating);

  const canShowSidebar = containerWidth >= 600 + sidebarWidth;
  const canShowArtifact = containerWidth >= 600;
  const needsFloatingSidebar = containerWidth < 600 + sidebarWidth && containerWidth >= 600;
  const needsFloatingArtifact = false;

  const handleToggleSidebar = () => {
    if (isSidebarCollapsed || (!effectiveShowSidebar && !isSidebarFloating)) {
      const neededChatWidth = 600;
      const totalNeeded = neededChatWidth + sidebarWidth;
      
      if (containerWidth >= totalNeeded) {
        setIsSidebarCollapsed(false);
        setIsSidebarFloating(false);
      } else {
        setIsSidebarFloating(true);
        setIsSidebarCollapsed(false);
      }
    } else {
      setIsSidebarFloating(false);
      setIsSidebarCollapsed(true);
    }
  };

  const handleToggleArtifact = () => {
    if (isArtifactCollapsed || (!effectiveShowArtifact && !isArtifactFloating)) {
      setIsArtifactCollapsed(false);
      setIsArtifactFloating(false);
    } else {
      setIsArtifactFloating(false);
      setIsArtifactCollapsed(true);
    }
  };

  const handleCloseFloatingSidebar = () => {
    setIsSidebarFloating(false);
  };

  const handleCloseFloatingArtifact = () => {
    setIsArtifactFloating(false);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDraggingSidebar.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(minSidebarWidth, Math.min(e.clientX - rect.left, 400));
      setSidebarWidth(newWidth);
    }
    if (isDraggingArtifact.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(minArtifactWidth, Math.min(rect.right - e.clientX, 800));
      setArtifactWidth(newWidth);
    }
  }, [minSidebarWidth, minArtifactWidth]);

  const handleMouseUp = React.useCallback(() => {
    isDraggingSidebar.current = false;
    isDraggingArtifact.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  React.useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startDraggingSidebar = () => {
    isDraggingSidebar.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startDraggingArtifact = () => {
    isDraggingArtifact.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden bg-gradient" ref={containerRef}>
      {/* Setup Wizard */}
      {showSetupWizard && (
        <SetupWizard onComplete={() => setShowSetupWizard(false)} />
      )}

      {/* Loading state while checking config */}
      {checkingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-muted-foreground">正在加载...</p>
          </div>
        </div>
      )}

      {/* Floating Sidebar Overlay */}
      {isSidebarFloating && (
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={handleCloseFloatingSidebar}
        />
      )}
      
      {/* Floating Sidebar */}
      {isSidebarFloating && (
        <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-background border-r border-border shadow-xl">
          <ConversationsSidebar onOpenSettings={handleOpenSettings} />
        </aside>
      )}

      {/* Floating Artifact Overlay */}
      {isArtifactFloating && (
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={handleCloseFloatingArtifact}
        />
      )}

      {/* Floating Artifact */}
      {isArtifactFloating && (
        <aside className="fixed right-0 top-0 bottom-0 z-50 bg-background border-l border-border shadow-xl p-3" style={{ width: artifactWidth, maxWidth: '90vw' }}>
          <div className="h-full bg-background rounded-lg shadow-sm overflow-hidden">
            <PhonePreviewPanel />
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        {effectiveShowSidebar && !isSidebarFloating && (
          <aside 
            className={cn(
              "shrink-0 flex flex-col transition-all duration-300 ease-out",
              isMounted ? "opacity-100" : "opacity-0"
            )} 
            style={{ width: sidebarWidth }}
          >
            <ConversationsSidebar onOpenSettings={handleOpenSettings} />
          </aside>
        )}

        {/* Sidebar Drag Handle */}
        {effectiveShowSidebar && !isSidebarFloating && (
          <div className="relative flex items-center group">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-primary/30 transition-colors duration-200"
              onMouseDown={startDraggingSidebar}
              title="拖拽调整宽度"
            />
          </div>
        )}

        {/* Chat Area Container */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-out",
          isMounted ? "opacity-100" : "opacity-0",
          effectiveShowSidebar
            ? (effectiveShowArtifact
              ? "p-3 pl-0 pr-1.5"
              : "p-3 pl-0 pr-3")
            : (effectiveShowArtifact
              ? "p-3 pr-1.5"
              : "p-3")
        )}>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background rounded-lg shadow-sm">
            <div className="w-full">
              <ChatPanel 
                isSidebarCollapsed={!effectiveShowSidebar}
                isArtifactCollapsed={!effectiveShowArtifact}
                onToggleSidebar={handleToggleSidebar}
                onToggleArtifact={handleToggleArtifact}
                headerOnly
              />
            </div>
            
            <div className="flex-1 flex justify-center min-w-0 overflow-hidden">
              <section 
                className="flex flex-col overflow-hidden"
                style={{ 
                  minWidth: minChatWidth,
                  maxWidth: maxChatWidth,
                }}
              >
                <ChatPanel 
                  isSidebarCollapsed={!effectiveShowSidebar}
                  isArtifactCollapsed={!effectiveShowArtifact}
                  onToggleSidebar={handleToggleSidebar}
                  onToggleArtifact={handleToggleArtifact}
                  contentOnly
                />
              </section>
            </div>
          </div>
        </div>

        {/* Artifact Panel Drag Handle */}
        {effectiveShowArtifact && !isArtifactFloating && (
          <div className="relative flex items-center group">
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-primary/30 transition-colors duration-200"
              onMouseDown={startDraggingArtifact}
              title="拖拽调整宽度"
            />
          </div>
        )}

        {/* Artifact Panel */}
        {effectiveShowArtifact && !isArtifactFloating && (
          <aside 
            className={cn(
              "shrink-0 flex flex-col p-3 pl-1 transition-all duration-300 ease-out",
              isMounted ? "opacity-100" : "opacity-0"
            )} 
            style={{ width: artifactWidth }}
          >
            <div className="bg-background h-full rounded-lg shadow-sm overflow-hidden">
              <PhonePreviewPanel />
            </div>
          </aside>
        )}
      </div>

      {/* Settings Modals */}
      <WebhooksModal isOpen={webhooksOpen} onClose={() => setWebhooksOpen(false)} />
      <SystemModal isOpen={systemOpen} onClose={() => setSystemOpen(false)} />
      <AgentsModal isOpen={agentsOpen} onClose={() => setAgentsOpen(false)} />
    </main>
  );
}
