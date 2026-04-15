import { ExecutorContextType } from "@/types/workflow";
import { Node } from "@xyflow/react";
import { Output } from "ai";

export async function executeStartNode(
    node: Node,
    context: ExecutorContextType
){
    return{
        output: {
            input: context.outputs[node.id].input || ""
        }
    }
}