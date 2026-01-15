import { Octokit } from "@octokit/rest";
import { getInstallationAccessToken } from "@/lib/githubApp";

const IMPORTANT_FILES = [
  "README.md",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "pom.xml",
  "build.gradle",
];

export async function fetchImportantFiles(
  repo: any,
  installation: any
): Promise<Record<string, string>> {
  const token = await getInstallationAccessToken(
    Number(installation.installationId)
  );

  const octokit = new Octokit({ auth: token });

  const extractedFile: Record<string, string> = {};

  for (const file of IMPORTANT_FILES) {
    try {
      const { data }: any = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: repo.fullName.split("/")[0],
          repo: repo.fullName.split("/")[1],
          path: file,
        }
      );

      if (data?.content) {
        extractedFile[file] = Buffer.from(
          data.content,
          "base64"
        ).toString("utf-8");
      }
    } catch {
      // ignore missing files
    }
  }

  return extractedFile;
}
