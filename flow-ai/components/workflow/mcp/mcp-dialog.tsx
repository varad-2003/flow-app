"use client";
import { addMcpServer, connectMcpServer } from "@/app/actions/agent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { MCPToolType } from "@/lib/workflow/constant";
import { KeyRoundIcon, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MCPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    label: string;
    serverId: string;
    selectedTools: MCPToolType[];
  }) => void;
}

const McpDialog = ({ open, onOpenChange, onAdd }: MCPDialogProps) => {
  const [step, setStep] = useState<"connect" | "select">("connect");
  const [url, setUrl] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [tools, setTools] = useState<MCPToolType[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { tools } = await connectMcpServer({
        url,
        apiKey,
      });
      setTools(tools);
      setSelectedTools(new Set(tools.map((tool) => tool.name)));
      setStep("select");
    } catch (error) {
      console.log(error);
      toast.error("Failed to connect to Mcp Server");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMcp = async () => {
    setLoading(true);
    const selected = tools.filter((t) => selectedTools.has(t.name));
    try {
      const { serverId } = await addMcpServer({
        url,
        apiKey,
        label,
      });
      onAdd({
        label,
        serverId,
        selectedTools: selected,
      });
      onOpenChange(false);
      setStep("connect");
      setUrl("");
      setLabel("");
      setApiKey("");
      setTools([]);
      setSelectedTools(new Set());
      toast.success("Mcp server added successfully");
    } catch (error) {
      console.log("Failed to save mcp", error);
      toast.error("Failed to save Mcp server");
    } finally {
      setLoading(true);
    }
  };

  const toggleTool = (name: string) => {
    setSelectedTools((prev) => {
        const set = new Set(prev)
        if(set.has(name)) {
            set.delete(name)
        } else {
            set.add(name)
        }
        return set
    })
  }

  const authList = [
    {
      value: "token",
      label: "Access token / API key",
    },
  ];
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg" overlayClass="bg-black/60!">
          {step === "connect" ? (
            <div className="pb-8">
              <div className="flex flex-col items-center mb-6">
                <Server className="w-8 h-8 mb-2 text-muted-foreground" />
                <DialogTitle className="text-lg font-semibold">
                  Connect to MCP Server
                </DialogTitle>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>URL</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="mcp-url"
                      placeholder="https://exapmle.com/mcp"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </InputGroup>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Only use MCP server you trust and verify
                  </p>
                </div>

                <div>
                  <Label>Label</Label>
                  <InputGroup>
                    <InputGroupInput
                      placeholder="my_mcp_server"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </InputGroup>
                </div>

                <div>
                  <Label>Authentication</Label>
                  <Select disabled value="token">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {authList.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <InputGroup>
                      <InputGroupAddon>
                      <KeyRoundIcon className="size-4"/>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="password"
                        placeholder="Add your api key/acccess token"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button
                    onClick={handleConnect}
                    disabled={!url || !label || !apiKey || loading}
                    className="w-32"
                    >
                        {loading && <Spinner />}
                        Connect
                    </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-1 mb-4">
                    <div className="flex items-center gap-2">
                        <Server className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="text-base font-semibold">
                            {label}
                        </span>
                    </div>
                        <p className="text-xs text-muted-foreground">
                            {url}
                        </p>
                </div>
                <div className="">
                    <h1 className="font-semibold text-sm mb-2">TOOLS</h1>
                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {tools.map((tool) => (
                            <div
                            key={tool.name}
                            className="flex items-center gap-3 p-2 border border-border rounded-sm"
                            >
                                <Checkbox
                                checked={selectedTools.has(tool.name)}
                                onCheckedChange={() => {toggleTool(tool.name)}}
                                />
                                <div className="flex-1">
                                    <h5 className="font-medium text-sm">{tool.name}</h5>
                                    <p className="text-xs text-muted-foreground line-clamp-1 truncate max-w-75">{tool.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <Button
                    variant="outline"
                    onClick={handleAddMcp}
                    className="flex-1"
                    >
                        {loading ? (
                            <Spinner />
                        ) : (
                            `Add (${selectedTools.size} selected)`
                        )}
                    </Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default McpDialog;
