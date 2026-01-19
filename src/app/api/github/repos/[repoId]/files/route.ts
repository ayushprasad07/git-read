import { dbConnect } from "@/lib/dbConnect";
import { getInstallationAccessToken } from "@/lib/githubApp";
import GithubRepo from "@/model/GithubRepo";
import { Octokit } from "@octokit/rest";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { repoRateLimiter } from "@/lib/reatLimit";
import mongoose from "mongoose";

export async function GET(req : Request,{params} : {params : Promise<{repoId : string}>}){

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

        const repoid = new mongoose.Types.ObjectId(repoId);

        const repo = await GithubRepo.findById(repoid).populate("installation");

        if(!repo || !repo.installation){
            return Response.json({
                success : false,
                message: "Repo not found"
            },{
                status : 404
            })
        }

        const installation = repo.installation?.installationId;

        if(!installation){
            return Response.json({
                success : false,
                message: "Installation not found"
            },{
                status : 404
            })
        }

        const token = await getInstallationAccessToken(installation);

        if(!token){
            return Response.json({
                success : false,
                message: "Failed to authenticate with github"
            },{
                status : 404
            })
        }

        const octokit = new Octokit({
            auth : token
        });

        if(!repo.fullName || !repo.fullName.includes("/")){
            return Response.json({
                success : false,
                message: "Invalid repo data"
            },{
                status : 404
            })
        }

        const {data : repoData} = await octokit.request(
            "GET /repos/{owner}/{repo}",
            {
                owner : repo.fullName.split("/")[0],
                repo : repo.fullName.split("/")[1]
            }
        );
          
        // console.log(repoData);

        const {data : treeData} = await octokit.request(
            "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
            {
                owner : repo.fullName.split("/")[0],
                repo : repo.fullName.split("/")[1],
                tree_sha : repoData.default_branch,
                recursive :  "true"
            }
        );

        // console.log(treeData);
        console.log("This is teh private key : ", process.env.GITHUB_APP_PRIVATE_KEY)
        return Response.json({
            repository: {
                name: repoData.name,
                fullName: repoData.full_name,
                defaultBranch: repoData.default_branch,
                private: repoData.private,
            },
            files: treeData.tree.map((item) => ({
                path: item.path,
                type: item.type,
            })),
        },{
            status : 200
        });

    } catch (error) {
        console.log("Error", error);
        return Response.json({
            success : false,
            message: "Internal Server Error"
        },{
            status : 500
        })
    }
}