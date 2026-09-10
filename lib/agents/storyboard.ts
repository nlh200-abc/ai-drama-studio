import { APIConfig, Character, Script, ShootingPlan, Storyboard, Cinematography } from '../types';
import { callLLM, parseJSON, generateImage } from '../api';

export async function runStoryboard(config: APIConfig, script: Script, chars: Character[], plan: ShootingPlan, enableImages: boolean, onProgress?: (shotNumber: number, total: number, status: string, imageUrl?: string) => void): Promise<Storyboard[]> {
  const results: Storyboard[] = [];

  for (let i = 0; i < script.shots.length; i++) {
    const shot = script.shots[i];

    const charDescs = (shot.characters || []).map(n => {
      const c = chars.find(x => x.name === n);
      if (!c) return n;
      const dna = c.dna || {};
      const dnaParts: string[] = [];
      if (dna.faceShape) dnaParts.push('face: ' + dna.faceShape);
      if (dna.skinTone) dnaParts.push('skin: ' + dna.skinTone);
      if (dna.hairStyle) dnaParts.push('hair: ' + dna.hairStyle);
      if (dna.outfit) dnaParts.push('outfit: ' + dna.outfit);
      if (dna.colorScheme) dnaParts.push('colors: ' + dna.colorScheme);
      if (dna.props) dnaParts.push('props: ' + dna.props);
      return `${n}: ${c.visualPrompt || c.appearance}. [Character DNA: ${dnaParts.join(', ')}]`;
    }).join('\n');

    const sys = `你是分镜师。输出JSON：{"prompt":"英文80-120词图像prompt","negativePrompt":"blurry,low quality","cinematography":{"shotSize":"","cameraAngle":"","cameraMovement":"","lighting":"","composition":""}}\n\n【强制规则】\n1. 所有分镜必须保持完全一致的艺术风格\n2. 同一角色在所有分镜中必须保持外貌100%一致\n3. prompt中必须完整包含角色的DNA特征描述\n4. 风格描述必须明确具体，统一使用同一种风格词汇`;
    const usr = `镜头${shot.shotNumber}\n场景：${shot.sceneDescription}\n动作：${shot.action}\n情绪：${shot.emotion}\n角色：\n${charDescs || '无'}\n全片统一风格：${plan.style}`;

    let sb: Storyboard = { shotNumber: shot.shotNumber, prompt: '', negativePrompt: '', cinematography: {} as Cinematography, characters: shot.characters || [], imageUrl: '', imageStatus: 'pending' };

    try {
      const raw = await callLLM(config, sys, usr, true);
      const p = parseJSON(raw);
      sb = { ...sb, ...p };
    } catch (e) {
      sb.prompt = `${shot.sceneDescription},${shot.action},${plan.style} style,cinematic`;
    }

    if (enableImages && sb.prompt) {
      try {
        sb.imageStatus = 'generating';
        onProgress?.(shot.shotNumber, script.shots.length, 'generating');
        const unifiedPrompt = `${sb.prompt}, consistent art style, same character appearance, unified color palette, cinematic lighting, high quality`;
        sb.imageUrl = await generateImage(config, unifiedPrompt, '2560x1440');
        sb.imageStatus = 'completed';
        onProgress?.(shot.shotNumber, script.shots.length, 'completed', sb.imageUrl);
      } catch (e: any) {
        sb.imageStatus = 'error';
        sb.imageError = e.message;
        onProgress?.(shot.shotNumber, script.shots.length, 'error');
      }
    } else {
      sb.imageStatus = 'skipped';
    }

    results.push(sb);
  }

  return results;
}
