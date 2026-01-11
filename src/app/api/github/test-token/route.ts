
import { dbConnect } from "@/lib/dbConnect";
import { getInstallationAccessToken } from "@/lib/githubApp";
import GithubInstallation from "@/model/GithubInstallation";

export async function GET() {
  await dbConnect();

  const installation = await GithubInstallation.findOne();

  if (!installation) {
    return new Response("No installation found", { status: 404 });
  }

  const token = await getInstallationAccessToken(
    installation.installationId
  );

  return Response.json({
    success: true,
    tokenPreview: token.slice(0, 10) + "...",
  });
}
