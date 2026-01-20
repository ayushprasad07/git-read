// //app/api/github/repos/[repoId]/auto-sync/route.ts

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { repoRateLimiter } from "@/lib/reatLimit";
import GithubInstallation from "@/model/GithubInstallation";
import GithubRepo from "@/model/GithubRepo";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";


export async function PATCH(req : Request,
    {params} : {params : Promise<{repoId : string}>}

){
    const session = await getServerSession(authOptions);

    if(!session){
        return Response.json({
            success : false,
            message: "Unauthorized"
        },{
            status : 401
        })
    }

    const { repoId } = await params;

    if(!mongoose.Types.ObjectId.isValid(repoId)){
        return Response.json({
            success : false,
        message: "Bad Request"
        },{
            status : 400
        })
    }

    const ip =
        req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        "unknown";

    const rateLimitKey = `repo:${repoId}:user:${session.user?.email}:ip:${ip}`;

    const { success, remaining, reset } =
        await repoRateLimiter.limit(rateLimitKey);

    if (!success) {
        return new Response(
        JSON.stringify({
            success: false,
            message: "Too many requests. Please slow down.",
        }),
        {
            status: 429,
            headers: {
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            },
        }
        );
    }

    try {
        await dbConnect();

        const body = await req.json();
        const { autoSync } = body;

        if(typeof autoSync !== "boolean"){
            return Response.json({
                success : false,
                message: "Bad Request"
            },{
                status : 400
            })
        }

        const repoid = new mongoose.Types.ObjectId(repoId);

        const repo = await GithubRepo.findById(repoid).populate("installation");

        if(!repo){
            return Response.json({
                success : false,
                message: "Repo not found"
            },{
                status : 404
            })
        }

        const installation = repo.installation;

        const userInstallation = await GithubInstallation.findOne({
            installationId : installation.installationId
        }).populate("user");

        if(!userInstallation || userInstallation.user.email !== session.user?.email){
            return Response.json({
                success : false,
                message: "Unauthorized"
            },{
                status : 401
            })
        }

        repo.autoSync = autoSync;

        await repo.save();

        return Response.json({
            success : true,
            message: "Repo updated successfully"
        },{
            status : 200
        })
    } catch (error) {
        // console.log(error);
        return Response.json({
            success : false,
            message: "Internal Server Error"
        },{
            status : 500
        })
    }
}