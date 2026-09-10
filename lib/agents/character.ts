import { APIConfig, Character, CharacterDNA, ShootingPlan } from '../types';
import { callLLM, parseJSON } from '../api';

export async function runCharacter(config: APIConfig, plan: ShootingPlan): Promise<Character[]> {
  const results: Character[] = [];

  for (const c of plan.characters) {
    const sys = `你是角色设计师王设计。输出JSON：{"visualPrompt":"英文50-80词角色视觉描述","dna":{"faceShape":"","skinTone":"","hairStyle":"","outfit":"","props":"","bodyLanguage":"","colorScheme":"","silhouette":""},"speechStyle":"","paradox":""}`;
    const usr = `角色：${c.name}\n描述：${c.description}\n外貌：${c.appearance}\n\n请设计这个角色的完整视觉DNA，确保特征具体、可复现。`;

    try {
      const raw = await callLLM(config, sys, usr, true);
      const p = parseJSON(raw);
      results.push({ name: c.name, description: c.description, appearance: c.appearance, visualPrompt: p?.visualPrompt || c.appearance, dna: (p?.dna || {}) as CharacterDNA, speechStyle: p?.speechStyle || '', paradox: p?.paradox || '' });
    } catch (e) {
      results.push({ name: c.name, description: c.description, appearance: c.appearance, visualPrompt: c.appearance, dna: {} as CharacterDNA });
    }
  }

  return results;
}
