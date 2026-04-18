import { Edge, Node } from "@xyflow/react";
import { UIMessage } from "ai";
import { getNodeExecutor, NodeType, NodeTypeEnum } from "./node-config";
import { ExecutorContextType } from "@/types/workflow";
import TopologicalSort from "topological-sort"
import { success } from "zod";



export function topologicalSort(nodes: Node[], edges: Edge[]){
    const ts = new TopologicalSort(new Map())
    const excludedNodes: NodeType[] = [NodeTypeEnum.COMMENT]

    nodes.forEach(node => {
        ts.addNode(node.id, node)
    })

    edges.forEach(edge => {
        ts.addEdge(edge.source, edge.target)
    })

    try {
        const sortedMap = ts.sort();
        const sortedIds = Array.from(sortedMap.keys())
        return sortedIds
            .map((id) => nodes.find((node) => node.id === id)!).filter(
                (node) => node.type !== undefined && !excludedNodes.includes(node.type as NodeType)
            )
    } catch (error) {
        throw new Error(
            "Workflow contains a cycle or invalid dependencies. Cannot execute.",
            { cause: error}
        )
    }
}

export function getNextNodes(
  currentNodeId: string,
  edges: Edge[],
  context: ExecutorContextType
) {
  const outgoingEdges = edges.filter(
    (edge) => edge.source === currentNodeId);

  if (outgoingEdges.length === 0) return [];

  const currentOutput = context.outputs[currentNodeId];

  if (currentOutput?.selectedBranch) {
    const branchEdge = outgoingEdges.find(
      (edge) => edge.sourceHandle === currentOutput.selectedBranch);
    return branchEdge ? [branchEdge.target] : [];
  }

  return outgoingEdges.map((edge) => edge.target);
}

export async function executeWorkflow(
    nodes: Node[],
    edges: Edge[],
    userInput: string,
    messages: UIMessage[],
    channel: any,
    workflowRunId: string,
){
    console.log("🚀 WORKFLOW STARTED");
    const startNode = nodes.find(node => node.type === NodeTypeEnum.START)
    if(!startNode) throw new Error("Start node not found in the workflow")

    const context: ExecutorContextType = {
        outputs: {
            [startNode.id]: { input: userInput },
        },
        history: messages || [],
        workflowRunId,
        channel,
    }

    const sortedNodes = topologicalSort(nodes, edges)

    const nodeToExecute = new Set<string>([startNode.id])

    for(const node of sortedNodes) {
        console.log("👉 Executing node:", node.id, node.type);
        if(!nodeToExecute.has(node.id)){
            continue
        }
        const nodeType = node.type as NodeType;
        const exector = getNodeExecutor(nodeType)
        //Emit loading to client
        await channel.emit("workflow.chunk", {
            type: "data-workflow-node",
            id: node.id,
            data: {
                id: node.id,
                nodeType: node.type,
                nodeName: node.data.label,
                status: "loading"
            }
        })

        try {
            const result = await exector(node, context);
            const text = result.output?.text || result.output;

            if (node.type === NodeTypeEnum.AGENT && text) {
    await channel.emit("workflow.chunk", {
        type: "chunk",
        content: text,
    });
}

            await channel.emit("workflow.chunk", {
                type: "data-workflow-node",
                id: node.id,
                data: {
                    id: node.id,
                    nodeType: node.type,
                    nodeName: node.data.label,
                    status: "complete",
                    output: text
                }
            })

            if(node.type !== NodeTypeEnum.START){
                const outputResult = node.type === NodeTypeEnum.AGENT ? result : result.output
                context.outputs[node.id] = outputResult
            }

            if(node.type === NodeTypeEnum.END){
                console.log("Workflow execution completed.");
                await channel.emit("workflow.chunk", {
                    type: "finish",
                    reason: "stop"
                })
                return {
                    success: true,
                    output: context.outputs,
                }
            }
            console.log("Node done:", node.id)
            console.log("Stored output:", context.outputs[node.id])

            const nextNodeIds = getNextNodes(node.id, edges, context)
            console.log("Next node triggered:", nextNodeIds)

            if(nextNodeIds.length === 0){
                await channel.emit("workflow.chunk", {
                    type: "finish",
                    reason: "stop"
                })
                return {
                    success: true,
                    output: "Workflow stopped. No need to execute.",
                }
            }
            nextNodeIds.forEach((id) => nodeToExecute.add(id))
        } catch(error){
            await channel.emit("workflow.chunk", {
            type: "data-workflow-node",
            id: node.id,
            data: {
                id: node.id,
                nodeType: node.type,
                nodeName: node.data?.label,
                status: "error",
                error: error instanceof Error ? error.message : String(error),
                },
        });
        throw error;
        }

    } 

    await channel.emit("workflow.chunk", {
        type: "finish",
        reason: "stop"
    })
    return {
        success: true,
        output: context.outputs
    }
}