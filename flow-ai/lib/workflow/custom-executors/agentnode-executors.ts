import { replaceVariables } from "@/lib/helper";
import { ExecutorContextType } from "@/types/workflow";
import { Node } from "@xyflow/react";
import { convertJsonSchemaToZod } from "zod-from-json-schema";
import { Output } from "ai";
import { MODELS } from "../constant";
import { streamAgentAction } from "@/app/actions/agent";

export async function executeAgentNode(
  node: Node,
  context: ExecutorContextType,
) {
  const { outputs, channel, history } = context;
  const {
    instructions,
    outputFormat = "text",
    responseSchema,
    tools: selectedTools = [],
    model: selectedModel,
  } = node.data as any;

  const model = selectedModel || MODELS[0].value;
  const replaceInstructions = replaceVariables(instructions, outputs);
  const jsonOutput =
    outputFormat === "json" && responseSchema
      ? {
          output: Output.object({
            schema: convertJsonSchemaToZod(responseSchema),
          }),
        }
      : undefined;

  const result = await streamAgentAction({
    model,
    instructions: replaceInstructions,
    history,
    jsonOutput,
    selectedTools,
  });

  if (outputFormat === "json") {
    try {
      const text = await result.text;
      return {
        output: JSON.parse(text),
      };
    } catch (error) {
      console.log(error);
      throw new Error(
        "Failed to parse JSON output. " + (error as Error).message,
      );
    }
  }

  let fullText = "";

  await channel.emit("workflow.chunk", {
    type: "chunk",
    message: {
      id: node.id,
      role: "assistant",
      content: [],
    },
  });

  for await (const chunk of result.fullStream) {
    switch (chunk.type) {
      case "text-delta":
        fullText += chunk.text;
        await channel.emit("workflow.chunk", {
          type: "chunk",
          content: chunk.text,
        });

        await channel.emit("workflow.chunk", {
          type: "data-workflow-node",
          id: node.id,
          data: {
            id: node.id,
            nodeType: node.type,
            nodeName: node.data.label,
            status: "loading",
            type: "text-delta",
            output: fullText,
          },
        });
        break;

      case "tool-call":
        await channel.emit("workflow.chunk", {
          type: "data-workflow-node",
          id: node.id,
          data: {
            id: node.id,
            nodeType: node.type,
            nodeName: node.data.label,
            status: "loading",
            output: fullText,
            type: "tool-call",
            toolCall: {
              name: chunk.toolName,
            },
          },
        });
        break;

      case "tool-result":
        await channel.emit("workflow.chunk", {
          type: "data-workflow-node",
          id: node.id,
          data: {
            id: node.id,
            nodeType: node.type,
            nodeName: node.data.label,
            status: "loading",
            type: "tool-result",
            output: fullText,
            toolResult: {
              toolCallId: chunk.toolCallId,
              name: chunk.toolName,
              result: chunk.output,
            },
          },
        });
        break;

      default:
        break;
    }
  }
  return {
    output: {
      text: fullText,
    },
  };
}
