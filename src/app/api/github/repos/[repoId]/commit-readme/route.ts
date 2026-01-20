import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { getInstallationAccessToken } from "@/lib/githubApp";
import { repoRateLimiter } from "@/lib/reatLimit";
import GithubRepo from "@/model/GithubRepo";
import { Octokit } from "@octokit/rest";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";



export async function POST(req : Request,
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

    const repoid = new mongoose.Types.ObjectId(repoId);

    const ip =
        req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        "unknown";

    const rateLimitKey = `repo:${repoid}:user:${session.user?.email}:ip:${ip}`;

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

        const {readmeContent , commitMessage} = await req.json();
        
        if(!readmeContent || !commitMessage){
            return Response.json({
                success : false,
                message: "Bad Request"
            },{
                status : 400
            })
        }

        if(commitMessage.length > 100){
            return Response.json({
                success : false,
                message: "Commit message too long"
            },{
                status : 400
            })
        }

        const repo = await GithubRepo.findById(repoid).populate("installation");

        const installationId = repo?.installation?.installationId;

        const token = await getInstallationAccessToken(
            installationId!
        );

        if(!token){
            return Response.json({
                success : false,
                message: "Unauthorized"
            },{
                status : 401
            })
        }

        const octokit = new Octokit({
            auth : token
        });

        let sha : string | undefined;

        try {
            const {data} = await octokit.request(
                "GET /repos/{owner}/{repo}/contents/{path}",
                {
                    owner : repo.fullName.split("/")[0],
                    repo: repo.fullName.split("/")[1],
                    path: "README.md",
                }
            )
    
            //@ts-ignore
            sha = data.sha;
        } catch (error) {
            // console.log("fetching error : ",error);
        }

        const {data} = await octokit.request(
            "PUT /repos/{owner}/{repo}/contents/{path}",
            {
                owner : repo.fullName.split("/")[0],
                repo: repo.fullName.split("/")[1],
                path: "README.md",
                message: commitMessage || "chore: auto-generate README",
                content: Buffer.from(readmeContent).toString("base64"),
                sha, // undefined = create, defined = update
            }
        )

        return Response.json({
            success : true,
            message: "README committed successfully",
        },{
            status : 200
        })

    } catch (error) {
        // console.log("Error internal", error);
        return Response.json({
            success : false,
            message: "Internal Server Error"
        },{
            status : 500
        })
    }
}