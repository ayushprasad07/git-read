// //app/api/github/webhook/route.ts

// import crypto from "crypto";
// import { headers } from "next/headers";
// import User from "@/model/User";
// import GithubInstallation from "@/model/GithubInstallation";
// import GithubRepo from "@/model/GithubRepo";
// import { dbConnect } from "@/lib/dbConnect";

// export async function POST(req: Request) {
//   const body = await req.text();
//   const signature = (await headers()).get("x-hub-signature-256");

//   const expectedSignature =
//     "sha256=" +
//     crypto
//       .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!)
//       .update(body)
//       .digest("hex");

//   if (signature !== expectedSignature) {
//     return new Response("Invalid signature", { status: 401 });
//   }

//   try {
//     const payload = JSON.parse(body);
//     console.log(payload);
  
//     if (payload.action !== "created" || !payload.installation) {
//       return new Response("Ignored", { status: 200 });
//     }
  
//     await dbConnect();
  
//     const installation = payload.installation;
//     const repos = payload.repositories || [];
  
//     const githubLogin = installation.account.login;
  
//     const user = await User.findOne({
//       githubUsername: githubLogin,
//     });
  
//     if (!user) {
//       console.error("No user found for GitHub login:", githubLogin);
//       return new Response("User not found", { status: 404 });
//     }
  
//     const savedInstallation = await GithubInstallation.findOneAndUpdate(
//       { installationId: installation.id },
//       {
//         installationId: installation.id,
//         githubAccountId: installation.account.id,
//         githubAccountLogin: installation.account.login,
//         githubAccountType: installation.account.type,
//         user: user._id,
//       },
//       { upsert: true, new: true }
//     );
  
//     for (const repo of repos) {
//       await GithubRepo.findOneAndUpdate(
//         { githubRepoId: repo.id },
//         {
//           githubRepoId: repo.id,
//           name: repo.name,
//           fullName: repo.full_name,
//           private: repo.private,
//           defaultBranch: repo.default_branch,
//           installation: savedInstallation._id,
//         },
//         { upsert: true }
//       );
//     }
  
//     console.log("GitHub App installation saved:", installation.id);
  
//     return new Response("OK", { status: 200 });
//   } catch (error) {
//     console.log("Error Occure : ",error)
//     return Response.json({
//         success : false,
//         message : "Server Error"
//     },{
//         status : 500
//     })
//   }
// }

import crypto from "crypto";
import { headers } from "next/headers";
import User from "@/model/User";
import GithubInstallation from "@/model/GithubInstallation";
import GithubRepo from "@/model/GithubRepo";
import { dbConnect } from "@/lib/dbConnect";

export async function POST(req: Request) {
  /* --------------------------------------------------
     1️⃣ Read raw body & verify signature
  -------------------------------------------------- */
  const body = await req.text();
  const signature = (await headers()).get("x-hub-signature-256");

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

  if (!signature || signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    /* --------------------------------------------------
       2️⃣ Parse payload & connect DB
    -------------------------------------------------- */
    const payload = JSON.parse(body);
    await dbConnect();

    /* ==================================================
       3️⃣ INSTALLATION CREATED
       Triggered when app is installed
    ================================================== */
    if (payload.action === "created" && payload.installation) {
      const installation = payload.installation;

      // 🔑 FIND USER USING GITHUB USER ID (CORRECT WAY)
      const user = await User.findOne({
        githubUserId: installation.account.id.toString(),
      });

      if (!user) {
        console.error(
          "User not found for GitHub ID:",
          installation.account.id
        );
        return new Response("User not found", { status: 404 });
      }

      // Save / update installation
      const savedInstallation =
        await GithubInstallation.findOneAndUpdate(
          { installationId: installation.id.toString() },
          {
            installationId: installation.id.toString(),
            githubAccountId: installation.account.id.toString(),
            githubAccountLogin: installation.account.login,
            user: user._id,
          },
          { upsert: true, new: true }
        );

      // Save repositories selected during install
      if (payload.repositories?.length) {
        for (const repo of payload.repositories) {
          await GithubRepo.findOneAndUpdate(
            { githubRepoId: repo.id.toString() },
            {
              githubRepoId: repo.id.toString(),
              name: repo.name,
              fullName: repo.full_name,
              private: repo.private,
              defaultBranch: "main",
              installation: savedInstallation._id,
            },
            { upsert: true }
          );
        }
      }

      return new Response("Installation created", { status: 200 });
    }

    /* ==================================================
       4️⃣ REPOSITORIES ADDED
       Triggered when user adds repos later
    ================================================== */
    if (
      payload.action === "added" &&
      payload.installation &&
      payload.repositories_added
    ) {
      const installation = await GithubInstallation.findOne({
        installationId: payload.installation.id.toString(),
      });

      if (!installation) {
        return new Response("Installation not found", {
          status: 404,
        });
      }

      for (const repo of payload.repositories_added) {
        await GithubRepo.findOneAndUpdate(
          { githubRepoId: repo.id.toString() },
          {
            githubRepoId: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            defaultBranch: "main",
            installation: installation._id,
          },
          { upsert: true }
        );
      }

      return new Response("Repositories added", { status: 200 });
    }

    /* ==================================================
       5️⃣ REPOSITORIES REMOVED
       Triggered when user removes repos
    ================================================== */
    if (
      payload.action === "removed" &&
      payload.installation &&
      payload.repositories_removed
    ) {
      for (const repo of payload.repositories_removed) {
        await GithubRepo.deleteOne({
          githubRepoId: repo.id.toString(),
        });
      }

      return new Response("Repositories removed", { status: 200 });
    }

    /* --------------------------------------------------
       6️⃣ Ignore unrelated events
    -------------------------------------------------- */
    return new Response("Ignored", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}
