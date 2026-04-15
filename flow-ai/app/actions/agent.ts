"use server"
import { createMCPClient } from "@ai-sdk/mcp"
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai"
import { webSearch } from "@exalabs/ai-sdk"
import { openRouter } from "@/lib/openrouter";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/encryption";


export async function streamAgentAction({
    model,
    instructions,
    history,
    jsonOutput,
    selectedTools,
}: {
    model: string,
    instructions: string,
    history: UIMessage[],
    jsonOutput?: any,
    selectedTools: Array<
      |  { type: "native"; value: string }
      |  { type: "mcp"; value: string; serverId: string; tools: {name: string} []}
    >
}){

    const modelMessages = history.map(msg => {
        if(msg.role === "user"){
            const text = (msg.parts as any)?.find((p: any) => p.type === "text")?.text || ""
            return{
                role: "user",
                content: text
            }
        }
        if(msg.role === "assistant"){
            return extractAssistantContent(msg.parts)
        }
        return null
    })
    ?.filter((msg) => msg !== null)
    // const modelMessages = await convertToModelMessages(history)
    const tools: Record<string, any> = {}
    const mcpClients:any[] = []

    //native tools
    for(const t of selectedTools.filter(t => t.type === "native") as any){
        if(t.value === "webSearch") tools.webSearch = webSearch()
    }

    for(const t of selectedTools.filter(t => t.type === "mcp")){
      const { toolSet, mcpClient } = await getMcpToolsByServerId(t.serverId)
      mcpClients.push(mcpClient)
      
      for(const tool of t.tools){
        if(toolSet[tool.name]) tools[tool.name] = toolSet[tool.name]
      }
    }

    const toolList = Object.entries(tools)?.map(([name]) => `- ${name}`)?.join("\n")

    const systemPrompt = `You are a helpfull assistant.
    **Analyze the conversation flow:**
    1. Check YOUR last message - did you ask the user for information?
    2. If Yes and the user is providing that information -> treat it as a follow-up response.
    3. If No or user changes the topic -> classify the message independently as a new intent.

    **System Instructions:**
    ${instructions}

    ${toolList ? `**Available tools: \n${toolList}` : ""}`.trim()

    const result = streamText({
        model: openRouter.chat(model),
        system: systemPrompt,
        messages: modelMessages,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        stopWhen: stepCountIs(5),
        ...jsonOutput,
        onFinish: async () => {
          console.log(("closing MCP Clients"));
          for(const Client of mcpClients){
            await Client.close()
          }
        }
    })

    return result
}

function extractAssistantContent(parts: any[]){
    const content = parts?.filter((p: any) => 
        p.type === "data-workflow-node"
        && p.data.nodeType === "agent" 
    )?.map((p: any) => {
        const{ output } = p.data
        return typeof output === "string"
        ? output : output?.text
    })
        ?.filter(Boolean)
        ?.join("\n\n") || ""

    return {
        role: "assistant",
        content
    }
}

function extractAgentContent(parts: any[]) {
  const content: any[] = [];

  parts?.filter(p => p.type === "data-workflow-node"
    && p.data?.nodeType === "agent")
    ?.map(p => {
      const { type, toolCall, toolResult, output } = p.data;

      if (type === "tool-call" && toolCall) {
        content.push({
          type: "tool-call",
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.name
        });
      }
      if (type === "tool-result" && toolResult) {
        content.push({
          type: "tool-result",
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.name,
          result: toolResult.result
        });
      }
      if (typeof output === "string") {
        content.push({
          type: "text",
          text: output
        });
      } else if (output?.text) {
        content.push({
          type: "text",
          text: output.text
        });
      }
    });

  return {
    role: "assistant" as const,
    content: content.length > 0 ? content : ""
  };
}

async function getMcpToolsByServerId(serverId: string){
  const server = await prisma.mcpServer.findUnique({
    where: { id: serverId }
  })
  if(!server) throw new Error("MCP Server not found")
  let apiKey: string | undefined

if (server.token) {
  console.log("🔍 TOKEN:", server.token)
  console.log("🔍 SPLIT:", server.token.split(":"))

  try {
    apiKey = decrypt(server.token)
  } catch (err) {
    console.error("❌ BROKEN TOKEN:", server.token)
    apiKey = undefined
  }
}
  const url = server.url

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url,
      headers: apiKey ? {
        Authorization: `Bearer ${apiKey}` 
      } : undefined
    }
  })

  const toolSet = await mcpClient.tools()

  return { toolSet, mcpClient }
}

export async function connectMcpServer ({
  url,
  apiKey
} : {
  url: string;
  apiKey: string;
}){
  if(!url || !apiKey){
    throw new Error("URL and API key are required to connect to MCP server.")
  }

  const session = await getKindeServerSession();
  const user = await session.getUser()
  if(!user) throw new Error("Unauthorized")

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url,
      headers: apiKey? {
        Authorization: `Bearer ${apiKey}`
      } : undefined
    }
  })

  const toolSet = await mcpClient.tools()
  const toolsArray = Object.entries(toolSet)
    .map(([name, tool]) => ({
      name,
      description: tool.description || "",
    }))
    await mcpClient.close();
    return { tools: toolsArray }
}

export async function addMcpServer ({
  url,
  apiKey,
  label
} : {
  url: string,
  apiKey: string,
  label: string
}){
  const session = await getKindeServerSession();
  const user = await session.getUser()
  if(!user) throw new Error("Unauthorized")

  let server = await prisma.mcpServer.findFirst({
    where: {
      userId: user.id,
      url,
    }
  })

  const encryptedKey = apiKey ? encrypt(apiKey) : ""
  if(!server) {
    server = await prisma.mcpServer.create({
      data:{
        userId: user.id,
        label,
        url,
        token: encryptedKey 

      }
    })
  } else {
    server = await prisma.mcpServer.update({
      where: {id: server.id},
      data: {
        label,
        token: encryptedKey
      }
    })
  }

  return { serverId: server.id }
}