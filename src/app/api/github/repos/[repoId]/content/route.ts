import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { getInstallationAccessToken } from "@/lib/githubApp";
import { repoRateLimiter } from "@/lib/reatLimit";
import GithubRepo from "@/model/GithubRepo";
import { Octokit } from "@octokit/rest";
import { getServerSession } from "next-auth";

const IMPORTANT_FILES = [
  "readme.md",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "pom.xml",
  "build.gradle",
  "src/index.js",
  "src/index.ts",
  "src/app.js",
  "src/app.ts",
  "app.py",
  "main.py",
];

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


        const repo = await GithubRepo.findById(repoId).populate("installation");

        if(!repo || !repo.installation){
            return Response.json({
                success : false,
                message: "Repo not found"
            },{
                status : 404
            })
        }

        const installlationId = repo?.installation?.installationId;

        if(!installlationId){
            return Response.json({
                success : false,
                message: "Repo not found"
            },{
                status : 404
            })
        }

        const token = getInstallationAccessToken(installlationId!);

        if(!token){
            return Response.json({
                success : false,
                message: "Unnauthenticated request"
            },{
                status : 404
            })
        }

        const octokit = new Octokit({
            auth : token
        });

        const extractedFile : Record<string,string> = {};

        for (const file of IMPORTANT_FILES) {
            try {
                const {data} = await octokit.request(
                    "GET /repos/{owner}/{repo}/contents/{path}",
                    {
                        owner : repo.fullName.split("/")[0],
                        repo : repo.fullName.split("/")[1],
                        path : file,
                    }
                );
                //@ts-ignore
                if(data?.content){
                    //@ts-ignore
                    const decode = Buffer.from(data.content, 'base64').toString('utf-8');
                    extractedFile[file] = decode;
                }
            } catch (error) {
                console.log("Error in getting file:", error);
                return Response.json({
                    success : false,
                    message: "Fetching error"
                },{
                    status : 400
                })
            }
        }

        return Response.json({
            success : true,
            repoName : repo.fullName,
            data : extractedFile
        },{
            status : 200
        })
    } catch (error) {
        console.log("Internal Server error  :", error);
        return Response.json({
            success : false,
            message: "Internal Server error"
        },{
            status : 500
        })
    }
}