import { APIConfig, Script, Shot, ShootingPlan } from '../types';
import { callLLM, parseJSON } from '../api';

export async function runWriter(config: APIConfig, plan: ShootingPlan): Promise<Script> {
  const charDescs = plan.characters.map(c => `${c.name}: ${c.description}`).join('\n');
  const sys = `你是金牌编剧李编剧。输出JSON：{"title":"","logline":"","genre":"","shots":[{"shotNumber":1,"sceneDescription":"","action":"","emotion":"","characters":[""],"dialogue":""}]}`;
  const usr = `片名：${plan.title}\n类型：${plan.genre}\n风格：${plan.style}\n一句话故事：${plan.logline}\n\n角色：\n${charDescs}\n\n三幕结构：\n第一幕：${plan.storyStructure.act1}\n第二幕：${plan.storyStructure.act2}\n第三幕：${plan.storyStructure.act3}\n\n请生成完整剧本，共${plan.storyStructure.totalShots}个镜头，每个镜头包含场景描述、动作、情绪、角色、对白。`;

  const raw = await callLLM(config, sys, usr, true);
  const p = parseJSON(raw);
  if (!p || !p.shots) throw new Error('剧本解析失败');

  return {
    title: p.title || plan.title,
    logline: p.logline || plan.logline,
    genre: p.genre || plan.genre,
    shots: (p.shots || []).map((s: any) => ({ shotNumber: s.shotNumber || 0, sceneDescription: s.sceneDescription || '', action: s.action || '', emotion: s.emotion || '', characters: s.characters || [], dialogue: s.dialogue || '' } as Shot)),
  };
}
