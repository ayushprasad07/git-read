// import { authOptions } from "@/app/api/auth/[...nextauth]/options";
// import { dbConnect } from "@/lib/dbConnect";
// import { getInstallationAccessToken } from "@/lib/githubApp";
// import { repoRateLimiter } from "@/lib/reatLimit";
// import GithubRepo from "@/model/GithubRepo";
// import { Octokit } from "@octokit/rest";
// import mongoose from "mongoose";
// import { getServerSession } from "next-auth";

// const IMPORTANT_FILES = [
//   "README.md",
//   "package.json",
//   "pyproject.toml",
//   "requirements.txt",
//   "pom.xml",
//   "build.gradle",
//   "src/index.js",
//   "src/index.ts",
//   "src/app.js",
//   "src/app.ts",
//   "app.py",
//   "main.py",
// ];

// export async function GET(req : Request,{params} : {params : Promise<{repoId : string}>}){

//     const session = await getServerSession(authOptions);

//     if(!session){
//         return Response.json({
//             success : false,
//             message: "Unauthorized"
//         },{
//             status : 401
//         })
//     }

//     const { repoId } = await params;

//     if(!mongoose.Types.ObjectId.isValid(repoId)){
//         return Response.json({
//             success : false,
//             message: "Bad Request"
//         },{
//             status : 400
//         })
//     }

//     const repoid = new mongoose.Types.ObjectId(repoId);

//     const ip =
//         req.headers.get("x-forwarded-for") ??
//         req.headers.get("x-real-ip") ??
//         "unknown";

//     const rateLimitKey = `repo:${repoId}:user:${session.user?.email}:ip:${ip}`;

//     const { success, remaining, reset } =
//         await repoRateLimiter.limit(rateLimitKey);

//     if (!success) {
//         return new Response(
//         JSON.stringify({
//             success: false,
//             message: "Too many requests. Please slow down.",
//         }),
//         {
//             status: 429,
//             headers: {
//             "X-RateLimit-Remaining": remaining.toString(),
//             "X-RateLimit-Reset": reset.toString(),
//             },
//         }
//         );
//     }


//     try {
//         await dbConnect();


//         const repo = await GithubRepo.findById(repoid).populate("installation");

//         if(!repo || !repo.installation){
//             return Response.json({
//                 success : false,
//                 message: "Repo not found"
//             },{
//                 status : 404
//             })
//         }

//         const installation = repo.installation?.installationId;

//         if(!installation){
//             return Response.json({
//                 success : false,
//                 message: "Repo not found"
//             },{
//                 status : 404
//             })
//         }

//         const token = await getInstallationAccessToken(installation);

//         if(!token){
//             return Response.json({
//                 success : false,
//                 message: "Unnauthenticated request"
//             },{
//                 status : 404
//             })
//         }

//         const octokit = new Octokit({
//             auth : token
//         });

//         const extractedFile : Record<string,string> = {};

//         for (const file of IMPORTANT_FILES) {
//             try {
//                 const {data} = await octokit.request(
//                     "GET /repos/{owner}/{repo}/contents/{path}",
//                     {
//                         owner : repo.fullName.split("/")[0],
//                         repo : repo.fullName.split("/")[1],
//                         path : file,
//                     }
//                 );
//                 //@ts-ignore
//                 if(data?.content){
//                     //@ts-ignore
//                     const decode = Buffer.from(data.content, 'base64').toString('utf-8');
//                     extractedFile[file] = decode;
//                 }
//             } catch (error) {
//                 // console.log("Error in getting file:", error);
//                 // return Response.json({
//                 //     success : false,
//                 //     message: "Fetching error"
//                 // },{
//                 //     status : 400
//                 // })
//                 continue;
//             }
//         }

//         console.log("This is teh private key : ", process.env.GITHUB_APP_PRIVATE_KEY)

//         return Response.json({
//             success : true,
//             repoName : repo.fullName,
//             content : extractedFile
//         },{
//             status : 200
//         })
//     } catch (error) {
//         console.log("Internal Server error  :", error);
//         return Response.json({
//             success : false,
//             message: "Internal Server error"
//         },{
//             status : 500
//         })
//     }
// }

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { getInstallationAccessToken } from "@/lib/githubApp";
import { repoRateLimiter } from "@/lib/reatLimit";
import GithubRepo from "@/model/GithubRepo";
import { Octokit } from "@octokit/rest";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

const IMPORTANT_FILES = [
  "README.md",
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { repoId } = await params;

  if (!mongoose.Types.ObjectId.isValid(repoId)) {
    return Response.json({ success: false, message: "Bad Request" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rateLimitKey = `repo:${repoId}:user:${session.user?.email}:ip:${ip}`;
  const { success, remaining, reset } = await repoRateLimiter.limit(rateLimitKey);

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

    if (!repo || !repo.installation) {
      return Response.json({ success: false, message: "Repo not found" }, { status: 404 });
    }

    if (!repo.fullName || !repo.fullName.includes("/")) {
      return Response.json(
        { success: false, message: "Invalid repo fullName" },
        { status: 400 }
      );
    }

    const installationId = repo.installation.installationId;
    const token = await getInstallationAccessToken(installationId);

    const octokit = new Octokit({ auth: token });
    const [owner, repoName] = repo.fullName.split("/");

    const extractedFiles: Record<string, string> = {};

    for (const file of IMPORTANT_FILES) {
      try {
        const { data }: any = await octokit.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          {
            owner,
            repo: repoName,
            path: file,
          }
        );

        if (data?.content) {
          extractedFiles[file] = Buffer.from(
            data.content,
            "base64"
          ).toString("utf-8");
        }
      } catch (error: any) {
        console.warn(
          `Failed to fetch ${file}:`,
          error?.status,
          error?.response?.data?.message
        );
        continue;
      }
    }

    return Response.json(
      {
        success: true,
        repoName: repo.fullName,
        content: extractedFiles,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CONTENT ROUTE ERROR:", error?.message, error?.status);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
