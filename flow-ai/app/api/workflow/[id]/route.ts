import prisma from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Edge, Node } from "@xyflow/react";
import { error } from "console";
import { NextResponse } from "next/server";
import { success } from "zod";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getKindeServerSession();
    const user = await session.getUser();
    if (!user) throw new Error("Unautherized");

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        {
          error: "Workflow not found",
        },
        { status: 404 },
      );
    }
    const flowObject = JSON.parse(workflow.flowObject);
    return NextResponse.json({
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        flowObject: flowObject,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to fetch workflow",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const{ nodes, edges } = (await req.json()) as {
        nodes: Node[];
        edges: Edge[];
    }
    const session = await getKindeServerSession();
    const user = await session.getUser();
    if (!user) throw new Error("Unautherized");

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        {
          error: "Workflow not found",
        },
        { status: 404 },
      );
    }

    const updateWorkFlow =  await prisma.workflow.update({
        where: { id },
        data: {
            flowObject: JSON.stringify({ nodes, edges })
        }
    })
    return NextResponse.json({
        success: true,
        data: {
            id: updateWorkFlow.id,
            name: updateWorkFlow.name,
            flowObject: JSON.parse(updateWorkFlow.flowObject)
        },
    })

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to fetch workflow",
      },
      {
        status: 500,
      },
    );
  }
}
