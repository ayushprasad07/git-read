import generateReadme from "@/lib/ai";
import main from "@/lib/ai";
import { dbConnect } from "@/lib/dbConnect";
import { getInstallationAccessToken } from "@/lib/githubApp";
import GithubInstallation from "@/model/GithubInstallation";

export async function GET() {
  await dbConnect();

  const installation = await GithubInstallation.findOne();

  const text = await generateReadme("What is a computer");

  if (!installation) {
    return Response.json({
      success: false,
      message: "No installation found",
      text
    });
  }

  const token = await getInstallationAccessToken(
    installation.installationId
  );

  return Response.json({
    success: true,
    tokenPreview: token.slice(0, 10) + "...",
    text
  });
}
