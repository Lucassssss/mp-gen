"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Hammer } from "lucide-react";
import { Button } from "./ui/button";

interface ToolResultContentProps {
  name?: string;
  input?: string;
  output?: string;
  status?: "running" | "completed" | "error";
  isCollapsed?: boolean;
}

export function ToolResultContent({ name, input, output, status = "running", isCollapsed: externalCollapsed }: ToolResultContentProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(externalCollapsed ?? false);

  useEffect(() => {
    if (externalCollapsed !== undefined) {
      setInternalCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

  const isCollapsed = internalCollapsed;

  const handleToggle = () => {
    setInternalCollapsed(!internalCollapsed);
  };

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "bg-blue-50 dark:bg-blue-800 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400";
      case "error":
        return "bg-red-50 dark:bg-red-800 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400";
      default:
        return "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusDot = () => {
    const colorClass = status === "running" 
      ? "bg-blue-500" 
      : status === "error" 
        ? "bg-red-500" 
        : "bg-green-500";
    return <span className={`w-1 h-1 rounded-full ${colorClass}`} />;
  };

  return (
    <div className={`${getStatusColor()}`}>
      <Button
        onClick={handleToggle}
        variant="ghost"
        className="flex text-xs items-center justify-between gap-2 w-full font-normal bg-zinc-50 dark:bg-zinc-800"
      >
        <div className="flex items-center gap-2">
          <span>
              {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-auto" />
            )}
          </span>
          <Hammer className="w-3.5 h-3.5" />
        <span className="">工具调用 ( {name} ) </span>
        </div>
        {getStatusDot()}
      </Button>
      
      {!isCollapsed && (
        <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-[200px] overflow-y-auto">
          {input && (
            <div className="text-muted-foreground">
              <span className="font-medium">输入:</span> {input}
            </div>
          )}
          {output && (
            <div>
              <span className="font-medium">输出:</span> 
              <pre className="mt-1 whitespace-pre-wrap break-all">{output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
