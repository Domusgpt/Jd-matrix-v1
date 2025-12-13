
import { GeneratedFrame, SubjectCategory, SavedProject, DeckMixMode } from "../types";
import { VERTEX_SHADER, FRAGMENT_SHADER, HolographicParams } from "../components/Visualizer/HolographicVisualizer";

interface ExportDeck {
    id: number;
    rig: SavedProject | null;
    isActive: boolean;
    mixMode?: DeckMixMode;
}

export const generatePlayerHTML = (
    decks: ExportDeck[],
    hologramParams: HolographicParams,
    subjectCategory: SubjectCategory
): string => {
    
    // Serialize data safely
    const decksJSON = JSON.stringify(decks).replace(/</g, '\\u003c');
    const paramsJSON = JSON.stringify(hologramParams).replace(/</g, '\\u003c');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jusDNCE // Universal Player</title>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; background: #050505; overflow: hidden; font-family: 'Rajdhani', sans-serif; user-select: none; color: #fff; }
        canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        #bgCanvas { z-index: 1; }
        #charCanvas { z-index: 2; pointer-events: none; }
        
        #ui {
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 100;
            display: flex; gap: 12px; align-items: center;
            background: rgba(10,10,12,0.8); backdrop-filter: blur(16px);
            padding: 12px 24px; border-radius: 24px; 
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            transition: opacity 0.3s;
        }
        #ui:hover { opacity: 1; }
        
        button {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: #ccc; padding: 10px 20px; border-radius: 14px;
            cursor: pointer; font-weight: 700; font-size: 13px; text-transform: uppercase;
            display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        button:hover { background: rgba(255,255,255,0.1); transform: translateY(-1px); }
        button.active { background: #8b5cf6; border-color: #a78bfa; color: white; box-shadow: 0 0 15px rgba(139,92,246,0.4); }
        button.red { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
        button.red.recording { background: #ef4444; color: white; animation: pulse 1s infinite; }
        
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        #overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 200;
            background: black; display: flex; align-items: center; justify-content: center;
            transition: opacity 0.5s; pointer-events: none; opacity: 1;
        }
        #watermark {
            position: absolute; top: 20px; right: 20px; z-index: 50;
            font-size: 24px; font-weight: 900; color: white; opacity: 0.3;
            text-shadow: 0 0 10px rgba(139,92,246,0.5);
            font-style: italic;
        }
        .file-drop {
            border: 2px dashed #444; border-radius: 20px; padding: 40px; text-align: center; color: #888;
        }
        .file-drop.dragover { border-color: #8b5cf6; background: rgba(139,92,246,0.1); color: white; }
    </style>
</head>
<body>
    <canvas id="bgCanvas"></canvas>
    <canvas id="charCanvas"></canvas>
    <div id="watermark">jusDNCE</div>
    
    <div id="overlay">
        <div style="text-align:center">
            <h1 style="font-size: 40px; margin:0; color: #8b5cf6;">UNIVERSAL PLAYER</h1>
            <p style="color: #666; margin-top: 10px;">CLICK TO START KINETIC ENGINE</p>
        </div>
    </div>

    <div id="ui">
        <button id="btnPlay" onclick="document.getElementById('audioInput').click()">🎵 LOAD SONG</button>
        <button id="btnMic">🎙️ MIC</button>
        <button id="btnCam">📷 CAM</button>
        <button id="btnRec" class="red">🔴 REC</button>
        <div style="width:1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 10px;"></div>
        <button onclick="document.getElementById('rigInput').click()">📂 ADD RIG</button>
    </div>
    
    <input type="file" id="audioInput" accept="audio/*" style="display:none">
    <input type="file" id="rigInput" accept=".jusdnce" style="display:none">
    <audio id="audioEl" loop style="display:none" crossOrigin="anonymous"></audio>

    <script>
        // --- DATA INJECTION ---
        let DECKS = ${decksJSON};
        const PARAMS = ${paramsJSON};
        
        // --- ENGINE STATE ---
        const STATE = {
            images: {}, // Global image cache
            frameLookup: new Map(), // deckId_pose -> FrameData
            decks: [], // Processed decks with buckets
            
            // Physics
            camZoom: 1.15, camPanX: 0, camPanY: 0,
            rotX: 0, rotY: 0, velX: 0, velY: 0,
            squash: 1.0, skew: 0.0, bounceY: 0.0,
            
            // Sequencer
            mode: 'GROOVE', // GROOVE, IMPACT, EMOTE, FOOTWORK
            bar: 0, phrase: 0,
            targetPose: 'base',
            currentDeckId: 0,
            lastBeat: 0,
            
            // Audio
            bass: 0, mid: 0, high: 0, energy: 0,
            
            // Flags
            superCam: true,
            isPlaying: false
        };

        // --- ASSET PROCESSING (BUCKETING) ---
        async function processDeck(deck) {
            if (!deck.rig) return null;
            
            const buckets = { low: [], mid: [], high: [], closeups: [], hands: [], feet: [], mandalas: [], virtuals: [], acrobatics: [] };
            const loadPromises = [];
            
            deck.rig.frames.forEach(f => {
                const key = \`\${deck.id}_\${f.pose}\`;
                STATE.frameLookup.set(key, { ...f, deckId: deck.id });
                
                // Preload
                if (!STATE.images[f.pose]) {
                    const img = new Image(); img.crossOrigin = "anonymous"; img.src = f.url;
                    STATE.images[f.pose] = img;
                    loadPromises.push(new Promise(r => img.onload = r));
                }

                // Bucket Logic (Matches Step4Preview)
                if (f.type === 'closeup') {
                    buckets.closeups.push(f);
                    // Virtual Zoom
                    const vPose = f.pose + '_vzoom';
                    const vKey = \`\${deck.id}_\${vPose}\`;
                    STATE.frameLookup.set(vKey, { ...f, pose: vPose, isVirtual: true, virtualZoom: 1.5 });
                    buckets.virtuals.push({ ...f, pose: vPose, isVirtual: true });
                    // Map virtual image alias
                    if(!STATE.images[vPose]) STATE.images[vPose] = STATE.images[f.pose];
                }
                else if (f.type === 'hands') {
                    buckets.hands.push(f);
                    if (f.pose.includes('mandala')) buckets.mandalas.push(f);
                }
                else if (f.type === 'feet') buckets.feet.push(f);
                else {
                    if (buckets[f.energy]) buckets[f.energy].push(f);
                    if (f.role === 'alt') buckets.acrobatics.push(f);
                }
            });

            // Safety
            if(buckets.low.length===0) buckets.low = [...buckets.mid];

            await Promise.all(loadPromises);
            return { ...deck, buckets };
        }

        // --- VISUALIZER ENGINE ---
        const VERTEX = \`${VERTEX_SHADER}\`;
        const FRAGMENT = \`${FRAGMENT_SHADER}\`;
        
        class Visualizer {
            constructor(c){this.gl=c.getContext('webgl'); this.st=Date.now(); this.init();}
            init(){
                const p=this.gl.createProgram(); 
                this.gl.attachShader(p,this.s(35633,VERTEX)); this.gl.attachShader(p,this.s(35632,FRAGMENT));
                this.gl.linkProgram(p); this.gl.useProgram(p);
                this.u={
                    t:this.gl.getUniformLocation(p,'u_time'), r:this.gl.getUniformLocation(p,'u_resolution'),
                    b:this.gl.getUniformLocation(p,'u_audioBass'), m:this.gl.getUniformLocation(p,'u_audioMid'), h:this.gl.getUniformLocation(p,'u_audioHigh'),
                    rot:this.gl.getUniformLocation(p,'u_cameraRot'), den:this.gl.getUniformLocation(p,'u_density'),
                    col:this.gl.getUniformLocation(p,'u_color'), int:this.gl.getUniformLocation(p,'u_intensity')
                };
                this.gl.bindBuffer(34962,this.gl.createBuffer());
                this.gl.bufferData(34962,new Float32Array([-1,-1,1,-1,-1,1,1,1]),35044);
                this.gl.enableVertexAttribArray(0); this.gl.vertexAttribPointer(0,2,5126,0,0,0);
            }
            s(t,s){const x=this.gl.createShader(t);this.gl.shaderSource(x,s);this.gl.compileShader(x);return x;}
            render(){
                this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height);
                this.gl.uniform1f(this.u.t,(Date.now()-this.st)/1000);
                this.gl.uniform2f(this.u.r,this.gl.canvas.width,this.gl.canvas.height);
                this.gl.uniform1f(this.u.b,STATE.bass); this.gl.uniform1f(this.u.m,STATE.mid); this.gl.uniform1f(this.u.h,STATE.high);
                
                // Camera Rotation from Physics
                const rx = STATE.superCam ? STATE.rotX * 0.3 : 0;
                const ry = STATE.superCam ? STATE.rotY * 0.3 : 0;
                this.gl.uniform3f(this.u.rot, rx, ry, 0);
                
                // Params
                this.gl.uniform1f(this.u.den, PARAMS.density || 2.0);
                this.gl.uniform1f(this.u.int, PARAMS.intensity || 0.6);
                
                // Color (Simple calc)
                const h = (PARAMS.hue || 200)/360; 
                // ... simplistic color logic for brevity ...
                this.gl.uniform3f(this.u.col, 0.2, 0.5, 1.0); // Cyan base

                this.gl.drawArrays(5,0,4);
            }
        }

        // --- AUDIO ENGINE ---
        let audioCtx, analyser, srcNode, destNode;
        async function initAudio(){
            if(audioCtx) return;
            audioCtx=new (window.AudioContext||window.webkitAudioContext)();
            analyser=audioCtx.createAnalyser(); analyser.fftSize=256;
            destNode=audioCtx.createMediaStreamDestination(); // For recording
            document.getElementById('overlay').style.opacity=0;
        }

        async function loadAudioFile(file){
            await initAudio();
            const url = URL.createObjectURL(file);
            const audio = document.getElementById('audioEl');
            audio.src = url;
            
            if(srcNode) srcNode.disconnect();
            srcNode = audioCtx.createMediaElementSource(audio);
            srcNode.connect(analyser);
            srcNode.connect(audioCtx.destination);
            srcNode.connect(destNode);
            
            audio.play();
            STATE.isPlaying = true;
            document.getElementById('btnPlay').innerText = "⏸️ PAUSE";
        }
        
        async function enableMic(){
            await initAudio();
            const stream = await navigator.mediaDevices.getUserMedia({audio:true});
            if(srcNode) srcNode.disconnect();
            srcNode = audioCtx.createMediaStreamSource(stream);
            srcNode.connect(analyser);
            srcNode.connect(destNode);
            document.getElementById('btnMic').classList.add('active');
        }

        // --- MAIN LOOP (THE BRAIN) ---
        let lastTime = Date.now();
        
        function loop(){
            requestAnimationFrame(loop);
            const now = Date.now();
            const dt = Math.min((now - lastTime)/1000, 0.1);
            lastTime = now;
            
            // 1. Audio Analysis
            if(analyser){
                const d=new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(d);
                STATE.bass = d[0]/255; STATE.mid = d[10]/255; STATE.high = d[40]/255;
            }

            // 2. Physics Solver
            const stiffness = 140; const damping = 8;
            let targetRotX = STATE.bass * 35.0; 
            let targetRotY = STATE.mid * 25.0 * Math.sin(now * 0.005);
            
            if (STATE.mode === 'FOOTWORK') targetRotX += 20;

            STATE.velX += ((targetRotX - STATE.rotX) * stiffness - (STATE.velX * damping)) * dt;
            STATE.rotX += STATE.velX * dt;
            
            STATE.velY += ((targetRotY - STATE.rotY) * stiffness - (STATE.velY * damping)) * dt;
            STATE.rotY += STATE.velY * dt;

            // 3. Sequencer (The Brain)
            const activeDecks = STATE.decks.filter(d => d.isActive);
            const seqDecks = activeDecks.filter(d => d.mixMode === 'sequencer' || !d.mixMode);
            
            if (seqDecks.length > 0 && now - STATE.lastBeat > 300 && STATE.bass > 0.5) {
                STATE.lastBeat = now;
                STATE.bar = (STATE.bar + 1) % 16;
                STATE.phrase = (STATE.phrase + 1) % 8;
                
                const isDrop = STATE.bass > 0.8;
                const isPeak = STATE.high > 0.7;
                const isFill = STATE.phrase === 7;
                
                // Helper to gather frames from all active sequencer decks
                const gather = (selector) => seqDecks.flatMap(d => (selector(d.buckets) || []).map(f => ({...f, deckId: d.id})));
                
                // Mode Selection
                let nextMode = 'GROOVE';
                if (isPeak && gather(b => b.closeups).length) nextMode = 'EMOTE';
                else if (isDrop && gather(b => b.hands).length) nextMode = 'IMPACT';
                else if (STATE.bar >= 12 && gather(b => b.feet).length) nextMode = 'FOOTWORK';
                
                STATE.mode = nextMode;

                // Frame Selection
                let pool = [];
                if (nextMode === 'EMOTE') {
                     pool = gather(b => b.virtuals); // Prefer virtual zoom
                     if(pool.length === 0) pool = gather(b => b.closeups);
                     STATE.camZoom = 1.5;
                } else if (nextMode === 'IMPACT') {
                     pool = gather(b => b.mandalas);
                     if(pool.length === 0) pool = gather(b => b.acrobatics);
                     if(pool.length === 0) pool = gather(b => b.hands);
                } else if (nextMode === 'FOOTWORK') {
                     pool = gather(b => b.feet);
                } else {
                     // Groove
                     const dir = STATE.bar % 2 === 0 ? 'left' : 'right';
                     pool = gather(b => b.mid.filter(f => f.direction === dir));
                     if(pool.length === 0) pool = gather(b => b.mid);
                     if(pool.length === 0) pool = gather(b => b.low);
                     STATE.squash = 0.85; 
                     STATE.bounceY = -50 * STATE.bass;
                }
                
                if (pool.length > 0) {
                    const nextFrame = pool[Math.floor(Math.random() * pool.length)];
                    STATE.targetPose = nextFrame.pose;
                    STATE.currentDeckId = nextFrame.deckId;
                }
            }

            // 4. Physics Decay
            STATE.squash += (1.0 - STATE.squash) * (12 * dt);
            STATE.bounceY += (0 - STATE.bounceY) * (10 * dt);
            const targetZoom = STATE.mode === 'EMOTE' ? 1.5 : 1.15;
            STATE.camZoom += (targetZoom - STATE.camZoom) * (2 * dt);
            
            // 5. Render
            viz.render();
            renderChar();
        }

        const bg=document.getElementById('bgCanvas'); 
        const charC=document.getElementById('charCanvas'); 
        const ctx=charC.getContext('2d');
        const viz=new Visualizer(bg);

        function renderChar() {
            const w = window.innerWidth; const h = window.innerHeight;
            if(charC.width !== w) { charC.width = w; charC.height = h; }
            ctx.clearRect(0,0,w,h);
            const cx = w/2; const cy = h/2;

            // Draw Sequencer Deck
            const mainDeck = STATE.decks.find(d => d.id === STATE.currentDeckId);
            if (mainDeck) drawPose(mainDeck, STATE.targetPose, 1.0);

            // Draw Layer Decks (Overlay)
            STATE.decks.filter(d => d.isActive && d.mixMode === 'layer').forEach(d => {
                // For layer decks, just try to match the pose name if it exists, or fallback
                let pose = STATE.targetPose;
                if (!STATE.images[pose]) pose = Object.keys(STATE.images)[0];
                drawPose(d, pose, 1.0);
            });
        }

        function drawPose(deck, pose, opacity) {
            const img = STATE.images[pose];
            if(!img) return;
            
            const frameData = STATE.frameLookup.get(\`\${deck.id}_\${pose}\`);
            const extraScale = frameData?.virtualZoom || 1.0;
            
            const w = ctx.canvas.width; const h = ctx.canvas.height;
            const ar = img.width / img.height;
            let dw = w; let dh = w / ar;
            if (dh > h) { dh = h; dw = dh * ar; }

            ctx.save();
            ctx.translate(w/2 + STATE.camPanX, h/2 + STATE.bounceY + STATE.camPanY);
            
            const radY = (STATE.superCam ? STATE.rotY : 0) * Math.PI / 180;
            const scaleX = Math.cos(radY); 
            
            ctx.scale(Math.abs(scaleX), 1);
            ctx.scale(1/STATE.squash, STATE.squash);
            ctx.scale(STATE.camZoom * extraScale, STATE.camZoom * extraScale);
            
            ctx.globalAlpha = opacity * deck.opacity;
            ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
            ctx.restore();
        }

        // --- INIT ---
        async function boot() {
            // Process initial decks
            const processed = await Promise.all(DECKS.map(processDeck));
            STATE.decks = processed.filter(Boolean);
            if(STATE.decks[0]) STATE.targetPose = STATE.decks[0].rig.frames[0].pose;
            loop();
        }

        document.getElementById('overlay').onclick = () => {
             initAudio();
        };

        // Inputs
        document.getElementById('audioInput').onchange = e => loadAudioFile(e.target.files[0]);
        document.getElementById('btnMic').onclick = enableMic;
        document.getElementById('btnCam').onclick = () => { STATE.superCam = !STATE.superCam; document.getElementById('btnCam').classList.toggle('active'); };
        
        // Rig Import
        document.getElementById('rigInput').onchange = async (e) => {
            const file = e.target.files[0];
            const text = await file.text();
            const rig = JSON.parse(text);
            const newId = STATE.decks.length;
            const newDeck = { id: newId, rig, isActive: true, mixMode: 'sequencer', opacity: 1.0 };
            const proc = await processDeck(newDeck);
            STATE.decks.push(proc);
            alert("Rig Imported to Sequencer!");
        };

        // RECORDER
        const btnRec = document.getElementById('btnRec');
        let rec;
        btnRec.onclick = () => {
             if(btnRec.classList.contains('recording')) {
                 rec.stop();
                 btnRec.classList.remove('recording');
                 btnRec.innerText = "🔴 REC";
             } else {
                 if(!destNode) initAudio();
                 const st = charC.captureStream(60);
                 // Add Audio Track
                 if(destNode && destNode.stream.getAudioTracks().length > 0) {
                     st.addTrack(destNode.stream.getAudioTracks()[0]);
                 }
                 
                 rec = new MediaRecorder(st, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
                 const chunks = [];
                 rec.ondataavailable = e => chunks.push(e.data);
                 rec.onstop = () => {
                     const b = new Blob(chunks, {type:'video/webm'});
                     const u = URL.createObjectURL(b);
                     const a = document.createElement('a'); a.href=u; a.download='jusdnce_clip.webm'; a.click();
                 };
                 rec.start();
                 btnRec.classList.add('recording');
                 btnRec.innerText = "⏹ STOP";
             }
        };

        boot();
    </script>
</body>
</html>`;
};
