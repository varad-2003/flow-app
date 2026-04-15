import { cn } from "@/lib/utils";
import { getNodeConfig, NodeTypeEnum } from "@/lib/workflow/node-config";
import { Panel } from "@xyflow/react";
import { group } from "console";
import React from "react";

const NodePanel = () => {
  const NODE_LIST = [
    {
      group: "Core",
      items: [NodeTypeEnum.AGENT, NodeTypeEnum.END, NodeTypeEnum.COMMENT],
    },
    {
      group: "Logic",
      items: [NodeTypeEnum.IF_ELSE],
    },
    {
      group: "Network",
      items: [NodeTypeEnum.HTTP],
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <Panel
      position="top-left"
      className="flex flex-col w-60 top-10! h-fit bg-card shadow-xl pb-5 rounded-lg"
    >
      <div className="flex-1 p-4 space-y-2">
        {NODE_LIST.map((group) => (
          <div key={group.group} className="space-y-1">
            <h4 className="text-[11px] font-medium text-muted-foreground px-1">
              {group.group}
            </h4>
            <div className="space-y-1">
              {group.items.map((nodeType) => {
                const config = getNodeConfig(nodeType);
                if (!config) return null;
                const Icon = config?.icon;

                return (
                  <button
                    key={nodeType}
                    draggable
                    onDragStart={(e) => onDragStart(e, nodeType)}
                    disabled={false}
                    className={cn(
                      `w-full flex items-center gap-3 p-1 hover:bg-accent transition-all cursor-grab active:cursor-grabbing  disabled:opacity-50 disabled:pointer-events-none`,
                    )}
                  >
                    <div
                      className={cn(
                        `rounded-sm size-7 flex items-center`,
                        config.color,
                      )}
                    >
                      <Icon className="ml-1 size-5! text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export default NodePanel;
