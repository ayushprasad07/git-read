import { Octokit } from "@octokit/rest";
import { getInstallationAccessToken } from "@/lib/githubApp";

export async function fetchRepoFiles(repo: any, installation: any) {
  const token = await getInstallationAccessToken(
    installation.installationId
  );

  const octokit = new Octokit({ auth: token });

  const [owner, name] = repo.fullName.split("/");

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner,
      repo: name,
      tree_sha: repo.defaultBranch,
      recursive: "true",
    }
  );

  return data.tree;
}
