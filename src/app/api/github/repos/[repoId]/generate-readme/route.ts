import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import generateReadme from "@/lib/ai";
import { dbConnect } from "@/lib/dbConnect";
import { buildReadmePrompt } from "@/lib/readmePrompt";
import { repoRateLimiter } from "@/lib/reatLimit";
import { analyseRepo } from "@/lib/repoAnalyzer";
import GithubRepo from "@/model/GithubRepo";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";


export async function POST(req:Request,
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
        
        const {file, extractedFile} = await req.json();

        if(!file || !extractedFile){
            return Response.json({
                success : false,
                message : "Files not found"
            },{
                status : 400
            })
        }   

        const repoid = new  mongoose.Types.ObjectId(repoId);

        if (!mongoose.Types.ObjectId.isValid(repoId)) {
            return new Response("Invalid repo id", { status: 400 });
        }


        const repo = await GithubRepo.findById(repoid);
        
        if(!repo){
            return Response.json({
                success : false,
                message : "Repo not found"
            },{
                status : 400
            })
        }

        const analysis = await analyseRepo(file);

        const readmePrompt = await buildReadmePrompt(
            repo.fullName.split("/")[1],
            analysis,
            extractedFile
        );

        const readme = await generateReadme(readmePrompt);

        return Response.json({
            success : false,
            readme
        },{
            status : 200
        })
        
    } catch (error) {
        console.log("Internal Server error : ",error)
        return Response.json({
            success : false,
            message : "Internal Server error"
        },{
            status : 500
        })
    }
}