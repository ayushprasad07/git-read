import crypto from "crypto";
import { headers } from "next/headers";

import { dbConnect } from "@/lib/dbConnect";

import User from "@/model/User";
import GithubInstallation from "@/model/GithubInstallation";
import GithubRepo from "@/model/GithubRepo";
import ReadmeJob, { READ_ME_JOB_STATUS } from "@/model/ReadmeJob";

/**
 * GitHub App Webhook Handler
 *
 * Handles:
 * - installation.created
 * - installation.deleted  ✅ (FULL CLEANUP)
 * - installation_repositories.added
 * - installation_repositories.removed
 * - push (auto-sync README)
 */
export async function POST(req: Request) {

  const body = await req.text();
  const headersList = await headers();

  const signature = headersList.get("x-hub-signature-256");
  const event = headersList.get("x-github-event");

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
    const payload = JSON.parse(body);
    await dbConnect();

    if (event === "installation" && payload.action === "created") {
      const installation = payload.installation;

      // Match user using GitHub USER ID
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

    if (event === "installation" && payload.action === "deleted") {
      const installationId = payload.installation.id.toString();

      const installation = await GithubInstallation.findOne({
        installationId,
      });

      if (!installation) {
        return new Response("Installation already removed", {
          status: 200,
        });
      }

      // 1️ Fetch repos linked to this installation
      const repos = await GithubRepo.find({
        installation: installation._id,
      }).select("_id");

      const repoIds = repos.map((r) => r._id);

      // 2️ Delete README jobs
      await ReadmeJob.deleteMany({
        repo: { $in: repoIds },
      });

      // 3️ Delete repos
      await GithubRepo.deleteMany({
        installation: installation._id,
      });

      // 4️ Delete installation
      await GithubInstallation.deleteOne({
        _id: installation._id,
      });

      console.log(
        `🗑️ GitHub App uninstalled → cleaned installation ${installationId}`
      );

      return new Response("Installation deleted", { status: 200 });
    }


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

      return new Response("README job queued", { status: 200 });
    }

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
