import { processReadmeJobs } from "@/lib/workers/readmeWorker";

export async function GET() {
  try {
    await processReadmeJobs();
    return Response.json({ success: true },{ status: 200 });
  } catch (error) {
    console.error("Worker error:", error);
    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}
