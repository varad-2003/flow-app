import { Client } from "@upstash/workflow";
import { NextResponse } from "next/server";
import { success } from "zod";

const client = new Client({
  baseUrl: process.env.QSTASH_BASE_URL!,
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
        return NextResponse.json({
        success:false,
        error: "Failed to trigger workflow",
    }, { status: 500 })
  }
}

// import { Client } from "@upstash/qstash";
// import { NextResponse } from "next/server";

// const client = new Client({
//   token: process.env.QSTASH_TOKEN!,
// });
// const BASE_URL = process.env.NEXT_PUBLIC_APP_URL
// console.log("BASE_URL:", process.env.NEXT_PUBLIC_APP_URL);

// export async function POST(request: Request) {
//   console.log("🔥 TRIGGER API HIT");
//   const { workflowId, messages, workflowRunId } = await request.json();

//   try {
//     // const workflowRunId = crypto.randomUUID();

//     console.log("➡️ Sending to QStash...");
    

//     await client.publishJSON({
//       url: `${BASE_URL}/api/workflow/chat`,
//       retries: 2,
//       body: {
//         workflowId,
//         messages,
//         workflowRunId,
//       },
//     });

//     console.log("SENT TO QSTASH SUCCESS");
//     console.log("🔥 TRIGGER RESPONSE ID:", workflowRunId);

//     return NextResponse.json({
//       success: true,
//       workflowRunId,
//     });
//   } catch (error) {
//     console.error("❌ QStash publish error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to trigger workflow",
//       },
//       { status: 500 }
//     );
//   }
// }