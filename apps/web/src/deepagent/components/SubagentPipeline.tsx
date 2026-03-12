import { Sparkles, Loader2 } from "lucide-react";
import type { SubagentStream } from "@langchain/langgraph-sdk/react";
import { SubagentCard } from "./SubagentCard";

import type { agent } from "../agent";

export function SubagentPipeline({
  subagents,
  isLoading,
}: {
  subagents: SubagentStream<typeof agent>[];
  isLoading: boolean;
}) {
  if (subagents.length === 0) {
    return null;
  }

  const completedCount = subagents.filter(
    (s) => s.status === "complete"
  ).length;
  const totalCount = subagents.length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-200">
              Specialist Agents Working
            </h3>
            <p className="text-xs text-zinc-500">
              {completedCount}/{totalCount} completed
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Agents working in parallel...</span>
          </div>
        )}
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-blue-500 via-violet-500 to-zinc-500 transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {subagents.map((subagent) => (
          <SubagentCard key={subagent.id} subagent={subagent} />
        ))}
      </div>
    </div>
  );
}
