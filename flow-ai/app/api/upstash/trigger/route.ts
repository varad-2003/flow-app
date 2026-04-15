import { Client } from "@upstash/workflow";
import { NextResponse } from "next/server";
import { success } from "zod";

const client = new Client({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!,
});
const vercelUrl = process.env.VERCEL_URL
const BASE_URL = process.env.VERCEL_URL
  ? `https://${vercelUrl}`
  : `http://localhost:3000`;

export async function POST(request: Request) {
  const { workflowId, messages } = await request.json();
  try {
    const { workflowRunId } = await client.trigger({
      url: `${BASE_URL}/api/workflow/chat`,
      retries: 3,
      keepTriggerConfig: true,
      headers: {
        "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS_TOKEN!
      },
      
      body: {
        workflowId,
        messages
      }
    });

    return NextResponse.json({
        success:true,
        workflowRunId: workflowRunId
    })
  } catch (error) {
    console.error("Workflow trigger error:", error); 
        return NextResponse.json({
        success:false,
        error: "Failed to trigger workflow",
    }, { status: 500 })
  }
}
