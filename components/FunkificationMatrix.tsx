
import React, { useRef, useState, useMemo } from 'react';
import { Music, ImageIcon, Play, Pause, Upload, Settings, Shuffle, Zap, Rocket, Star, Check, Layers, Wand2, Film, ChevronRight } from 'lucide-react';
import { AppState, StyleCategory, StylePreset } from '../types';
import { STYLE_PRESETS } from '../constants';

const triggerImpulse = (type: 'click' | 'hover' | 'type', intensity: number = 1.0) => {
    const event = new CustomEvent('ui-interaction', { detail: { type, intensity } });
    window.dispatchEvent(event);
};

const triggerColorShift = (hue: number) => {
    const event = new CustomEvent('color-shift', { detail: { hue } });
    window.dispatchEvent(event);
};

interface MatrixProps {
    state: AppState;
    onUpdate: (key: string, value: any) => void;
    onUploadImage: (file: File) => void;
    onUploadAudio: (file: File) => void;
    onGenerate: () => void;
}

export const FunkificationMatrix: React.FC<MatrixProps> = ({ state, onUpdate, onUploadImage, onUploadAudio, onGenerate }) => {
    const imgInput = useRef<HTMLInputElement>(null);
    const audioInput = useRef<HTMLInputElement>(null);
    const [activeCategory, setActiveCategory] = useState<StyleCategory>('Cinematic');
    
    const categories: StyleCategory[] = ['Cinematic', 'Anime/2D', 'Digital/Glitch', 'Artistic'];
    
    const filteredStyles = useMemo(() => {
        return STYLE_PRESETS.filter(s => s.category === activeCategory);
    }, [activeCategory]);

    const randomizeStyle = () => {
        const randomStyle = STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)];
        setActiveCategory(randomStyle.category);
        onUpdate('selectedStyleId', randomStyle.id);
        triggerImpulse('click', 1.0);
    };

    const MOTION_OPTIONS = [
        { id: 'auto', label: '✨ Auto (AI)' },
        { id: 'bounce', label: '🦘 Bounce' },
        { id: 'flow', label: '🌊 Flow' },
        { id: 'glitch', label: '⚡ Glitch' },
    ];

    const canGenerate = !!state.imagePreviewUrl;

    return (
        <div className="h-full flex flex-col max-w-[1600px] mx-auto p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
                        <Layers className="text-brand-400" /> THE MATRIX
                    </h2>
                    <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Asset Configuration & Initialization</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onUpdate('useTurbo', !state.useTurbo)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${state.useTurbo ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-black/40 border-white/10 text-gray-500'}`}
                    >
                        {state.useTurbo ? <Rocket size={14} /> : <Star size={14} />}
                        {state.useTurbo ? 'TURBO MODE' : 'QUALITY MODE'}
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* COL 1: SOURCE MATERIAL (3 Cols) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">1. Source Assets</h3>
                    
                    {/* Image Input */}
                    <div 
                        onClick={() => imgInput.current?.click()}
                        className={`
                            flex-1 relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
                            ${state.imagePreviewUrl ? 'border-brand-500/50 bg-brand-900/10' : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-brand-400/30'}
                        `}
                    >
                        {state.imagePreviewUrl ? (
                            <div className="w-full h-full relative">
                                <img src={state.imagePreviewUrl} className="w-full h-full object-contain p-4" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-bold text-white border border-white/20 px-3 py-1 rounded-full bg-black/50 backdrop-blur">CHANGE</span>
                                </div>
                                <div className="absolute top-2 right-2 bg-brand-500 text-white p-1 rounded-full"><Check size={12}/></div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="text-gray-400 group-hover:text-brand-300" size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-300">UPLOAD CHAR</p>
                                <p className="text-[10px] text-gray-500 mt-1">JPG / PNG / WEBP</p>
                            </div>
                        )}
                        <input ref={imgInput} type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
                    </div>

                    {/* Audio Input */}
                    <div 
                        onClick={() => audioInput.current?.click()}
                        className={`
                            h-32 relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
                            ${state.audioFile ? 'border-green-500/50 bg-green-900/10' : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-green-400/30'}
                        `}
                    >
                         {state.audioFile ? (
                             <div className="w-full h-full flex flex-col items-center justify-center relative">
                                 <Music className="text-green-400 mb-2" size={24} />
                                 <p className="text-xs font-bold text-green-200 truncate max-w-[80%]">{state.audioFile.name}</p>
                                 <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full"><Check size={12}/></div>
                             </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                                <Music className="text-gray-500 group-hover:text-green-300 mb-2 transition-colors" size={20} />
                                <p className="text-xs font-bold text-gray-400">AUDIO (OPTIONAL)</p>
                             </div>
                         )}
                         <input ref={audioInput} type="file" className="hidden" accept="audio/*" onChange={e => e.target.files?.[0] && onUploadAudio(e.target.files[0])} />
                    </div>
                </div>

                {/* COL 2: STYLE GRID (6 Cols) */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">2. Aesthetic Engine</h3>
                         <div className="flex gap-2">
                             {categories.map(cat => (
                                 <button 
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${activeCategory === cat ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                 >
                                     {cat === 'Anime/2D' ? 'ANIME' : cat === 'Digital/Glitch' ? 'GLITCH' : cat.toUpperCase()}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto pr-2 scrollbar-hide max-h-[600px]">
                        {filteredStyles.map(style => (
                            <div 
                                key={style.id}
                                onClick={() => { onUpdate('selectedStyleId', style.id); triggerImpulse('click', 0.5); }}
                                className={`
                                    group relative aspect-square rounded-xl cursor-pointer overflow-hidden border-2 transition-all
                                    ${state.selectedStyleId === style.id ? 'border-brand-400 scale-105 z-10 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}
                                `}
                            >
                                <img src={style.thumbnail} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <p className={`text-xs font-black leading-none ${state.selectedStyleId === style.id ? 'text-brand-300' : 'text-white'}`}>{style.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 3: CONTROLS (3 Cols) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">3. Parameters</h3>
                    
                    {/* Motion Presets */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Motion Pattern</label>
                        <div className="grid grid-cols-2 gap-2">
                            {MOTION_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => onUpdate('motionPreset', opt.id)}
                                    className={`
                                        px-2 py-3 rounded-lg text-xs font-bold border text-left transition-all
                                        ${state.motionPreset === opt.id ? 'bg-brand-500/20 border-brand-500 text-white' : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                <span>DURATION</span>
                                <span>{state.duration}s</span>
                            </div>
                            <input 
                                type="range" min="10" max="60" 
                                value={state.duration} 
                                onChange={e => onUpdate('duration', Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full accent-white"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                <span>REACTIVITY</span>
                                <span className="text-green-400">{state.reactivity}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                value={state.reactivity} 
                                onChange={e => onUpdate('reactivity', Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full accent-green-400"
                            />
                        </div>
                    </div>
                    
                    <button 
                         onClick={() => onUpdate('superMode', !state.superMode)}
                         className={`mt-auto p-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${state.superMode ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-black/20 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        <Star size={14} fill={state.superMode ? "currentColor" : "none"} />
                        {state.superMode ? "SUPER MODE ACTIVE (64 FRAMES)" : "ENABLE SUPER MODE"}
                    </button>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-6 border-t border-white/10 pt-6 flex justify-end">
                <button
                    disabled={!canGenerate}
                    onClick={() => { triggerImpulse('click', 1.5); onGenerate(); }}
                    className={`
                        px-12 py-5 rounded-full font-black text-xl tracking-widest flex items-center gap-4 transition-all duration-300
                        ${canGenerate 
                            ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-105 hover:shadow-[0_0_60px_rgba(139,92,246,0.6)]' 
                            : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                    `}
                >
                    {state.isGenerating ? (
                        <>PROCESSING <Zap className="animate-pulse" /></>
                    ) : (
                        <>INITIALIZE RIG <ChevronRight /></>
                    )}
                </button>
            </div>
        </div>
    );
};
