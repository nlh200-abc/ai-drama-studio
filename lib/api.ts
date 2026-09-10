import { APIConfig } from './types';

export function getConfig(): APIConfig {
  return {
    textApiKey: process.env.TEXT_API_KEY || '',
    textBaseUrl: process.env.TEXT_BASE_URL || 'https://api.deepseek.com/v1',
    textModel: process.env.TEXT_MODEL || 'deepseek-chat',
    imageApiKey: process.env.IMAGE_API_KEY || '',
    imageBaseUrl: process.env.IMAGE_BASE_URL || '',
    imageModel: process.env.IMAGE_MODEL || '',
    videoApiKey: process.env.VIDEO_API_KEY || '',
    videoBaseUrl: process.env.VIDEO_BASE_URL || '',
    videoModel: process.env.VIDEO_MODEL || '',
  };
}

export async function callLLM(config: APIConfig, systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> {
  const key = config.textApiKey;
  const url = config.textBaseUrl;
  const model = config.textModel;
  if (!key) throw new Error('文本模型 API Key 未配置');

  let sys = systemPrompt;
  if (jsonMode) {
    sys += '\n\n重要：只返回JSON格式，不要返回任何其他内容、解释或markdown代码块。';
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }], max_tokens: 8192, temperature: 0.8 }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`文本API错误 ${res.status}: ${err.slice(0, 150)}`); }
    const d = await res.json();
    const content = d.choices?.[0]?.message?.content || '';
    if (content.trim()) return content;
  }
  throw new Error('LLM连续2次返回空内容，请检查模型是否可用或API额度');
}

export function parseJSON(raw: string): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch {}
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  const f = raw.indexOf('{'), l = raw.lastIndexOf('}');
  if (f !== -1 && l > f) { try { return JSON.parse(raw.slice(f, l + 1)); } catch {} }
  return null;
}

export async function generateImage(config: APIConfig, prompt: string, size: string = '2560x1440'): Promise<string> {
  const key = config.imageApiKey || config.textApiKey;
  const url = config.imageBaseUrl;
  const model = config.imageModel;
  if (!key || !url || !model) throw new Error('图片生成 API 未配置');

  const res = await fetch(`${url}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, prompt, size, response_format: 'url', watermark: false, n: 1 }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`图片API错误 ${res.status}: ${err.slice(0, 150)}`); }
  const d = await res.json();
  let imgUrl = '';
  if (d.data && d.data[0]) {
    if (d.data[0].url) imgUrl = d.data[0].url;
    else if (d.data[0].b64_json) imgUrl = `data:image/png;base64,${d.data[0].b64_json}`;
  }
  if (!imgUrl) throw new Error('图片生成返回格式异常: ' + JSON.stringify(d).slice(0, 200));
  return imgUrl;
}

export async function submitVideoTask(config: APIConfig, prompt: string, firstFrameUrl: string, duration: number = 5): Promise<string> {
  const key = config.videoApiKey || config.textApiKey;
  const url = config.videoBaseUrl;
  const model = config.videoModel;
  if (!key || !url || !model) throw new Error('视频生成 API 未配置');

  const content: any[] = [{ type: 'text', text: prompt }];
  if (firstFrameUrl && !firstFrameUrl.startsWith('data:')) {
    content.push({ type: 'image_url', image_url: { url: firstFrameUrl }, role: 'reference_image' });
  }

  const res = await fetch(`${url}/contents/generations/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, content, ratio: '16:9', duration, watermark: false }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`视频提交错误 ${res.status}: ${err.slice(0, 150)}`); }
  const d = await res.json();
  const taskId = d.id;
  if (!taskId) throw new Error('视频任务ID未找到: ' + JSON.stringify(d).slice(0, 200));
  return taskId;
}

export async function pollVideoTask(config: APIConfig, taskId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const key = config.videoApiKey || config.textApiKey;
  const url = config.videoBaseUrl;
  const res = await fetch(`${url}/contents/generations/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  if (!res.ok) return { status: 'running' };
  const d = await res.json();
  return { status: d.status, videoUrl: d.content?.video_url, error: d.error?.message };
}
