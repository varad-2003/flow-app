import { createNode, NodeTypeEnum } from "@/lib/workflow/node-config";
import { Edge, Node } from "@xyflow/react";
import React, { createContext, useContext, useEffect, useState } from "react";

export type WorkflowView = "edit" | "preview"

interface WorkflowCotextType {
    view: WorkflowView;
    setView: (view: WorkflowView) => void;
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
    getVariablesForNode: (nodeId: string) => {
        id: string,
        label: string,
        outputs: string[]
    }[]
}

const workflowContext = createContext<WorkflowCotextType | undefined>(
    undefined
)

export function WorkflowProvider({
    initialNodes,
    initialEdges,
    children
} : {
    children: React.ReactNode,
    workflowId: any;
    initialNodes: Node[];
    initialEdges: Edge[];
}) {

    const start_node = createNode({
      type: NodeTypeEnum.START
    })

    const [view, setView] = useState<WorkflowView>("edit")
    const [nodes, setNodes] = useState<Node[]>([start_node]);
    const [edges, setEdges] = useState<Edge[]>([]);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges)
    }, [initialNodes, initialEdges])

    const getUpstreamNodes = (nodeId: string) => {
       const upstream = new Set<string>()
       
       const addToSet = (id: string) => {
        edges.filter((e) => e.target === id)
        .forEach((e) => {
            upstream.add(e.source) 
            addToSet(e.source)
        })
       }

       addToSet(nodeId);

       return upstream;
    }

    const getVariablesForNode = (nodeId: string) => {
        const upstreamIds = getUpstreamNodes(nodeId)
        return nodes
        .filter((node) => upstreamIds.has(node.id))
        .map((node) => ({
            id: node.id,
            label: String(node.data.label) || "Unkonwn",
            outputs: (node.data.outputs as string[]) || []
        }))
    }

    return(
        <workflowContext.Provider
        value={{
            view,
            setView,
            nodes,
            edges,
            setNodes,
            setEdges,
            getVariablesForNode
        }}
        >
            {children}
        </workflowContext.Provider>
    )
}

export function useWorkflow() {
    const context = useContext(workflowContext);
    if(context === undefined){
        throw new Error("useWorkflow must be used within a WorkflowProvider")
    }
    return context;
}