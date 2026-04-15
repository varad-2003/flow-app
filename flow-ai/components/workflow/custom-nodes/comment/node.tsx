import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { NodeProps, useReactFlow } from '@xyflow/react'
import React, { useState } from 'react'

const CommentNode = ({data, id}: NodeProps) => {
    const { updateNodeData } = useReactFlow()
    const comment_str = data.comment as string
    const [comment, setComment] = useState(comment_str || "")

    const handleCommentChange = (value: string) =>{
        updateNodeData(id, { comment: value })
    }

  return (
    <div className={cn(
        `w-full h-full box-border p-1 border rounded-lg bg-amber-300 dark:bg-[#b08915]`
    )}
    style={{
        width: '155px',
        minHeight: '100px',
        maxHeight: '180px'
    }}
    >
        <Textarea 
            value={comment || ""}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => handleCommentChange(comment)}
            placeholder='Write a comment...'
            className='w-full h-full px-1! resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs! shadow-none overflow-auto max-h-37.5 min-h-20 dark:placeholder:text-amber-950 dark:text-black'
        />
    </div>
  )
}

export default CommentNode
