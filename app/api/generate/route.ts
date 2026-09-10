import { NextRequest } from 'next/server';
import { Orchestrator } from '@/lib/orchestrator';
import { GenerationResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { idea, genre, style, shots, enableImages, enableVideos } = body;

  if (!idea) {
    return new Response(JSON.stringify({ error: '缺少创意描述' }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const orchestrator = new Orchestrator({
          onAgentStatus: (agentId, status, progress, text) => {
            send('agent_status', { agentId, status, progress, text });
          },
          onChat: (name, text, type, imageUrl) => {
            send('chat', { name, text, type, imageUrl });
          },
          onStoryboardProgress: (shotNumber, total, status, imageUrl) => {
            send('storyboard_progress', { shotNumber, total, status, imageUrl });
          },
          onVideoProgress: (shotNumber, total, status, videoUrl) => {
            send('video_progress', { shotNumber, total, status, videoUrl });
          },
        });

        const result: GenerationResult = await orchestrator.runFullPipeline(
          idea, genre, style, shots, enableImages, enableVideos
        );

        send('complete', { result });
        controller.close();
      } catch (e: any) {
        send('error', { message: e.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
