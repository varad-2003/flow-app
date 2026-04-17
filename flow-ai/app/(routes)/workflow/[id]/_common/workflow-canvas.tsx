import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  useReactFlow,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Controls from "@/components/workflow/controls";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constants/workflow";
import { cn } from "@/lib/utils";
import NodePanel from "./node-panel";
import { useWorkflow } from "@/context/workflow-context";
import { createNode, NodeType, NodeTypeEnum } from "@/lib/workflow/node-config";
import StartNode from "@/components/workflow/custom-nodes/start/node";
import AgentNode from "@/components/workflow/custom-nodes/agent/node";
import IfElseNode from "@/components/workflow/custom-nodes/if-else/node";
import CommentNode from "@/components/workflow/custom-nodes/comment/node";
import EndNode from "@/components/workflow/custom-nodes/end/node";
import { useUpdateWorkflow } from "@/features/use-workflow";
import { ActionBar, ActionBarGroup, ActionBarItem } from "@/components/ui/action-bar";
import { Spinner } from "@/components/ui/spinner";
import { UseUnsavedChanges } from "@/hooks/use-unsaved-changes";
import ChatView from "@/components/workflow/chat";
import { useEffect } from "react";

const initialNodes = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];

const start_node = createNode({
  type: NodeTypeEnum.START
})
const WorkflowCanvas = ({workflowId}: { workflowId: string}) => {
  const { view, nodes, edges, setNodes, setEdges} = useWorkflow()  
  const { screenToFlowPosition } = useReactFlow() 
  
  const [toolMode, setToolMode] = useState<ToolModeType>(TOOL_MODE_ENUM.HAND)

  const { mutate: updateWorkflow , isPending: isSaving} = useUpdateWorkflow(workflowId)

  const { hasUnsavedChanges, discardChanges } = UseUnsavedChanges({
    nodes,
    edges,
  })


  const isSelectMode = toolMode === TOOL_MODE_ENUM.SELECT
  const isPreview = view === "preview"

  const nodeTypes = {
    [NodeTypeEnum.START]: StartNode,
    [NodeTypeEnum.AGENT]: AgentNode,
    [NodeTypeEnum.IF_ELSE]: IfElseNode,
    [NodeTypeEnum.COMMENT]: CommentNode,
    [NodeTypeEnum.END]: EndNode,
  }

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges],
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) =>{
    event.preventDefault();
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const node_type = event.dataTransfer.getData("application/reactflow") as NodeType

    if(!node_type) return null

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    })

    const newNode = createNode({
      type: node_type,
      position,
    })

    setNodes((nds) => [...nds, newNode])
  }, [screenToFlowPosition, setNodes])

  const handleDiscard = () => {
    const result = discardChanges()
    setNodes(result.nodes)
    setEdges(result.edges)
  }

  const handleSaveChanges = () => {
    updateWorkflow({ nodes, edges })
  }

  console.log("All nodes", nodes);
  console.log("All edges", edges);
  
  
  return (
    <>
      <div className="flex flex-1 h-full overflow-hidden relative">
        <div className="flex-1 relative h-full">
          <ReactFlow
          className={cn(
            isSelectMode ? "cursor-default" : "cursor-grab active:cursor-grabbing"
          )}
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onConnect={onConnect}
            // fitView
            panOnDrag={!isSelectMode}
            panOnScroll={!isSelectMode}
            zoomOnScroll={!isSelectMode}
            selectionOnDrag={isSelectMode}
            defaultViewport={{ x: 0, y: 0, zoom: 1.2}}
          >
            <Background 
            variant={BackgroundVariant.Dots}
            bgColor="var(--sidebar)"
            />
            { !isPreview && <NodePanel />}
            { !isPreview && <Controls
            toolMode={toolMode}
            setToolMode={setToolMode}
            />}
          </ReactFlow>
        </div>

        <ChatView workflowId={workflowId} />
      </div>

      <ActionBar
        open={hasUnsavedChanges}
        side="top"
        align="center"
        sideOffset={70}
        className="max-w-xs"
      >
        <ActionBarGroup>
          <ActionBarItem 
            disabled={isSaving}
            variant="ghost"
            onClick={handleDiscard}
          >
            Discard
          </ActionBarItem>
          <ActionBarItem
            disabled={isSaving}
            variant="ghost"
            onClick={handleSaveChanges}
          >
            {isSaving && < Spinner />}
            Save Changes
          </ActionBarItem>
        </ActionBarGroup>
      </ActionBar>


    </>
  );
};

export default WorkflowCanvas;
