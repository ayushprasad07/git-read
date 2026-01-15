import { dbConnect } from "@/lib/dbConnect";
import ReadmeJob, {
  READ_ME_JOB_STATUS,
} from "@/model/ReadmeJob";
import GithubRepo from "@/model/GithubRepo";
import GithubInstallation from "@/model/GithubInstallation";

import { fetchRepoFiles } from "@/lib/github/fetchRepoFiles";
import { analyseRepo } from "@/lib/repoAnalyzer";
import { buildReadmePrompt } from "@/lib/readmePrompt";
import generateReadme from "@/lib/ai";
import { commitReadme } from "@/lib/github/commitReadme";
import { fetchImportantFiles } from "../github/fetchImportantFiles";

/**
 * Internal normalized repo file type
 * (matches analyseRepo input)
 */
type RepoFile = {
  path: string;
  type: "blob" | "tree";
};


export async function processReadmeJobs() {
  await dbConnect();

  
  const job = await ReadmeJob.findOneAndUpdate(
    { status: READ_ME_JOB_STATUS.PENDING },
    { status: READ_ME_JOB_STATUS.PROCESSING },
    { new: true }
  )
    .populate("repo")
    .populate("user");

  if (!job) return;

  try {
    const repo = job.repo as any;

   
    const installation = await GithubInstallation.findById(
      repo.installation
    );

    if (!installation) {
      throw new Error("GitHub installation not found");
    }

   
    const files: RepoFile[] = (await fetchRepoFiles(
      repo,
      installation
    )) as RepoFile[];

    if (!files.length) {
      throw new Error("Repository files not found");
    }

    
    const analysis = await analyseRepo(files);

    
    const extractedFiles = await fetchImportantFiles(
        repo,
        installation
    );

    const prompt = await buildReadmePrompt(
        repo.name,
        analysis,
        extractedFiles
    );


    const readme = await generateReadme(prompt);

    if (!readme || typeof readme !== "string") {
      throw new Error("AI failed to generate README");
    }


    await commitReadme({
      repo,
      installation,
      content: readme,
      message: "docs: auto-sync README",
    });


    job.status = READ_ME_JOB_STATUS.COMPLETED;
    await job.save();
  } catch (error: any) {
    job.status = READ_ME_JOB_STATUS.FAILED;
    job.error =
      error?.message || "Unknown README worker error";

    await job.save();
  }
}
