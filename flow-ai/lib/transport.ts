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
            const triggerRes = await fetch(input, init);
            const data = await triggerRes.json()
            const workflowRunId = data.workflowRunId
            console.log("Frontend ID:", workflowRunId);
            
            if (!workflowRunId) {
        throw new Error("No workflowRunId received");
      }

            return fetch(`/api/workflow/chat?id=${workflowRunId}`, {
                method: "GET",
                headers: {
                    "Accept": "text/event-stream",
                }
            })
        }
    })
}