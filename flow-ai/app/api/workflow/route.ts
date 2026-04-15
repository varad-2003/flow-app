import prisma from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { error } from "console";
import { NextResponse } from "next/server";
import { success } from "zod"; 

export async function GET() {
    try{
        const session = await getKindeServerSession();
        const user = await session.getUser()
        if(!user) throw new Error("Unauthorized")

        const workflows = await prisma.workflow.findMany({
            where: {userId: user.id},
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
            },
            orderBy:{
                createdAt: "desc"
            },
        })
        return NextResponse.json({
            success: true,
            data: workflows
        })
    } catch(error){
        console.error(error)
        return NextResponse.json({
            error: "Failed to fetch workflow"
        },{
            status: 500,
        }
    )
    }
}

export async function POST(req: Request){
    try{
        const { name, description } = await req.json();
        const session = await getKindeServerSession()
        const user = await session.getUser();

        if(!user) throw new Error("Unauthorized");
        if(!name) throw new Error("Name feild required")

        const userId = user.id

        const workflow = await prisma.workflow.create({
            data: {
                userId,
                name,
                description: description || "",
                //flowObject
            },
        })
        return NextResponse.json({
            success: true,
            data: workflow,
        })
    } catch (error){
        console.error(error)
        return NextResponse.json({
            error: "Failed to create workflow"
        },{
            status: 500,
        }
    )
    }
}