import { workflow } from "@/lib/generated/prisma/client";
import { useWorkflowStore } from "@/store/workflow-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edge, Node } from "@xyflow/react";
import axios from "axios";
import { log } from "console";
import { useRouter } from "next/navigation"
import { toast } from "sonner";

type CreateWorkflowPayload = {
    name: string;
    description?: string;
}

type WorkflowType = {
    id: string;
    name: string;
    flowObject: any;
}

export const useGetworkflows = () =>{
    return useQuery({
        queryKey: ["workflows"],
        queryFn: async () => {
            return await axios.get<{ data: workflow[]}>("/api/workflow")
            .then((res) => res.data.data)
        }
    })
}

export const useCreateWorkflow = () => {
    const router = useRouter();

    return useMutation({
        mutationFn: async ({ name, description }: CreateWorkflowPayload ) => axios.post("/api/workflow", {
            name, 
            description,
        })
        .then((res) => res.data),
        onSuccess: (data) => {
            toast.success("workflow created successfully")
            router.push(`/workflow/${data.data.id}`)
        },
        onError:(error) => {
            console.log(error);
            toast.error("Failed to create workflow")
        }
    })
}

export const useGetworkflowById = (workflowId: string) =>{
    const { setSavedState } = useWorkflowStore();

    return useQuery({
        queryKey: ["workflow", workflowId],
        queryFn: async () => {
            return await axios.get<{ data: WorkflowType}>(`/api/workflow/${workflowId}`)
            .then((res) => {
                const result = res.data.data;
                setSavedState(result.flowObject.nodes, result.flowObject.edges)
                return result
            })
        },
        enabled: !!workflowId,
    })

}

export const useUpdateWorkflow = (workflowId: string) => {
    const { setSavedState } = useWorkflowStore();
    return useMutation({
        mutationFn: async(data: { nodes: Node[]; edges: Edge[] }) => axios
                    .put(`/api/workflow/${workflowId}`, data)
                    .then((res) => res.data),
                onSuccess: (data) => {
                    const result = data.data
                    setSavedState(result.flowObject.nodes, result.flowObject.edges)
                    toast.success("Workflow updated successfully")
                },
                onError: (error) => {
                    console.log("update workflow failed", error);
                    toast.error("Failed to update workflow")  
                }    
    })
}