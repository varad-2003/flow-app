import { NodeProps, Position } from '@xyflow/react'
import React from 'react'
import WorkflowNode from '../../workflow-node'
import { GitBranch, PlayIcon } from 'lucide-react'
import { BaseHandle } from '../../react-flow/base-handle'
import IfElseSettings from './setting'

type Condition = {
    caseName?: string;
    variable?: string;
    operator?: string;
    value?: string;
}


const IfElseNode = (props:NodeProps) => {
    const {id, data, selected} = props
    const conditions= data.conditions as Condition[]
    const bgColor = data?.color as string

    const conditionStyle = `relative flex items-center justify-end p-2 rounded-md bg-muted/30 border border-dashed border-border text-[11px] font-medium text-muted-foreground whitespace-nowrap`
  return (
    <>
        <WorkflowNode
        nodeId={id}
        label='If/Else'
        subText='Condition'
        icon={GitBranch}
        selected={selected}
        handles={{
            target: true,
            source: false,
        }}
        color={bgColor}
        settingTitle='If / Else'
        settingDescription='Create conditions to branch your workflow'
        settingComponent = {<IfElseSettings id={id}
        data={data}
        />}

        >
            {conditions?.map((condition, index) =>{
                const condition_merge = `${condition.variable} ${condition.operator} ${condition.value}`
                return(
                    <div key={`condition-${index}`} className='relative'>
                        <div className={conditionStyle}>
                            <p className='whitespace-nowrap overflow-hidden truncate max-w-62.5'>
                                {
                                    condition.caseName || condition_merge || `Condition ${index + 1}`
                                }
                            </p>
                        </div>
                        <BaseHandle
                        type="source"
                        position={Position.Right}
                        id={`condition-${index}`}
                        className='size-2! -right-1.25'
                        />
                    </div>
                )
            })}

            <div className='relative'>
                <div className={conditionStyle}>Else</div>
                <BaseHandle
                        type="source"
                        position={Position.Right}
                        id='Else'
                        className='size-2! -right-1.25'
                        />
            </div>
        </WorkflowNode>
    </>
  )
}

export default IfElseNode