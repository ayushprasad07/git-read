import crypto from "crypto";
import { headers } from "next/headers";
import User from "@/model/User";
import GithubInstallation from "@/model/GithubInstallation";
import GithubRepo from "@/model/GithubRepo";
import { dbConnect } from "@/lib/dbConnect";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("x-hub-signature-256");

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    console.log(payload);
  
    if (payload.action !== "created" || !payload.installation) {
      return new Response("Ignored", { status: 200 });
    }
  
    await dbConnect();
  
    const installation = payload.installation;
    const repos = payload.repositories || [];
  
    const githubLogin = installation.account.login;
  
    const user = await User.findOne({
      githubUsername: githubLogin,
    });
  
    if (!user) {
      console.error("No user found for GitHub login:", githubLogin);
      return new Response("User not found", { status: 404 });
    }
  
    const savedInstallation = await GithubInstallation.findOneAndUpdate(
      { installationId: installation.id },
      {
        installationId: installation.id,
        githubAccountId: installation.account.id,
        githubAccountLogin: installation.account.login,
        githubAccountType: installation.account.type,
        user: user._id,
      },
      { upsert: true, new: true }
    );
  
    for (const repo of repos) {
      await GithubRepo.findOneAndUpdate(
        { githubRepoId: repo.id },
        {
          githubRepoId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          defaultBranch: repo.default_branch,
          installation: savedInstallation._id,
        },
        { upsert: true }
      );
    }
  
    console.log("GitHub App installation saved:", installation.id);
  
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.log("Error Occure : ",error)
    return Response.json({
        success : false,
        message : "Server Error"
    },{
        status : 500
    })
  }
}
