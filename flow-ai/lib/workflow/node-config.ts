import { FileIcon, GitBranch, Globe, MousePointer2Icon, Play, Square } from "lucide-react";
import React from "react";
import { generateId } from "../helper";
import { MODELS } from "./constant";
import { executeStartNode } from "./custom-executors/start-executor";
import { executeAgentNode } from "./custom-executors/agentnode-executors";
import { executeIfElseNode } from "./custom-executors/IfElse-executor";
import { executeEndNode } from "./custom-executors/end-executor";


export const NodeTypeEnum = {
    START: "start",
    AGENT: "agent",
    IF_ELSE: "if_else",
    END: "end",
    HTTP: "http",
    COMMENT: "comment"
} as const;

export type NodeType = (typeof NodeTypeEnum)[keyof typeof NodeTypeEnum]

// node executor
export const NODE_EXECUTORS = {
    [NodeTypeEnum.START]: executeStartNode,
    [NodeTypeEnum.AGENT]: executeAgentNode,
    [NodeTypeEnum.IF_ELSE]: executeIfElseNode,
    [NodeTypeEnum.END]: executeEndNode,


}


type NodeConfigBase = {
    type: NodeType;
    label: string;
    icon: React.ElementType
    color: string;

    inputs: Record<string, any>
    outputs: string[]; 
}

export const NODE_CONFIG:Record<NodeType, NodeConfigBase> = {
    [NodeTypeEnum.START]: {
        type: NodeTypeEnum.START,
        label: "Start",
        icon: Play,
        color: "bg-emerald-500",
        inputs: {
            inputValue: ""
        },
        outputs: ["inputs"],
    },
    [NodeTypeEnum.AGENT]: {
        type: NodeTypeEnum.AGENT,
        label: "Agent",
        icon: MousePointer2Icon,
        color: "bg-blue-500",
        inputs: {
            label: "Agent",
            instructions: "",
            model: MODELS[0].value,
            tools: [],
            outputFormat: "text",
            responseSchema: null,
        },
        outputs: ["output.text"],
    },
    [NodeTypeEnum.IF_ELSE]: {
        type: NodeTypeEnum.IF_ELSE,
        label: "If / Else",
        icon: GitBranch,
        color: "bg-orange-500",
        inputs: {
            conditions: [
                {
                    caseName: "",
                    variable: "",
                    operator: "",
                    value: "",
                }
            ]
        },
        outputs: ["output.results"],
    },

    [NodeTypeEnum.HTTP]: {
        type: NodeTypeEnum.HTTP,
        label: "HTTP",
        icon: Globe,
        color: "bg-blue-500",
        inputs: {
            method: "GET",
            url: "",
            headers: {},
            body: {},
        },
        outputs: ["output.body"],
    },
    [NodeTypeEnum.END]: {
        type: NodeTypeEnum.END,
        label: "End",
        icon: Square,
        color: "bg-red-500",
        inputs: {
            value: ""
        },
        outputs: ["output.text"],
    },
    [NodeTypeEnum.COMMENT]: {
        type: NodeTypeEnum.COMMENT,
        label: "Note",
        icon: FileIcon,
        color: "bg-gray-500",
        inputs: {
            comment: ""
        }, 
        outputs: [],
    },
} as const

export const getNodeConfig = (type: NodeType) => {
    const nodeType = NODE_CONFIG?.[type]
    if(!nodeType) return null;
    return nodeType
}

export const getNodeExecutor = (type: NodeType) => {
    const executor = NODE_EXECUTORS?.[type as keyof typeof NODE_EXECUTORS] 
    if(!executor) {
        throw new Error(`No executor found for node type ${type}`)
    }
    return executor
}

export type CreateNodeOptions = {
    type: NodeType,
    position?: { x: number; y: number}
}

export function createNode({
    type,
    position = { x: 400, y: 200},
}: CreateNodeOptions){
    const config = getNodeConfig(type)
    if(!config) throw new Error(`No node config found ${type}`)
    const id = generateId(type)
    return{
        id,
        type,
        position,
        deletable: type === NodeTypeEnum.START ? false : true,
        data: {
            label: config.label,
            color: config.color,
            outputs: config.outputs,
            ...config.inputs,
        }
    }
}