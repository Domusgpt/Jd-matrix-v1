
import { useRef, useState, useCallback, useEffect } from 'react';

export interface AudioPlayer {
    audioElement: HTMLAudioElement;
    isPlaying: boolean;
    isMicActive: boolean;
    isEmbedActive: boolean;
    embedUrl: string | null;
    serviceType: 'youtube' | 'spotify' | 'pandora' | 'generic' | null;
    togglePlay: () => void;
    toggleMic: () => Promise<void>;
    loadAudio: (url: string) => void;
    loadStreamUrl: (url: string) => void;
    getAnalysis: () => AudioAnalysis;
    audioDestNode: MediaStreamAudioDestinationNode | null; // For recording
}

export interface AudioAnalysis {
    bass: number;
    mid: number;
    high: number;
    energy: number;
}

export const useAudioPlayer = (initialUrl?: string | null): AudioPlayer => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
    const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    
    // The actual audio element for local/direct files
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMicActive, setIsMicActive] = useState(false);
    
    // Streaming Service Support
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [serviceType, setServiceType] = useState<'youtube' | 'spotify' | 'pandora' | 'generic' | null>(null);

    // Initialize Audio Context on user interaction
    const initContext = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
            
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8; // Snappy but smooth
            
            // Destination node for recording
            audioDestRef.current = audioCtxRef.current.createMediaStreamDestination();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const connectSource = useCallback(() => {
        const ctx = initContext();
        if (analyserRef.current && audioDestRef.current) {
             // Disconnect old source
             if (sourceNodeRef.current) {
                 try { sourceNodeRef.current.disconnect(); } catch(e) {}
             }
             
             // Create new element source
             const src = ctx.createMediaElementSource(audioRef.current);
             src.connect(analyserRef.current);
             src.connect(ctx.destination); // Output to speakers
             src.connect(audioDestRef.current); // Output to recorder
             sourceNodeRef.current = src;
        }
    }, [initContext]);

    // Handle Direct File Loading (Local or Direct URL)
    const loadAudio = useCallback((url: string) => {
        if (audioRef.current.src !== url) {
            // Reset Embed State
            setEmbedUrl(null);
            setServiceType(null);
            
            audioRef.current.src = url;
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.loop = true;
            setIsPlaying(false);
            
            // If we were using mic for embed, maybe keep it? No, reset for file mode.
            if(isMicActive) disconnectMic();
        }
    }, [isMicActive]);

    // Handle Streaming Service URLs
    const loadStreamUrl = useCallback(async (url: string) => {
        let embedLink = null;
        let type: typeof serviceType = 'generic';

        // 1. YouTube
        const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const ytMatch = url.match(ytReg);
        if (ytMatch) {
            embedLink = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&playsinline=1`;
            type = 'youtube';
        }

        // 2. Spotify
        const spotReg = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
        const spotMatch = url.match(spotReg);
        if (spotMatch) {
            embedLink = `https://open.spotify.com/embed/${spotMatch[1]}/${spotMatch[2]}`;
            type = 'spotify';
        }
        
        // 3. Pandora (Generic Embed or Share Link)
        if (url.includes('pandora.com')) {
             embedLink = url; // Pandora allows embedding some share links directly or we rely on generic
             type = 'pandora';
        }

        if (embedLink) {
            // Stop local playback
            audioRef.current.pause();
            setIsPlaying(false);
            
            setEmbedUrl(embedLink);
            setServiceType(type);
            
            // CRITICAL: Auto-enable Mic because we can't analyze iframe audio directly
            if (!isMicActive) {
                try {
                    await toggleMic();
                } catch(e) {
                    console.warn("Auto-mic failed for stream", e);
                }
            }
        } else {
            // Fallback to trying to play it as a direct file
            loadAudio(url);
        }
    }, [isMicActive]);

    useEffect(() => {
        if (initialUrl) loadAudio(initialUrl);
    }, [initialUrl, loadAudio]);

    const togglePlay = useCallback(async () => {
        // If Embed is active, we can't control it via JS usually (cross-origin), 
        // but we can toggle the local player state for UI consistency
        if (embedUrl) {
            setIsPlaying(!isPlaying);
            return; 
        }

        if (isMicActive) {
            disconnectMic();
        }

        const ctx = initContext();
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Check if connected
            if (!sourceNodeRef.current || sourceNodeRef.current instanceof MediaStreamAudioSourceNode) {
                connectSource();
            }
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (e) {
                console.error("Playback failed", e);
            }
        }
    }, [isPlaying, isMicActive, initContext, connectSource, embedUrl]);

    const toggleMic = useCallback(async () => {
        if (isMicActive) {
            disconnectMic();
            return;
        }

        // Stop file playback
        if (isPlaying && !embedUrl) {
            audioRef.current.pause();
            setIsPlaying(false);
        }

        const ctx = initContext();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;

            if (analyserRef.current && audioDestRef.current) {
                if (sourceNodeRef.current) {
                    try { sourceNodeRef.current.disconnect(); } catch(e){}
                }
                
                const src = ctx.createMediaStreamSource(stream);
                src.connect(analyserRef.current);
                // NOTE: We do NOT connect mic to ctx.destination (speakers) to avoid feedback
                src.connect(audioDestRef.current); // Connect to recorder
                sourceNodeRef.current = src;
            }
            setIsMicActive(true);
        } catch (e) {
            // alert("Microphone access denied. Please enable it to visualize streaming audio.");
            throw e; 
        }
    }, [isMicActive, isPlaying, initContext, embedUrl]);

    const disconnectMic = () => {
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        setIsMicActive(false);
    };

    const getAnalysis = useCallback((): AudioAnalysis => {
        if (!analyserRef.current) return { bass: 0, mid: 0, high: 0, energy: 0 };

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Bands
        const bassRange = dataArray.slice(0, 5); 
        const midRange = dataArray.slice(5, 30); 
        const highRange = dataArray.slice(30, 100); 

        const bass = bassRange.reduce((a, b) => a + b, 0) / (bassRange.length * 255);
        const mid = midRange.reduce((a, b) => a + b, 0) / (midRange.length * 255);
        const high = highRange.reduce((a, b) => a + b, 0) / (highRange.length * 255);
        const energy = (bass * 0.5 + mid * 0.3 + high * 0.2);

        return { bass, mid, high, energy };
    }, []);

    // Cleanup
    useEffect(() => {
        const audioEl = audioRef.current;
        return () => {
            audioEl.pause();
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(t => t.stop());
            }
            // We don't close context to avoid recreating it constantly
        };
    }, []);

    return {
        audioElement: audioRef.current,
        isPlaying,
        isMicActive,
        isEmbedActive: !!embedUrl,
        embedUrl,
        serviceType,
        togglePlay,
        toggleMic,
        loadAudio,
        loadStreamUrl,
        getAnalysis,
        audioDestNode: audioDestRef.current
    };
};
