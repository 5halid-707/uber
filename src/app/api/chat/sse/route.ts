import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = verifyAuth(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");
  const userId = searchParams.get("userId") || user.userId;
  if (!tripId) return new Response("tripId required", { status: 400 });

  const encoder = new TextEncoder();
  let lastCheck = Date.now();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const poll = async () => {
        while (!closed) {
          try {
            const messages = await db.chatMessage.findMany({
              where: { tripId, createdAt: { gt: new Date(lastCheck) } },
              orderBy: { createdAt: "asc" },
            });
            if (messages.length > 0) {
              send(JSON.stringify(messages));
              lastCheck = Date.now();
            }
          } catch {}
          await new Promise(r => setTimeout(r, 1500));
        }
      };

      send(JSON.stringify([]));
      poll();

      req.signal.addEventListener("abort", () => { closed = true; controller.close(); });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
