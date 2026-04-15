"use client"

import { Position, useReactFlow } from "@xyflow/react";
import { LucideIcon, Settings, Trash2Icon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { NodeStatusIndicator } from "./react-flow/node-status-indicator";
import { BaseNode, BaseNodeContent, BaseNodeHeader, BaseNodeHeaderTitle } from "./react-flow/base-node";
import { cn } from "@/lib/utils";
import { error } from "console";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";
import { BaseHandle } from "./react-flow/base-handle";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

type WorkflowNodeProps = {
    nodeId: string;
    label: string;
    subText: string;
    icon: LucideIcon
    handles: { target: boolean; source: boolean}
    isDeletable?: boolean;
    selected: boolean;
    color?: string;
    status?: "initial" | "loading" | "error" | "success"
    className?: string;
    children?: React.ReactNode;
    //
    settingComponent?: React.ReactNode;
    settingTitle?: string;
    settingDescription?: string;
}

const WorkflowNode = ({
    nodeId,
    label,
    subText,
    isDeletable = true,
    icon: Icon,
    handles,
    selected,
    color = 'bg-gray-500',
    status = 'initial',
    className,
    children,
    settingComponent,
    settingTitle,
    settingDescription,
} : WorkflowNodeProps) => {
    const [settingOpen, setSettingOpen] = useState<boolean>(false)

    const { deleteElements } = useReactFlow()

    const onDelete = () => {
        if(!isDeletable){
            toast.error("cannot delete this node")
            return;
        }
        deleteElements({
            nodes: [
                {
                    id: nodeId,
                }
            ]
        })
    }
  return (
    <>
        <div className="relative">
            <NodeStatusIndicator status={status} variant="border">
                <BaseNode className={cn(
                    "min-w-36 w-fit cursor-pointer", className
                )} onDoubleClick={(e) => {
                    if(!settingComponent) return
                    e.stopPropagation();
                    setSettingOpen(true)
                }} >
                    <BaseNodeHeader className="flex items-start px-2 pt-3 pb-3.5">
                        <div className="flex items-center gap-2">
                            <div className={cn("*:rounded-sm! size-7 flex items-center justify-center", color)}>
                                <Icon className="size-3.5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <BaseNodeHeaderTitle className="text-sm! pr-2 font-medium! ">
                                {label}</BaseNodeHeaderTitle>
                                {subText && (
                                    <p className="text-[11px] text-muted-foreground -mt-0.5 truncate max-w-20">
                                        {subText}
                                    </p>
                                )}
                            </div>
                        </div>

                        { selected && <ButtonGroup className="flex items-center -mt-px">
                            {settingComponent && (
                                <Button
                                variant="ghost"
                                size="icon-sm" 
                                className="size-6! hover:bg-accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSettingOpen(true);
                                }}
                                >
                                    <Settings className="size-3" />
                                </Button>
                            )}

                            {isDeletable && (
                                <Button
                                variant="ghost"
                                size="icon-sm" 
                                className="size-6! hover:bg-destructive/10 hover:text-destructive -ml-px"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete();
                                }}
                                >
                                    <Trash2Icon className="size-3" />
                                </Button>
                            )}
                            </ButtonGroup>}
                    </BaseNodeHeader>
                    {
                        children && (
                            <BaseNodeContent>
                            {children}
                            </BaseNodeContent>
                        )
                    }
                    {handles.target && (<BaseHandle 
                    id="target-1"
                    type="target"
                    className="size-2!"
                    position={Position.Left}
                    />)}

                    {handles.source && (<BaseHandle 
                    id="source-1"
                    type="source"
                    className="size-2!"
                    position={Position.Right}
                    />)}
                </BaseNode>
            </NodeStatusIndicator>
        </div>
        {settingComponent && (
            <Dialog
            open={settingOpen}
            onOpenChange={setSettingOpen}
            >
                <DialogContent 
                className="max-w-md! px-0 pb-2"
                overlayClass="bg-black/10! backdrop-blur-none!" 
                >
                    <DialogHeader className="px-4">
                        <DialogTitle>
                            {settingTitle || `${label} settings`}
                        </DialogTitle>
                        {settingDescription && (
                            <DialogDescription>
                                { settingDescription}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="px-4 space-y-4 h-full max-h-[65vh] overflow-y-auto">
                        {settingComponent}
                    </div>
                    <DialogFooter className="px-4 border-t pt-2">
                        <Button 
                        variant="secondary"
                        className="w-full"
                        onClick={() => setSettingOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </>
  )
}

export default WorkflowNode