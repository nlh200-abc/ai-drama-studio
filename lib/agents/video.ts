import { APIConfig, Storyboard, VideoClip } from '../types';
import { submitVideoTask, pollVideoTask } from '../api';

export async function runVideo(config: APIConfig, storyboards: Storyboard[], enableVideos: boolean, onProgress?: (shotNumber: number, total: number, status: string, videoUrl?: string) => void): Promise<VideoClip[]> {
  if (!enableVideos) return [];

  const results: VideoClip[] = [];

  for (let i = 0; i < storyboards.length; i++) {
    const sb = storyboards[i];
    const clip: VideoClip = { shotNumber: sb.shotNumber, videoUrl: '', status: 'pending' };

    try {
      clip.status = 'generating';
      onProgress?.(sb.shotNumber, storyboards.length, 'generating');

      const taskId = await submitVideoTask(config, sb.prompt, sb.imageUrl, 5);

      const maxWait = 600000;
      const interval = 10000;
      let waited = 0;

      while (waited < maxWait) {
        await new Promise(r => setTimeout(r, interval));
        waited += interval;

        const result = await pollVideoTask(config, taskId);

        if (result.status === 'succeeded' && result.videoUrl) {
          clip.videoUrl = result.videoUrl;
          clip.status = 'completed';
          onProgress?.(sb.shotNumber, storyboards.length, 'completed', clip.videoUrl);
          break;
        }

        if (result.status === 'failed') {
          clip.status = 'error';
          clip.error = result.error || '视频生成失败';
          onProgress?.(sb.shotNumber, storyboards.length, 'error');
          break;
        }
      }

      if (clip.status === 'generating') {
        clip.status = 'error';
        clip.error = '视频生成超时（>10分钟）';
        onProgress?.(sb.shotNumber, storyboards.length, 'error');
      }
    } catch (e: any) {
      clip.status = 'error';
      clip.error = e.message;
      onProgress?.(sb.shotNumber, storyboards.length, 'error');
    }

    results.push(clip);
  }

  return results;
}
