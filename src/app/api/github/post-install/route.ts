import { redirect } from "next/navigation";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Optional: you can read installation_id if needed
  const installationId = url.searchParams.get("installation_id");

  return Response.redirect(
    `${url.origin}/dashboard`,
    302
  );
}
