"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReactFlow } from "@xyflow/react";
import { Plus, Trash2Icon } from "lucide-react";
import { useState } from "react";
import MentionInput from "../../mention-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PropsType = {
  id: string;
  data: any;
};

type Condition = {
  caseName?: string;
  variable?: string;
  operator?: string;
  value?: string;
};

const OPERATORS = [
  { label: "Equals", value: "==" },
  { label: "Not Equals", value: "!=" },
  { label: "Greater Than", value: ">" },
  { label: "Less Than", value: "<" },
];

const IfElseSettings = ({ id, data }: PropsType) => {
  const { updateNodeData } = useReactFlow();
  const conditions = data.conditions as Condition[];

  const handleAddCondition = () => {
    updateNodeData(id, {
      conditions: [
        ...conditions,
        {
          caseName: "",
          variable: "",
          operator: "",
          value: "",
        },
      ],
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      const updateConditions = conditions.filter((_, i) => i != index);
      updateNodeData(id, {
        conditions: updateConditions,
      });
    }
  };

  const handleUpdateCondition = (
    index: number,
    field: keyof Condition,
    value: string,
  ) => {
    const updateConditions = [...conditions];
    updateConditions[index] = {
      ...updateConditions[index],
      [field]: value,
    };

    updateNodeData(id, {
      conditions: updateConditions,
    });
  };

  const getConditionLabel = (index: number) => {
    if (index === 0) return "if";
    return "Else If";
  };
  return (
    <div>
      <div className="space-y-2">
        {conditions?.map((condition, index) => {
          return (
            <div
              key={`condition-setting-${index}`}
              className="space-y-2 pb-2.5 border-b last:border-b-0"
            >
              <div className="flex items-center justify-between ">
                <h4 className="text-sm font-medium">
                  {getConditionLabel(index)}
                </h4>

                {conditions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRemoveCondition(index)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  value={condition.caseName || ""}
                  placeholder="Case name (optional)"
                  className="bg-muted/50"
                  onChange={(e) => {
                    handleUpdateCondition(index, "caseName", e.target.value);
                  }}
                />
                <div className="flex gap-2">
                  <MentionInput
                    nodeId={id}
                    value={condition.variable || ""}
                    placeholder="{{agent.output}}"
                    multiline={false}
                    onChange={(value) => {
                      handleUpdateCondition(index, "variable", value);
                    }}
                    classname="bg-muted/50 text-xs w-full max-w-40"
                  />
                  <Select
                  value={condition.operator || ""} 
                  onValueChange={(value) => {
                    handleUpdateCondition(index, 'operator', value)
                  }}
                  >
                    <SelectTrigger className="w-28 text-lg">
                        <SelectValue>{condition.operator || ""}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {OPERATORS?.map((operator) => (
                            <SelectItem key={operator.value}
                            value={operator.value}
                            >
                                {operator.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={condition.value || ""}
                    onChange={(e) => 
                        handleUpdateCondition(index, 'value', e.target.value)
                    }
                    placeholder="Value"
                    className="bg-muted/50 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Button
      variant="outline" 
      size='sm'
      onClick={handleAddCondition}
      >
        <Plus className="size-4" /> 
        Add
      </Button>
    </div>
  );
};

export default IfElseSettings;
