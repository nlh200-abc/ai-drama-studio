import { APIConfig, GenerationResult, ShootingPlan, Script, Character, Storyboard, VideoClip } from './types';
import { getConfig } from './api';
import { runDirector } from './agents/director';
import { runWriter } from './agents/writer';
import { runCharacter } from './agents/character';
import { runStoryboard } from './agents/storyboard';
import { runVideo } from './agents/video';

export interface OrchestratorCallbacks {
  onAgentStatus?: (agentId: string, status: string, progress: number, text: string) => void;
  onChat?: (name: string, text: string, type?: string, imageUrl?: string) => void;
  onStoryboardProgress?: (shotNumber: number, total: number, status: string, imageUrl?: string) => void;
  onVideoProgress?: (shotNumber: number, total: number, status: string, videoUrl?: string) => void;
}

export class Orchestrator {
  private config: APIConfig;
  private callbacks: OrchestratorCallbacks;
  private aborted: boolean = false;

  constructor(callbacks: OrchestratorCallbacks = {}) {
    this.config = getConfig();
    this.callbacks = callbacks;
  }

  abort() {
    this.aborted = true;
  }

  private updateAgent(agentId: string, status: string, progress: number, text: string) {
    this.callbacks.onAgentStatus?.(agentId, status, progress, text);
  }

  private chat(name: string, text: string, type: string = 'text', imageUrl?: string) {
    this.callbacks.onChat?.(name, text, type, imageUrl);
  }

  async runFullPipeline(idea: string, genre: string, style: string, shots: number, enableImages: boolean, enableVideos: boolean): Promise<GenerationResult> {
    this.aborted = false;
    const startTime = Date.now();

    try {
      this.updateAgent('director', 'working', 10, '制定拍摄计划');
      this.chat('张导', `让我看看这个创意...🎬`);
      const plan = await runDirector(this.config, idea, genre, style, shots);
      this.chat('张导', `计划完成！${plan.characters.length}个角色，${plan.storyStructure.totalShots}个镜头 📋`);
      this.updateAgent('director', 'completed', 100, '计划完成');

      if (this.aborted) throw new Error('已取消');

      this.updateAgent('writer', 'working', 10, '撰写剧本');
      this.chat('李编剧', '三幕结构、人物弧光...✍️');
      const script = await runWriter(this.config, plan);
      this.chat('李编剧', `「${script.title}」写好了！${script.shots.length}镜 🔥`);
      this.updateAgent('writer', 'completed', 100, '剧本完成');

      if (this.aborted) throw new Error('已取消');

      this.updateAgent('character', 'working', 10, '设计角色');
      this.chat('王设计', `设计${plan.characters.length}个角色...🎨`);
      const characters = await runCharacter(this.config, plan);
      this.chat('王设计', `${characters.length}个角色设计完成 🎨✨`);
      this.updateAgent('character', 'completed', 100, '角色完成');

      if (this.aborted) throw new Error('已取消');

      this.updateAgent('storyboard', 'working', 10, '绘制分镜');
      this.chat('孙分镜', `${script.shots.length}个镜头，开始绘制...🖼️`);
      const storyboards = await runStoryboard(
        this.config, script, characters, plan, enableImages,
        (shotNumber, total, status, imageUrl) => {
          this.callbacks.onStoryboardProgress?.(shotNumber, total, status, imageUrl);
          if (status === 'completed' && imageUrl) {
            this.chat('孙分镜', `第${shotNumber}镜出图完成 🖼️`, 'image', imageUrl);
          } else if (status === 'error') {
            this.chat('孙分镜', `第${shotNumber}镜出图失败`);
          }
        }
      );
      this.chat('孙分镜', `${storyboards.length}个分镜完成！${enableImages ? '含图片' : '（未开启图片）'} 🎬`);
      this.updateAgent('storyboard', 'completed', 100, '分镜完成');

      if (this.aborted) throw new Error('已取消');

      let videos: VideoClip[] = [];
      if (enableVideos) {
        this.updateAgent('video', 'working', 10, '生成视频');
        this.chat('周制作', `开始生成${storyboards.length}个视频片段...🎥`);
        videos = await runVideo(
          this.config, storyboards, enableVideos,
          (shotNumber, total, status, videoUrl) => {
            this.callbacks.onVideoProgress?.(shotNumber, total, status, videoUrl);
            if (status === 'completed') {
              this.chat('周制作', `第${shotNumber}镜视频完成 ✅`);
            } else if (status === 'error') {
              this.chat('周制作', `第${shotNumber}镜视频失败`);
            }
          }
        );
        const ok = videos.filter(v => v.status === 'completed').length;
        this.chat('周制作', `视频生成完成！成功${ok}/${videos.length} 🎥`);
        this.updateAgent('video', 'completed', 100, '视频完成');
      } else {
        this.updateAgent('video', 'skipped', 100, '已跳过');
        this.chat('周制作', '视频生成未开启，跳过 ⏭️');
      }

      const result: GenerationResult = {
        plan, script, characters, storyboards, videos,
        createdAt: new Date().toISOString(),
        params: { idea, genre, style, shots, enableImages, enableVideos },
      };

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.chat('系统', `🎉 全部完成！耗时 ${duration} 秒`);

      return result;
    } catch (e: any) {
      this.chat('系统', `❌ 生成失败：${e.message}`);
      throw e;
    }
  }
}
