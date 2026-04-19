// import { DefaultChatTransport } from "ai"

// export const createWorkflowTransport = ({ workflowId }: {workflowId: string}) => {
//     return new DefaultChatTransport({
//         api: `/api/upstash/trigger`,
//         async prepareSendMessagesRequest({ messages }){
//             return {
//                 body: {
//                     workflowId,
//                     messages,
//                 }
//             }
//         },
//         prepareReconnectToStreamRequest: (data) => {
//             return {
//                 ...data,
//                 headers: {
//                     ...data.headers,
//                     "x-is-reconnect": "true"
//                 }
//             }
//         },
//         fetch: async (input, init) => {
//             const triggerRes = await fetch(input, init);
//             const data = await triggerRes.json()
//             const workflowRunId = data.workflowRunId
//             console.log("Frontend ID:", workflowRunId);
            
//             if (!workflowRunId) {
//         throw new Error("No workflowRunId received");
//       }

//             return fetch(`/api/workflow/chat?id=${workflowRunId}`, {
//                 method: "GET",
//                 headers: {
//                     "Accept": "text/event-stream",
//                 }
//             })
//         }
//     })
// }

import { DefaultChatTransport } from "ai"

export const createWorkflowTransport = ({ workflowId }: {workflowId: string}) => {
    return new DefaultChatTransport({
        api: `/api/upstash/trigger`,
        async prepareSendMessagesRequest({ messages }){
            return {
                body: {
                    workflowId,
                    messages,
                }
            }
        },
        prepareReconnectToStreamRequest: (data) => {
            return {
                ...data,
                headers: {
                    ...data.headers,
                    "x-is-reconnect": "true"
                }
            }
        },
        fetch: async (input, init) => {
            // 1. Pehle UUID generate karo
            const workflowRunId = crypto.randomUUID()
            console.log("🆔 Generated ID:", workflowRunId)

            // 2. SSE PEHLE connect karo same ID se
            const ssePromise = fetch(`/api/workflow/chat?id=${workflowRunId}`, {
                method: "GET",
                headers: {
                    "Accept": "text/event-stream",
                }
            })

            // 3. 300ms wait - SSE establish hone do
            await new Promise(res => setTimeout(res, 300))

            // 4. Trigger karo - same workflowRunId backend ko bhejo
            const body = JSON.parse(init?.body as string)
            console.log("📤 Sending workflowRunId:", workflowRunId)
            await fetch(input, {
                ...init,
                body: JSON.stringify({
                    ...body,
                    workflowRunId,
                })
            })

            // 5. SSE stream return karo
            return ssePromise
        }
    })
}