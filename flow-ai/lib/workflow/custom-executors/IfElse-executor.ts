import { replaceVariables } from "@/lib/helper";
import { ExecutorContextType } from "@/types/workflow";
import { Node } from "@xyflow/react";
import { Parser } from "expr-eval"

type Condition = {
    caseName?: string;
    variable?: string;
    operator?: string;
    value?: string;
}

export async function executeIfElseNode(
    node: Node,
    context: ExecutorContextType
){
    const {outputs} = context;
    const conditions = (node.data.conditions as Condition[]) || []

    if(!Array.isArray(conditions)){
        throw new Error("conditions must be an array")
    }

    for(let i=0; i<conditions.length; i++){
        const condition = conditions[i];
        if(!condition.variable || !condition.operator || condition.value === undefined) continue

        const variable = replaceVariables(condition.variable, outputs).trim()

        const value = condition.value.trim()

        const variableExpr = needQuoting(variable) ? JSON.stringify(variable) : variable
        const valueExpr = needQuoting(value) ? JSON.stringify(value) : value
        const operator = normalizeOperator(condition.operator)
        const expr = `${variableExpr} ${operator} ${valueExpr}`

        console.log("Variable:", variable)
        console.log("Value:", value)
        console.log("Expression:", expr)
        console.log("Operator:", condition.operator)

        
        try{
            const parser = new Parser()
            const result = parser.evaluate(expr)
            if(result){
                return {
                    output: {
                        result: true,
                        selectedBranch: `condition-${i}`
                    }
                }
            }
        } catch(error) {
            console.log('condition evaluation error: ', error)
            throw new Error("Error evaluating condition")
        }
    }

    return {
        output: {
            result: false,
            selectedBranch: "else",
        }
    }

}

function needQuoting(val: string){
    return isNaN(Number(val)) && !/^["'].*["']$/.test(val)
}

function normalizeOperator(op: string) {
  if (op === "=") return "=="
  if (op === "===") return "=="
  return op
}