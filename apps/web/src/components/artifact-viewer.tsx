"use client";

import * as React from "react";
import { 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Code, 
  Database, 
  FileJson, 
  File, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface ArtifactViewerProps {
  artifacts?: Artifact[];
  className?: string;
}

function ArtifactCard({ 
  artifact, 
  isExpanded, 
  onToggle,
  getTypeIcon 
}: { 
  artifact: Artifact;
  isExpanded: boolean;
  onToggle: () => void;
  getTypeIcon: (type: string) => React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {getTypeIcon(artifact.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{artifact.title}</div>
          <div className="text-xs text-muted-foreground capitalize">{artifact.type}</div>
        </div>
        <button className="p-1.5 hover:bg-accent rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="border-t border-border/50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {artifact.content.length} 字符
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  复制
                </>
              )}
            </button>
          </div>
          <div className="p-4 max-h-64 overflow-auto">
            <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
              {artifact.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArtifactViewer({ artifacts = [], className }: ArtifactViewerProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "code":
      case "javascript":
      case "typescript":
      case "python":
        return <Code className="w-4 h-4" />;
      case "json":
        return <FileJson className="w-4 h-4" />;
      case "database":
      case "sql":
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-base font-semibold text-foreground">Artifact</span>
            <span className="text-xs text-muted-foreground ml-2">
              {artifacts.length > 0 ? `${artifacts.length} 个` : '暂无'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-accent rounded-xl transition-colors"
          aria-label={isExpanded ? "收起面板" : "展开面板"}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        artifacts.length > 0 ? (
          <ScrollArea className="flex-1 px-3 pb-3">
            <div className="space-y-2">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  isExpanded={expandedIds.has(artifact.id)}
                  onToggle={() => toggleExpand(artifact.id)}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">暂无 Artifact</p>
            <p className="text-xs text-muted-foreground/70">
              AI 生成的代码和数据将显示在这里
            </p>
          </div>
        )
      )}
    </div>
  );
}
