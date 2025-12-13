
import React, { useState } from 'react';
import { Zap, Layers, LogIn, Activity, FastForward, Upload, FileJson } from 'lucide-react';
import { AppState, AppStep, DEFAULT_STATE, AuthUser, SavedProject } from './types';
import { STYLE_PRESETS, CREDITS_PER_PACK } from './constants';
import { FunkificationMatrix } from './components/FunkificationMatrix';
import { Step4Preview } from './components/Step4Preview';
import { generateDanceFrames, fileToGenericBase64 } from './services/gemini';
import { AuthModal, PaymentModal } from './components/Modals';
import { GlobalBackground } from './components/GlobalBackground';

const triggerImpulse = (type: 'click' | 'hover' | 'type', intensity: number = 1.0) => {
    const event = new CustomEvent('ui-interaction', { detail: { type, intensity } });
    window.dispatchEvent(event);
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(DEFAULT_STATE);
  const [importRef] = useState<React.RefObject<HTMLInputElement>>(React.createRef());

  const handleImageUpload = async (file: File) => {
    try {
        const base64 = await fileToGenericBase64(file);
        setAppState(prev => ({
          ...prev,
          imageFile: file,
          imagePreviewUrl: base64,
          generatedFrames: [] 
        }));
    } catch (e: any) {
        console.error("Image upload processing failed:", e);
        alert(`Failed to load image: ${e.message || "Unknown error"}`);
    }
  };

  const handleAudioUpload = async (file: File) => {
    if (!file) {
        setAppState(prev => ({ ...prev, audioFile: null, audioPreviewUrl: null }));
        return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAppState(prev => ({
      ...prev,
      audioFile: file,
      audioPreviewUrl: previewUrl
    }));
  };

  const updateConfig = (key: string, value: any) => {
    setAppState(prev => ({ ...prev, [key]: value }));
  };

  const handleLogin = () => {
      const mockUser: AuthUser = {
          uid: '123456789',
          name: 'Beta User',
          email: 'user@example.com',
          photoURL: 'https://ui-avatars.com/api/?name=Beta+User&background=random'
      };
      setAppState(prev => ({ 
          ...prev, 
          user: mockUser, 
          showAuthModal: false,
          credits: prev.credits === 0 ? 5 : prev.credits 
      }));
  };

  const handleBuyCredits = () => {
     setAppState(prev => ({ ...prev, showPaymentModal: true }));
  };

  const handlePaymentSuccess = () => {
    setAppState(prev => ({ 
        ...prev, 
        credits: prev.credits + CREDITS_PER_PACK 
    }));
  };

  const handleSpendCredit = (amount: number): boolean => {
      if (appState.credits >= amount) {
          setAppState(prev => ({ ...prev, credits: prev.credits - amount }));
          return true;
      }
      return true;
  };

  const handleGenerate = async () => {
    if (!appState.imagePreviewUrl) return;
    
    setAppState(prev => ({ ...prev, isGenerating: true, step: AppStep.PLAYER, generatedFrames: [] }));

    const style = STYLE_PRESETS.find(s => s.id === appState.selectedStyleId);
    const imageBase64 = appState.imagePreviewUrl;
    
    let effectiveMotionPrompt = appState.motionPrompt;
    if (appState.motionPreset !== 'custom' && appState.motionPreset !== 'auto') {
        if (appState.motionPreset === 'bounce') effectiveMotionPrompt = "Bouncy, energetic, rhythmic jumping";
        if (appState.motionPreset === 'flow') effectiveMotionPrompt = "Smooth, fluid, liquid motion, floating";
        if (appState.motionPreset === 'glitch') effectiveMotionPrompt = "Twitchy, glitchy, rapid robotic movements";
    }

    try {
        const { frames, category } = await generateDanceFrames(
            imageBase64, 
            style?.promptModifier || 'artistic style',
            effectiveMotionPrompt,
            appState.useTurbo,
            appState.superMode,
            (partialFrames) => {
                setAppState(prev => ({
                    ...prev,
                    generatedFrames: partialFrames,
                }));
            }
        );

        setAppState(prev => ({
            ...prev,
            generatedFrames: frames,
            subjectCategory: category, 
            isGenerating: false
        }));
    } catch (e: any) {
        console.error("Generation Failed:", e);
        const msg = e.message || "Unknown error";
        if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
            alert("API Permission Denied (403). Please ensure your API Key has access to 'gemini-2.5-flash-image'.");
        } else {
            alert(`Generation failed: ${msg}`);
        }
        setAppState(prev => ({ ...prev, isGenerating: false, step: AppStep.MATRIX }));
    }
  };
  
  const saveProject = () => {
      if (appState.generatedFrames.length === 0) return;
      
      const style = STYLE_PRESETS.find(s => s.id === appState.selectedStyleId);

      const project: SavedProject = {
          id: crypto.randomUUID(),
          name: `Rig_${Date.now()}`,
          createdAt: Date.now(),
          frames: appState.generatedFrames,
          styleId: appState.selectedStyleId,
          subjectCategory: appState.subjectCategory,
          hologramParams: style?.hologramParams 
      };
      
      const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.jusdnce`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const project = JSON.parse(event.target?.result as string) as SavedProject;
              if (!project.frames || !project.styleId) throw new Error("Invalid Project File");
              
              setAppState(prev => ({
                  ...prev,
                  generatedFrames: project.frames,
                  selectedStyleId: project.styleId,
                  subjectCategory: project.subjectCategory || 'CHARACTER',
                  imagePreviewUrl: project.frames[0].url, 
                  step: AppStep.PLAYER 
              }));
              triggerImpulse('click', 1.5);
          } catch (err) {
              alert("Failed to load project file.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  return (
    <div className="min-h-screen relative text-gray-100 font-sans overflow-hidden selection:bg-brand-500/30 selection:text-white flex flex-col">
      
      <GlobalBackground appState={appState} />
      
      {/* HEADER */}
      <header className="border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-50 h-16 flex-none">
          <div className="w-full px-6 h-full flex items-center justify-between">
            <div 
                className="flex items-center gap-4 cursor-pointer group" 
                onClick={() => window.location.reload()}
                onMouseEnter={() => triggerImpulse('hover', 0.5)}
            >
                <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-brand-500 rounded-lg blur-lg opacity-40 group-hover:opacity-100 transition-opacity" />
                    <Activity size={20} className="text-white relative z-10" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-white italic">
                  jus<span className="text-brand-400 not-italic font-bold">DNCE</span>
                </h1>
            </div>
            
            <div className="flex items-center gap-4">
                <button
                    onClick={() => importRef.current?.click()}
                    className="glass-button px-4 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-2 border border-white/10 hover:border-brand-400/50"
                >
                    <FileJson size={12} className="text-brand-300" /> IMPORT RIG
                </button>
                <input ref={importRef} type="file" accept=".jusdnce" onChange={loadProject} className="hidden" />

                {appState.user ? (
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <img src={appState.user.photoURL} alt="Profile" className="w-8 h-8 rounded-full ring-2 ring-brand-500/50" />
                    </div>
                ) : (
                    <button 
                        onClick={() => setAppState(prev => ({ ...prev, showAuthModal: true }))}
                        className="glass-button px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold text-white tracking-wide shadow-lg"
                    >
                        <LogIn size={12} /> SIGN IN
                    </button>
                )}
            </div>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden">
        {/* MODALS */}
        <AuthModal 
            isOpen={appState.showAuthModal} 
            onClose={() => setAppState(prev => ({ ...prev, showAuthModal: false }))}
            onLogin={handleLogin}
        />
        <PaymentModal
            isOpen={appState.showPaymentModal}
            onClose={() => setAppState(prev => ({ ...prev, showPaymentModal: false }))}
            onSuccess={handlePaymentSuccess}
        />

        {appState.step === AppStep.MATRIX && (
            <FunkificationMatrix 
                state={appState}
                onUpdate={updateConfig}
                onUploadImage={handleImageUpload}
                onUploadAudio={handleAudioUpload}
                onGenerate={handleGenerate}
            />
        )}

        {appState.step === AppStep.PLAYER && (
            <div className="absolute inset-0 animate-holo-reveal">
                <Step4Preview 
                    state={appState}
                    onGenerateMore={() => setAppState(p => ({...p, step: AppStep.MATRIX}))}
                    onSpendCredit={handleSpendCredit}
                    onUploadAudio={handleAudioUpload}
                    onSaveProject={saveProject}
                />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
