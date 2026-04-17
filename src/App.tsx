/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Image as ImageIcon, 
  ScanText, 
  UserRound, 
  Calculator, 
  Loader2, 
  Upload, 
  ArrowLeft,
  Github,
  Globe,
  MessageSquare,
  Send
} from 'lucide-react';
import { cn } from './lib/utils';
import { TRANSLATIONS, Language } from './constants';
import { generateImage, analyzeImage, getChatResponse } from './lib/gemini';

type Feature = 'home' | 'imageGen' | 'ocr' | 'face' | 'math' | 'chat';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function App() {
  const [lang, setLang] = useState<Language>('en-US');
  const [feature, setFeature] = useState<Feature>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  const handleLanguageChange = (l: Language) => setLang(l);

  const handleFeatureSelect = (f: Feature) => {
    setFeature(f);
    setResult(null);
    setImagePreview(null);
    setPrompt('');
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      
      if (feature !== 'imageGen') {
        const pureBase64 = base64.split(',')[1];
        setLoading(true);
        try {
          const res = await analyzeImage(
            pureBase64, 
            file.type, 
            feature === 'ocr' ? 'ocr' : feature === 'face' ? 'face' : 'math'
          );
          setResult(res || null);
        } catch (err) {
          setResult(t.error);
        } finally {
          setLoading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const imgUrl = await generateImage(prompt);
      setResult(imgUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      let friendlyError = errorMessage;
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        friendlyError = "Quota reached or limit set to 0. This usually means the image generation model is not yet available for your specific API key/region on the Free Tier. Please try again later or check your Google AI Studio quota settings.";
      }
      
      alert(`${t.error}\n\n${friendlyError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || loading) return;
    
    const userMessage: ChatMessage = { role: 'user', parts: [{ text: chatInput }] };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await getChatResponse(chatInput, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (err) {
      alert(t.error);
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg) font-sans text-(--text-main) selection:bg-white selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-(--bg)/80 backdrop-blur-md border-b border-(--border-color)">
        <div 
          className="flex items-center gap-2 cursor-pointer logo" 
          onClick={() => handleFeatureSelect('home')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-(--accent-blue) to-(--accent-purple) rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Metro<span className="bg-gradient-to-r from-(--accent-blue) to-(--accent-purple) bg-clip-text text-transparent">Seek</span> AI</h1>
        </div>

        <div className="flex items-center gap-2 p-1 bg-(--card-bg) border border-(--border-color) rounded-xl">
          {(['en-US', 'en-GB', 'si', 'ta'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => handleLanguageChange(l)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                lang === l 
                  ? "bg-white/10 text-(--text-main)" 
                  : "text-(--text-sub) hover:text-(--text-main)"
              )}
            >
              {l === 'en-US' ? 'EN-US' : l === 'en-GB' ? 'EN-GB' : l === 'si' ? 'සිංහල' : 'தமிழ்'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {feature === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              <div className="space-y-4 text-center">
                <h2 className="text-4xl sm:text-7xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-(--text-sub) bg-clip-text text-transparent">
                  {t.subtitle}
                </h2>
                <p className="text-lg text-(--text-sub) max-w-xl mx-auto">
                  {t.welcome}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 sm:grid-rows-2 gap-4 min-h-[600px]">
                <FeatureCard 
                  icon={<ImageIcon className="w-6 h-6" />}
                  title={t.imageGen}
                  description="Transform your thoughts into high-resolution visuals instantly."
                  onClick={() => handleFeatureSelect('imageGen')}
                  color="text-(--accent-green)"
                  iconBg="bg-(--accent-green)/10"
                  accent="border-t-4 border-(--accent-green)"
                  className="sm:col-span-2 sm:row-span-2"
                  tag="New Feature"
                  status="ACTIVE"
                />
                <FeatureCard 
                  icon={<ScanText className="w-6 h-6" />}
                  title={t.ocr}
                  description="Scan documents or images to extract editable text accurately."
                  onClick={() => handleFeatureSelect('ocr')}
                  color="text-(--accent-orange)"
                  iconBg="bg-(--accent-orange)/10"
                  accent="border-t-4 border-(--accent-orange)"
                  className="sm:col-span-2"
                />
                <FeatureCard 
                  icon={<UserRound className="w-6 h-6" />}
                  title={t.face}
                  description="Detect age, gender, and deep emotional metrics from portraits."
                  onClick={() => handleFeatureSelect('face')}
                  color="text-(--accent-blue)"
                  iconBg="bg-(--accent-blue)/10"
                  accent="border-t-4 border-(--accent-blue)"
                />
                <FeatureCard 
                  icon={<Calculator className="w-6 h-6" />}
                  title={t.math}
                  description="Solve complex equations and geometry proofs via camera."
                  onClick={() => handleFeatureSelect('math')}
                  color="text-(--accent-purple)"
                  iconBg="bg-(--accent-purple)/10"
                  accent="border-t-4 border-(--accent-purple)"
                />
                <FeatureCard 
                  icon={<MessageSquare className="w-6 h-6" />}
                  title={t.chatTitle}
                  description="General purpose AI companion for your daily needs."
                  onClick={() => handleFeatureSelect('chat')}
                  color="text-white"
                  iconBg="bg-white/10"
                  accent="border-t-2 border-white/20"
                />
              </div>

              <footer className="pt-12 border-t border-(--border-color) flex flex-col sm:flex-row items-center justify-between gap-6 opacity-50">
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-(--text-sub)">
                  <span>API Status: <span className="text-(--accent-green)">Stable</span></span>
                  <span className="hidden sm:inline">•</span>
                  <span>ID: AQ.Ab8RN6...iRMA</span>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-(--text-sub)">
                  Designed for Sri Lanka • MetroSeek 2024
                </div>
              </footer>
            </motion.div>
          )}

          {feature !== 'home' && (
            <motion.div
              key="feature"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 max-w-4xl mx-auto"
            >
              <button 
                onClick={() => handleFeatureSelect('home')}
                className="flex items-center gap-2 text-xs font-black text-(--text-sub) hover:text-white transition-colors tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK TO DASHBOARD</span>
              </button>

              <div className={cn(
                "bg-(--card-bg) rounded-[2.5rem] p-8 shadow-2xl border border-(--border-color)",
                feature === 'imageGen' && "border-t-4 border-(--accent-green)",
                feature === 'ocr' && "border-t-4 border-(--accent-orange)",
                feature === 'face' && "border-t-4 border-(--accent-blue)",
                feature === 'math' && "border-t-4 border-(--accent-purple)"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      feature === 'imageGen' && "bg-(--accent-green)/10 text-(--accent-green)",
                      feature === 'ocr' && "bg-(--accent-orange)/10 text-(--accent-orange)",
                      feature === 'face' && "bg-(--accent-blue)/10 text-(--accent-blue)",
                      feature === 'math' && "bg-(--accent-purple)/10 text-(--accent-purple)",
                      feature === 'chat' && "bg-white/10 text-white"
                    )}>
                      {feature === 'imageGen' && <ImageIcon className="w-6 h-6" />}
                      {feature === 'ocr' && <ScanText className="w-6 h-6" />}
                      {feature === 'face' && <UserRound className="w-6 h-6" />}
                      {feature === 'math' && <Calculator className="w-6 h-6" />}
                      {feature === 'chat' && <MessageSquare className="w-6 h-6" />}
                    </div>
                    {feature === 'imageGen' ? t.imageGen : feature === 'ocr' ? t.ocr : feature === 'face' ? t.face : feature === 'math' ? t.math : t.chatTitle}
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-(--accent-green) animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-(--text-sub)">Processing Ready</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {feature === 'chat' ? (
                    <div className="flex flex-col h-[500px] bg-white/5 rounded-3xl border border-(--border-color) overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {chatMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                             <MessageSquare className="w-12 h-12 mb-4" />
                             <p className="text-sm font-medium">{t.welcome}</p>
                          </div>
                        )}
                        {chatMessages.map((msg, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                              msg.role === 'user' 
                                ? "bg-white text-black self-end ml-auto rounded-tr-none" 
                                : "bg-white/10 text-(--text-main) self-start mr-auto rounded-tl-none"
                            )}
                          >
                            {msg.parts[0].text}
                          </motion.div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="p-4 bg-white/5 border-t border-(--border-color) flex gap-2">
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                          placeholder={t.chatPlaceholder}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-medium"
                        />
                        <button 
                          onClick={handleSendChatMessage}
                          disabled={loading || !chatInput.trim()}
                          className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  ) : feature === 'imageGen' ? (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-(--text-sub)">
                        {t.promptLabel}
                      </label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full min-h-[160px] p-6 bg-white/5 border border-(--border-color) rounded-3xl focus:ring-2 focus:ring-white/20 transition-all resize-none text-lg font-medium placeholder:text-white/20"
                        placeholder="e.g. A futuristic Colombo skyline at sunset..."
                      />
                      <button 
                        onClick={handleGenerateImage}
                        disabled={loading || !prompt.trim()}
                        className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                        {t.generateBtn.toUpperCase()}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-full aspect-video bg-white/5 border-2 border-dashed border-(--border-color) rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-white/40 transition-all overflow-hidden"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={onFileUpload} 
                          className="hidden" 
                          accept="image/*,.pdf"
                        />
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
                              <Upload className="w-6 h-6 text-(--text-sub) group-hover:text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-(--text-sub) group-hover:text-white transition-colors">{t.uploadLabel}</span>
                          </>
                        )}
                        {loading && (
                          <div className="absolute inset-0 bg-(--bg)/90 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-(--text-sub)">{t.analyzing}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 pt-8 border-t border-(--border-color)"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-(--text-sub)">
                          {t.resultLabel}
                        </label>
                        <button 
                          onClick={() => {
                            if (result) navigator.clipboard.writeText(result);
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-(--text-sub) hover:text-white transition-colors"
                        >
                          Copy Result
                        </button>
                      </div>
                      {feature === 'imageGen' ? (
                        <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-(--border-color)">
                           <img 
                            src={result} 
                            alt="Generated" 
                            className="w-full aspect-square object-cover"
                            referrerPolicy="no-referrer"
                           />
                        </div>
                      ) : (
                        <div className="p-8 bg-white/5 rounded-3xl text-(--text-main) whitespace-pre-wrap font-medium leading-relaxed border border-(--border-color)">
                          {result}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
  iconBg: string;
  className?: string;
  accent?: string;
  tag?: string;
  status?: string;
}

function FeatureCard({ icon, title, description, onClick, color, iconBg, className, accent, tag, status }: FeatureCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-8 bg-(--card-bg) rounded-[2rem] shadow-sm border border-(--border-color) text-left overflow-hidden transition-all",
        accent,
        className
      )}
    >
      <div className="flex justify-between items-start mb-auto">
        {tag && (
          <div className="px-2.5 py-1 bg-white/5 rounded-full border border-white/5 text-[8px] font-black uppercase tracking-widest text-white mb-6">
            {tag}
          </div>
        )}
        {status && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-(--accent-green) shadow-[0_0_8px_var(--accent-green)]" />
            <span className="text-[8px] font-black uppercase tracking-widest text-(--text-sub)">{status}</span>
          </div>
        )}
      </div>

      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", iconBg, color)}>
        {icon}
      </div>
      
      <div className="space-y-2 mt-4">
        <h3 className="text-xl font-black leading-tight uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-(--text-sub) leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-(--text-sub) group-hover:text-white transition-colors">
        <span>Open Feature</span>
        <ArrowLeft className="w-3 h-3 rotate-180 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  );
}
