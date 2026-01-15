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

import { dbConnect } from "@/lib/dbConnect";

import User from "@/model/User";
import GithubInstallation from "@/model/GithubInstallation";
import GithubRepo from "@/model/GithubRepo";
import ReadmeJob, {
  READ_ME_JOB_STATUS,
} from "@/model/ReadmeJob";

/**
 * GitHub App Webhook Handler
 * Handles:
 * - installation.created
 * - installation_repositories.added
 * - installation_repositories.removed
 * - push (auto-sync README)
 */
export async function POST(req: Request) {
  /* --------------------------------------------------
     1️⃣ Verify webhook signature
  -------------------------------------------------- */
  const body = await req.text();
  const signature = (await headers()).get("x-hub-signature-256");
  const event = (await headers()).get("x-github-event");

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
    ================================================== */
    if (event === "installation" && payload.action === "created") {
      const installation = payload.installation;

      // 🔑 Match user via GitHub USER ID (NOT username)
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

      // Save selected repositories
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
              autoSync: false, // user enables later
            },
            { upsert: true }
          );
        }
      }

      return new Response("Installation created", { status: 200 });
    }

    /* ==================================================
       4️⃣ REPOSITORIES ADDED
    ================================================== */
    if (
      event === "installation_repositories" &&
      payload.action === "added"
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
            autoSync: false,
          },
          { upsert: true }
        );
      }

      return new Response("Repositories added", { status: 200 });
    }

    /* ==================================================
       5️⃣ REPOSITORIES REMOVED
    ================================================== */
    if (
      event === "installation_repositories" &&
      payload.action === "removed"
    ) {
      for (const repo of payload.repositories_removed) {
        await GithubRepo.deleteOne({
          githubRepoId: repo.id.toString(),
        });
      }

      return new Response("Repositories removed", { status: 200 });
    }

    /* ==================================================
       6️⃣ PUSH EVENT → QUEUE README JOB
    ================================================== */
    if (event === "push" && payload.repository) {
      const fullName = payload.repository.full_name;

      const repo = await GithubRepo.findOne({
        fullName,
        autoSync: true,
      });

      if (!repo) {
        return new Response("Auto-sync disabled", {
          status: 200,
        });
      }

      const installation = await GithubInstallation.findById(
        repo.installation
      );

      if (!installation) {
        return new Response("Installation not found", {
          status: 404,
        });
      }

      // 🚦 Prevent duplicate pending jobs
      await ReadmeJob.findOneAndUpdate(
        {
          repo: repo._id,
          user: installation.user,
          status: READ_ME_JOB_STATUS.PENDING,
        },
        {
          repo: repo._id,
          user: installation.user,
          status: READ_ME_JOB_STATUS.PENDING,
        },
        { upsert: true }
      );

      return new Response("README job queued", {
        status: 200,
      });
    }

    /* --------------------------------------------------
       7️⃣ Ignore unrelated events
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
