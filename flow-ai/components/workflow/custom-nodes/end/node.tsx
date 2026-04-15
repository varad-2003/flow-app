import { NodeProps } from '@xyflow/react'
import React from 'react'
import WorkflowNode from '../../workflow-node'
import { Square } from 'lucide-react'
import EndSettings from './setting'

const EndNode = ({data, selected, id}: NodeProps) => {
    const bgColor = data.color as string
  return (
    <>
        <WorkflowNode
        nodeId={id}
        label='End'
        subText=''
        icon={Square}
        className='min-w-fit'
        isDeletable={true}
        selected={selected}
        handles={{
            target: true,
            source: false,
        }}
        color={bgColor}
        settingTitle='End Node Settings'
        settingDescription='Choose the workflow output'
        settingComponent = {<EndSettings id={id} data={data}/>}
        />
    </>
  )
}

export default EndNode