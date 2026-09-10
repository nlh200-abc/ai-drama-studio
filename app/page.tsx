'use client';

import { useState, useRef, useEffect } from 'react';
import { GenerationResult, AgentInfo, ChatMessage } from '@/lib/types';

const AGENTS: AgentInfo[] = [
  { id: 'director', name: '张导', role: '导演', icon: '🎬', color: 'from-blue-500 to-cyan-500', status: 'pending', progress: 0, text: '' },
  { id: 'writer', name: '李编剧', role: '编剧', icon: '✍️', color: 'from-green-500 to-emerald-500', status: 'pending', progress: 0, text: '' },
  { id: 'character', name: '王设计', role: '角色设计', icon: '🎨', color: 'from-purple-500 to-pink-500', status: 'pending', progress: 0, text: '' },
  { id: 'storyboard', name: '孙分镜', role: '分镜师', icon: '🖼️', color: 'from-yellow-500 to-orange-500', status: 'pending', progress: 0, text: '' },
  { id: 'video', name: '周制作', role: '视频制作', icon: '🎥', color: 'from-red-500 to-rose-500', status: 'pending', progress: 0, text: '' },
];

export default function Home() {
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('悬疑');
  const [style, setStyle] = useState('国漫3D');
  const [shots, setShots] = useState(5);
  const [enableImages, setEnableImages] = useState(true);
  const [enableVideos, setEnableVideos] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agents, setAgents] = useState<AgentInfo[]>(AGENTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'characters' | 'storyboards' | 'videos'>('script');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (name: string, text: string, type: string = 'text', imageUrl?: string) => {
    setMessages(prev => [...prev, { name, text, type: type as any, imageUrl }]);
  };

  const updateAgent = (agentId: string, status: string, progress: number, text: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: status as any, progress, text } : a));
  };

  const resetAgents = () => {
    setAgents(AGENTS.map(a => ({ ...a, status: 'pending', progress: 0, text: '' })));
    setMessages([]);
    setResult(null);
  };

  const startGeneration = async () => {
    if (!idea.trim()) {
      alert('请输入创意描述');
      return;
    }

    resetAgents();
    setIsGenerating(true);
    addMessage('系统', '开始生成...🚀');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, genre, style, shots, enableImages, enableVideos }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          let eventType = '';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            if (line.startsWith('data: ')) dataStr += line.slice(6);
          }
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            switch (eventType) {
              case 'agent_status':
                updateAgent(data.agentId, data.status, data.progress, data.text);
                break;
              case 'chat':
                addMessage(data.name, data.text, data.type, data.imageUrl);
                break;
              case 'complete':
                setResult(data.result);
                addMessage('系统', '🎉 全部完成！');
                break;
              case 'error':
                addMessage('系统', `❌ 错误：${data.message}`);
                break;
            }
          } catch (e) {
            console.error('解析SSE事件失败:', e);
          }
        }
      }
    } catch (e: any) {
      addMessage('系统', `❌ 生成失败：${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-dark-300">
      <header className="bg-dark-200 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎬 AI 漫剧智能体
          </h1>
          <div className="text-sm text-gray-400">6个AI Agent协作 · 一键生成漫剧</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-dark-200 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-bold mb-4 text-white">📝 创作设置</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">创意描述 *</label>
                    <textarea
                      value={idea}
                      onChange={e => setIdea(e.target.value)}
                      placeholder="例如：一个外卖员在送餐途中发现了一个惊天秘密..."
                      className="w-full bg-dark-100 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary resize-none h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">类型</label>
                      <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-dark-100 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary">
                        <option>悬疑</option><option>科幻</option><option>古风</option><option>都市</option><option>玄幻</option><option>现实</option><option>喜剧</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">风格</label>
                      <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-dark-100 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary">
                        <option>国漫3D</option><option>真人写实</option><option>日式动漫</option><option>赛博朋克</option><option>国风水墨</option><option>美式卡通</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">镜头数：{shots}</label>
                    <input type="range" min="3" max="20" value={shots} onChange={e => setShots(parseInt(e.target.value))} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={enableImages} onChange={e => setEnableImages(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm text-gray-300">🖼️ 生成分镜图片</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={enableVideos} onChange={e => setEnableVideos(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm text-gray-300">🎥 生成视频（较慢）</span>
                    </label>
                  </div>
                  <button onClick={startGeneration} disabled={isGenerating} className={`w-full py-3 rounded-xl font-bold text-white transition-all ${isGenerating ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'}`}>
                    {isGenerating ? '生成中...' : '🚀 开始生成'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-dark-200 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-bold mb-4 text-white">🤖 Agent 流水线</h2>
                <div className="flex flex-wrap gap-3">
                  {agents.map((agent, i) => (
                    <div key={agent.id} className="flex items-center gap-2">
                      <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl ${agent.status === 'working' ? 'agent-working' : ''} ${agent.status === 'completed' ? 'ring-2 ring-green-400' : ''}`}>
                        {agent.icon}
                        {agent.status === 'completed' && <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>}
                        {agent.status === 'error' && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">✕</div>}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white">{agent.name}</div>
                        <div className="text-gray-400">{agent.role}</div>
                        {agent.status === 'working' && agent.text && <div className="text-primary text-[10px] mt-0.5">{agent.text}</div>}
                      </div>
                      {i < agents.length - 1 && <div className="text-gray-600 mx-1">→</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-dark-200 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-bold mb-4 text-white">💬 实时对话</h2>
                <div className="bg-dark-100 rounded-xl p-4 h-80 overflow-y-auto space-y-3">
                  {messages.length === 0 && <div className="text-center text-gray-500 text-sm py-8">点击"开始生成"，AI Agent 们会在这里实时汇报进度</div>}
                  {messages.map((msg, i) => (
                    <div key={i} className="message-bubble">
                      <div className="inline-block max-w-[85%] bg-dark-200 rounded-2xl px-3.5 py-2">
                        <div className="text-xs text-gray-400 mb-0.5">{msg.name}</div>
                        <div className="text-sm text-white">{msg.text}</div>
                        {msg.imageUrl && <img src={msg.imageUrl} alt="分镜图" className="mt-2 rounded-lg max-w-[220px] cursor-pointer hover:opacity-90" onClick={() => window.open(msg.imageUrl, '_blank')} />}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ResultView result={result} activeTab={activeTab} setActiveTab={setActiveTab} onReset={resetAgents} />
        )}
      </div>
    </main>
  );
}

function ResultView({ result, activeTab, setActiveTab, onReset }: {
  result: GenerationResult;
  activeTab: 'script' | 'characters' | 'storyboards' | 'videos';
  setActiveTab: (tab: any) => void;
  onReset: () => void;
}) {
  const tabs = [
    { id: 'script', label: '📝 剧本' },
    { id: 'characters', label: '🎨 角色' },
    { id: 'storyboards', label: '🖼️ 分镜' },
    { id: 'videos', label: '🎥 视频' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-dark-200 rounded-2xl p-6 border border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🎉 创作完成</h2>
          <p className="text-gray-400 mt-1">{result.script?.title} · {result.script?.shots.length}个镜头 · {result.characters?.length}个角色</p>
        </div>
        <button onClick={onReset} className="px-6 py-2 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-bold hover:opacity-90">🔄 重新创作</button>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-dark-200 text-gray-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-dark-200 rounded-2xl p-6 border border-gray-800">
        {activeTab === 'script' && result.script && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">{result.script.title}</h3>
            <p className="text-gray-400">{result.script.logline}</p>
            <div className="space-y-4">
              {result.script.shots.map((shot, i) => (
                <div key={i} className="bg-dark-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-lg font-bold">第{shot.shotNumber}镜</span>
                    <span className="text-xs text-gray-400">{shot.emotion}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1"><span className="text-gray-500">场景：</span>{shot.sceneDescription}</p>
                  <p className="text-sm text-gray-300 mb-1"><span className="text-gray-500">动作：</span>{shot.action}</p>
                  {shot.dialogue && <p className="text-sm text-gray-300"><span className="text-gray-500">对白：</span>{shot.dialogue}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'characters' && result.characters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.characters.map((char, i) => (
              <div key={i} className="bg-dark-100 rounded-xl p-4">
                <h4 className="text-lg font-bold text-white mb-2">{char.name}</h4>
                <p className="text-sm text-gray-400 mb-2">{char.description}</p>
                {char.dna && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {char.dna.faceShape && <div><span className="text-gray-500">脸型：</span><span className="text-gray-300">{char.dna.faceShape}</span></div>}
                    {char.dna.hairStyle && <div><span className="text-gray-500">发型：</span><span className="text-gray-300">{char.dna.hairStyle}</span></div>}
                    {char.dna.outfit && <div><span className="text-gray-500">服装：</span><span className="text-gray-300">{char.dna.outfit}</span></div>}
                    {char.dna.colorScheme && <div><span className="text-gray-500">配色：</span><span className="text-gray-300">{char.dna.colorScheme}</span></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'storyboards' && result.storyboards && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.storyboards.map((sb, i) => (
              <div key={i} className="bg-dark-100 rounded-xl overflow-hidden">
                {sb.imageUrl ? (
                  <img src={sb.imageUrl} alt={`第${sb.shotNumber}镜`} className="w-full aspect-video object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(sb.imageUrl, '_blank')} />
                ) : (
                  <div className="w-full aspect-video bg-dark-300 flex items-center justify-center text-gray-500 text-sm">{sb.imageStatus === 'error' ? '❌ 图片生成失败' : '未生成图片'}</div>
                )}
                <div className="p-3">
                  <div className="text-xs text-primary font-bold mb-1">第{sb.shotNumber}镜</div>
                  <p className="text-xs text-gray-400 line-clamp-2">{sb.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && result.videos && result.videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.videos.map((video, i) => (
              <div key={i} className="bg-dark-100 rounded-xl overflow-hidden">
                {video.videoUrl ? (
                  <video src={video.videoUrl} controls className="w-full" />
                ) : (
                  <div className="w-full aspect-video bg-dark-300 flex items-center justify-center text-gray-500 text-sm">{video.status === 'error' ? `❌ ${video.error}` : '未生成视频'}</div>
                )}
                <div className="p-3"><div className="text-xs text-primary font-bold">第{video.shotNumber}镜</div></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && (!result.videos || result.videos.length === 0) && (
          <div className="text-center text-gray-500 py-8">未开启视频生成</div>
        )}
      </div>
    </div>
  );
}
