import { APIConfig, ShootingPlan, Character } from '../types';
import { callLLM, parseJSON } from '../api';

export async function runDirector(config: APIConfig, idea: string, genre: string, style: string, shots: number): Promise<ShootingPlan> {
  const sys = `你是资深影视导演张导。输出JSON：{"title":"","logline":"","characters":[{"name":"","description":"","appearance":""}],"storyStructure":{"act1":"","act2":"","act3":"","totalShots":0},"visualStyle":{"colorPalette":"","lightingStyle":"","artStyle":"","referenceMovies":[]}}`;
  const usr = `创意：${idea}\n类型：${genre}\n风格：${style}\n预计镜头数：${shots}\n\n请制定完整的拍摄计划，包括角色设定、三幕结构、视觉风格。`;

  const raw = await callLLM(config, sys, usr, true);
  const p = parseJSON(raw);
  if (!p) throw new Error('导演计划解析失败');

  return {
    title: p.title || '未命名',
    genre, style,
    tone: p.tone || '',
    targetAudience: p.targetAudience || '',
    logline: p.logline || '',
    characters: (p.characters || []).map((c: any) => ({ name: c.name || '角色', description: c.description || '', appearance: c.appearance || '' } as Character)),
    storyStructure: { act1: p.storyStructure?.act1 || '', act2: p.storyStructure?.act2 || '', act3: p.storyStructure?.act3 || '', totalShots: p.storyStructure?.totalShots || shots },
    visualStyle: { colorPalette: p.visualStyle?.colorPalette || '', lightingStyle: p.visualStyle?.lightingStyle || '', artStyle: p.visualStyle?.artStyle || style, referenceMovies: p.visualStyle?.referenceMovies || [] },
  };
}
