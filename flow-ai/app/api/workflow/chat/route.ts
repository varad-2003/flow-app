import prisma from "@/lib/prisma"
import { realtime } from "@/lib/realtime"
import { executeWorkflow } from "@/lib/workflow/execute-workflow"
import { Client } from "@upstash/qstash"
import { serve } from "@upstash/workflow/nextjs"
import { Edge, Node } from "@xyflow/react"
import { UIMessage } from "ai"


export const GET = async (req: Request) => {
    const { searchParams } = new URL(req.url)
    const workflowRunId = searchParams.get("id")
    if(!workflowRunId) return new Response("Missing workflow run id", { status: 400 })

     const channel = realtime.channel(workflowRunId)

     const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            await channel.subscribe({
                events: ["workflow.chunk"],
                history: true,
                onData({ event, data, channel }) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                    )
                    if(data.type === "finish") controller.close()
                }
        })
        req.signal.addEventListener("abort", () => {
            controller.close()
        })
        }
     })

     return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
        }
     })

}

export const { POST } = serve(
    async (ctx) => {
        console.log("🚀 WORKER HIT")
        const { workflowId, messages } = ctx.requestPayload as {
            workflowId: string;
            messages: UIMessage[]
        }

        const workflowRunId = ctx.workflowRunId
        console.log("⚡ WORKER RECEIVED ID:", workflowRunId);
        const channel = realtime.channel(workflowRunId)
        const message = messages[messages.length - 1]
        const userInput = message.role === "user" && message.parts[0].type === 'text' ? message.parts[0].text : ""

        const { nodes, edges } = await ctx.run("fetch-from-database", async () => {
            console.log("📦 FETCHING WORKFLOW DATA");
            const workflowData = await prisma.workflow.findUnique({
                where: {
                    id: workflowId
                }
            })
            if(!workflowData) throw new Error("Workflow not found")
            const obj = JSON.parse(workflowData.flowObject)
            const nodes = obj.nodes as Node[]
            const edges = obj.edges as Edge[]
            return { nodes, edges }
        })

        await ctx.run("workflow-execution", async () => {
            try{
                console.log("⚡ EXECUTING WORKFLOW");

                await executeWorkflow(
                    nodes,
                    edges,
                    userInput,
                    messages,
                    channel,
                    workflowRunId,
                )
                console.log("⚡ WORKFLOW EXECUTION COMPLETED");
            } catch (error){
                console.error("Workflow execution error:", error);
                throw error
            }   
        })
    },
    {
        qstashClient: new Client({
            token: process.env.QSTASH_TOKEN!,
            // headers: {
            //     "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS_TOKEN!
            // }
        })
    }
)

// export async function POST(req: Request) {
//     const { workflowId, messages } = await req.json()

//     const workflowRunId = crypto.randomUUID()
//     const channel = realtime.channel(workflowRunId)

//     const message = messages[messages.length - 1]
//     const userInput =
//       message.role === "user" && message.parts[0].type === "text"
//         ? message.parts[0].text
//         : ""

//     const workflowData = await prisma.workflow.findUnique({
//         where: { id: workflowId }
//     })

//     if (!workflowData) throw new Error("Workflow not found")

//     const obj = JSON.parse(workflowData.flowObject)

//     await executeWorkflow(
//         obj.nodes,
//         obj.edges,
//         userInput,
//         messages,
//         channel,
//         workflowRunId
//     )

//     return Response.json({ workflowRunId })
// }