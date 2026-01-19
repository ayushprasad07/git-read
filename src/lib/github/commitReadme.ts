import { Octokit } from "@octokit/rest";
import { getInstallationAccessToken } from "@/lib/githubApp";

export async function commitReadme({
  repo,
  installation,
  content,
  message,
}: {
  repo: any;
  installation: any;
  content: string;
  message: string;
}) {
  const token = await getInstallationAccessToken(
    installation.installationId
  );

  const octokit = new Octokit({ auth: token });
  const [owner, name] = repo.fullName.split("/");

  let sha: string | undefined;

  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo: name,
        path: "README.md",
      }
    );

    // @ts-ignore
    sha = data.sha;
  } catch {}

  await octokit.request(
    "PUT /repos/{owner}/{repo}/contents/{path}",
    {
      owner,
      repo: name,
      path: "README.md",
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
    }
  );
}
