// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { THEMES, Language, Problem } from './constants';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Code2, Terminal, Play, RefreshCcw, Download, Upload, 
  CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight,
  Cpu, Activity, Zap, ShieldAlert, Settings, Save, FileCode
} from 'lucide-react';

/** 
 * 1. DYNAMIC FILE SCANNING 
 * Automatically detects all JSON problems in src/problems_data/
 */
const problemFiles = import.meta.glob('./problems_data/*.json', { eager: true });

const DYNAMIC_PROBLEMS: Problem[] = Object.entries(problemFiles).map(([path, module]) => {
  const id = path.split('/').pop()?.replace('.json', '') || 'unknown';
  const data = module.default;
  return {
    id: id,
    title: id.replace(/_/g, ' ').toUpperCase(),
    description: `Hybrid evaluation marking for ${id}`,
    testCases: Array.isArray(data) ? data.length : 0,
    starterCode: {
      java: `public class Solution {\n    public static String execute(String input) {\n        // Logic for ${id} here\n        return "";\n    }\n}`,
      python: `def execute(input_str):\n    # logic here\n    return ""`,
      r: `execute <- function(input) {\n    return("")\n}`
    }
  };
});

/** 
 * 2. HEURISTIC LOGIC ANALYZER (Offline Fallback)
 */
const analyzeHeuristic = (code, problemId) => {
  const cleanCode = code.toLowerCase();
  const hasStructure = cleanCode.includes('for') || cleanCode.includes('while') || cleanCode.includes('if');
  const hasKeyword = problemId.split('_').some(k => cleanCode.includes(k));
  return hasStructure && hasKeyword;
};

export default function App() {
  // --- AUTH & CONFIG ---
  const [apiKeys, setApiKeys] = useState({
    clientId: localStorage.getItem('jd_client_id') || '',
    clientSecret: localStorage.getItem('jd_client_secret') || ''
  });
  const [showSettings, setShowSettings] = useState(false);

  // --- UI & ENGINE STATE ---
  const [activeTheme, setActiveTheme] = useState('cyberpunk-glow');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(DYNAMIC_PROBLEMS[0] || null);
  const [selectedLang, setSelectedLang] = useState<Language>('java');
  const [code, setCode] = useState(DYNAMIC_PROBLEMS[0]?.starterCode.java || '');
  const [isJudging, setIsJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'marking' | 'terminal'>('marking');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['Marking System v3.2 [HYBRID] Online']);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  const generateJavaHarness = (userCode, testCases) => {
    // 1. Prepare the user's code: 
    // Remove 'public' so it can live in the same file as our test runner.
    // Rename 'FIFO' to 'StudentCode' to avoid naming conflicts.
    let processedCode = userCode
      .replace(/public\s+class\s+FIFO/g, 'class StudentCode')
      .replace(/public\s+class/g, 'class');

    return `
import java.util.*;
import java.io.*;

// --- THE STUDENT'S CODE ---
${processedCode}

// --- SUPPORTING CLASS (Required for compilation) ---
class Memory {
    private final Integer[] frames;
    public Memory(int n) { this.frames = new Integer[n]; }
    public boolean isEmpty(int i) { return frames[i] == null; }
    public int size() { return frames.length; }
    public void put(int i, int p) { frames[i] = p; }
    public boolean contains(int p) { return indexOf(p) != -1; }
    public int indexOf(int p) {
        for(int i=0; i<frames.length; i++) if(frames[i]!=null && frames[i]==p) return i;
        return -1;
    }
    public void replace(int oldP, int newP) { put(indexOf(oldP), newP); }
    public int get(int i) { return frames[i]; }
    public String toString() {
        StringBuilder sb = new StringBuilder("[");
        for(int i=0; i<frames.length; i++) {
            sb.append(isEmpty(i) ? "-" : frames[i]);
            if(i < frames.length-1) sb.append(", ");
        }
        return sb.append("]").toString();
    }
}

// --- BATCH TEST RUNNER ---
public class Main {
    public static void main(String[] args) {
        // Convert JSON inputs into a format the student's Scanner can read
        // Example: "3, 70120" becomes "3n70120n"
        String[] inputs = {${testCases.map(t => `"${t.input.replace(", ", "\\n")}\\n"`).join(", ")}};
        
        PrintStream originalOut = System.out;
        InputStream originalIn = System.in;

        for (int i = 0; i < inputs.length; i++) {
            System.out.println("START_TEST_" + (i + 1));
            
            try {
                // 1. Redirect System.in to feed our JSON input into the student's Scanner
                System.setIn(new ByteArrayInputStream(inputs[i].getBytes()));
                
                // 2. Redirect System.out to capture their printed trace
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                System.setOut(new PrintStream(baos));

                // 3. Call the student's main method
                StudentCode.main(new String[0]);

                // 4. Send the captured output back to the original console for our React parser
                System.setOut(originalOut);
                System.out.print(baos.toString());

            } catch (Exception e) {
                System.setOut(originalOut);
                System.out.println("RUNTIME_ERROR: " + e.toString());
            }
            
            System.out.println("END_TEST_" + (i + 1));
        }
        System.out.println("DONE");
    }
}
    `;
  };

  // --- 🛰️ API EXECUTION ---
const executeJdoodle = async (script) => {
    if (!apiKeys.clientId || !apiKeys.clientSecret) throw new Error("KEYS_MISSING");
    
    // Call your internal Vercel API route
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: apiKeys.clientId,
        clientSecret: apiKeys.clientSecret,
        script: script,
        language: "java",
        versionIndex: "4"
      })
    });

    if (!response.ok) throw new Error("API_REJECTED_OR_SERVER_ERROR");
    return await response.json();
  };

  // --- 🕹️ HANDLERS ---
  const handleProblemChange = (id: string) => {
    const prob = DYNAMIC_PROBLEMS.find(p => p.id === id);
    if (prob) {
      setSelectedProblem(prob);
      setCode(prob.starterCode[selectedLang]);
      setJudgeResult(null);
      setTerminalOutput([]);
      setConsoleLogs(prev => [...prev, `Context Switched: ${prob.title}`]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setCode(content);
        setConsoleLogs(prev => [...prev, `Imported file: ${file.name}`]);
      };
      reader.readAsText(file);
    }
  };

  const downloadSolution = () => {
    if (!selectedProblem) return;
    const ext = selectedLang === 'java' ? 'java' : selectedLang === 'python' ? 'py' : 'R';
    const link = document.createElement('a');
    link.href = `/scripts/${selectedProblem.id}.${ext}`;
    link.download = `${selectedProblem.id}.${ext}`;
    link.click();
    setConsoleLogs(prev => [...prev, `Downloading reference solution...`]);
  };

  const downloadLocalTestFile = () => {
    if (!selectedProblem) return;
    const fileKey = `./problems_data/${selectedProblem.id}.json`;
    const testCases = problemFiles[fileKey]?.default;
    const content = generateJavaHarness(code, testCases);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProblem.id}_test.java`;
    a.click();
    setConsoleLogs(prev => [...prev, `Generated ${selectedProblem.id}_test.java for local execution.`]);
  };

  const clearAll = () => {
    if (selectedProblem) setCode(selectedProblem.starterCode[selectedLang]);
    setJudgeResult(null);
    setTerminalOutput([]);
    setConsoleLogs(prev => [...prev, `Workspace cleared.`]);
  };

  const saveKeys = () => {
    localStorage.setItem('jd_client_id', apiKeys.clientId);
    localStorage.setItem('jd_client_secret', apiKeys.clientSecret);
    setShowSettings(false);
    setConsoleLogs(prev => [...prev, `API Keys updated.`]);
  };

  // --- 🛰️ FETCH REFERENCE CODE ---
const fetchReferenceCode = async (problemId, lang) => {
  try {
    const ext = lang === 'java' ? 'java' : (lang === 'python' ? 'py' : 'R');
    const response = await fetch(`/scripts/${problemId}.${ext}`);
    if (!response.ok) throw new Error("Reference file not found");
    return await response.text();
  } catch (err) {
    console.error(err);
    return null;
  }
};

// --- 🚀 MODIFIED MARKING HANDLER ---
// Added 'useReference' parameter
const runMarking = async (useReference = false) => {
  if (!selectedProblem) return;
  setIsJudging(true);
  setIsOfflineFallback(false);
  setActiveRightTab('marking');
  
  const sourceLabel = useReference ? "REFERENCE SCRIPT" : "USER CODE";
  setConsoleLogs(prev => [...prev, `Initiating deployment of ${sourceLabel} to Cloud JVM...`]);

  try {
    const fileKey = `./problems_data/${selectedProblem.id}.json`;
    const testCases = problemFiles[fileKey]?.default;

    // Determine which code to use
    let codeToRun = code; 
    if (useReference) {
      const refCode = await fetchReferenceCode(selectedProblem.id, selectedLang);
      if (!refCode) throw new Error("REF_FILE_MISSING");
      codeToRun = refCode;
    }

    if (selectedLang === 'java' && apiKeys.clientId) {
      const fullScript = generateJavaHarness(codeToRun, testCases);
      const data = await executeJdoodle(fullScript);
      
      if (data.output.toLowerCase().includes("error")) {
         setTerminalOutput([data.output]);
         throw new Error("COMPILE_ERROR");
      }

      const lines = data.output.split('\n');
      const results = testCases.map((test, i) => {
        const resultLine = lines.find(l => l.startsWith(`TEST ${i+1}:`));
        const passed = resultLine?.includes("PASS");
        return {
          id: i,
          input: test.input,
          expected: test.expected,
          actual: passed ? test.expected : (resultLine?.split('|')[1]?.trim() || "Runtime Error"),
          passed: passed
        };
      });

      setJudgeResult({
        score: Math.round((results.filter(r => r.passed).length / testCases.length) * 100),
        results
      });
      setTerminalOutput(lines);
      setConsoleLogs(prev => [...prev, `✅ ${sourceLabel} verified successfully.`]);
    } else {
      throw new Error("OFFLINE_MODE");
    }
  } catch (err) {
    // ... (Keep existing catch logic for fallback)
  } finally {
    setIsJudging(false);
  }
};

  // --- SETUP GUARD ---
  if (DYNAMIC_PROBLEMS.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-20 font-sans">
        <AlertTriangle className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
        <h1 className="text-3xl font-black uppercase tracking-tighter italic">Data Missing</h1>
        <p className="opacity-50 text-center max-w-sm mb-8 italic">No JSON problems found in src/problems_data/</p>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 font-mono text-xs">
           mkdir src/problems_data <br/>
           touch src/problems_data/fifo.json
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen text-slate-100 font-sans">
      {/* 🔐 SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="glass w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600/20 rounded-2xl"><Settings className="text-blue-400" /></div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight">API Access</h2>
              </div>
              <p className="text-[10px] text-yellow-400/80 mb-6 bg-yellow-400/10 p-4 rounded-2xl flex items-start gap-3">
                <ShieldAlert size={16} className="shrink-0" />
                ⚠️ API keys are stored locally in your browser cache. Do not share this device.
              </p>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 mb-2 block">Client ID</label>
                  <input type="text" value={apiKeys.clientId} onChange={(e) => setApiKeys({...apiKeys, clientId: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-mono" placeholder="clientId" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 mb-2 block">Client Secret</label>
                  <input type="password" value={apiKeys.clientSecret} onChange={(e) => setApiKeys({...apiKeys, clientSecret: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-mono" placeholder="clientSecret" />
                </div>
                <button onClick={saveKeys} className="w-full bg-blue-600 p-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all">
                  <Save size={18} /> Sync Credentials
                </button>
                <button onClick={() => setShowSettings(false)} className="w-full text-[10px] uppercase font-bold opacity-30 hover:opacity-100 py-2">Return to Staging</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 HEADER */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 rounded-[2rem] mb-8 flex flex-col lg:flex-row justify-between items-center gap-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Automarker <span className="text-blue-400 not-italic">Pro</span></h1>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Hybrid Staging Environment</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => setShowSettings(true)} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400"><Settings size={18}/></button>
          
          <select value={selectedProblem?.id} onChange={(e) => handleProblemChange(e.target.value)} className="bg-slate-900 border border-white/10 rounded-2xl px-5 py-3 text-xs font-bold outline-none cursor-pointer">
            {DYNAMIC_PROBLEMS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>

          <select value={activeTheme} onChange={(e) => setActiveTheme(e.target.value)} className="bg-slate-900 border border-white/10 rounded-2xl px-5 py-3 text-xs font-bold w-36 outline-none">
            {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <button onClick={downloadSolution} className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 hover:bg-blue-500/20 transition-all"><Download size={18}/></button>
        </div>
      </motion.header>

      {/* ⚠️ FALLBACK ALERT */}
      <AnimatePresence>
        {isOfflineFallback && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-yellow-500/20 rounded-2xl"><ShieldAlert className="text-yellow-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase text-yellow-500">Execution Failure / API Limit</h4>
                  <p className="text-[10px] opacity-60 max-w-sm leading-relaxed mt-1">Remote JVM is offline. Results below are heuristic approximations. For accurate marking, run the generated test file locally.</p>
                </div>
              </div>
              <button onClick={downloadLocalTestFile} className="bg-yellow-500 text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20">
                <FileCode size={16} /> Get Local Test Unit (Main.java)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 📝 WORKSPACE */}
        <section className="glass rounded-[2.5rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
          <div className="p-5 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <div className="flex gap-2">
              {['java', 'python', 'r'].map(lang => (
                <button key={lang} onClick={() => { setSelectedLang(lang); setCode(selectedProblem.starterCode[lang]); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLang === lang ? 'bg-blue-600 shadow-lg' : 'opacity-30 hover:opacity-100'}`}>{lang}</button>
              ))}
            </div>
            <div className="flex items-center gap-3">
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
               <button onClick={() => fileInputRef.current.click()} className="p-2 text-slate-500 hover:text-white transition-all"><Upload size={18}/></button>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/5 group">
              <textarea value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-[500px] p-8 font-mono text-sm bg-transparent text-emerald-400 outline-none scrollbar-hide resize-none leading-relaxed" spellCheck="false" placeholder="// Inject implementation here..." />
              <div className="absolute top-4 right-4 text-[10px] font-bold opacity-10 uppercase tracking-widest">UTF-8 / Java Runtime</div>
            </div>
            <div className="flex gap-4">
              <button onClick={runMarking} disabled={isJudging} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                {isJudging ? <Loader2 className="animate-spin w-5 h-5" /> : <Play size={18} className="fill-current" />} 
                {isJudging ? 'Compiling Logic...' : `Mark ${selectedProblem?.testCases} Test Units`}
              </button>
              <button onClick={clearAll} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-90"><RefreshCcw size={20}/></button>
            </div>
          </div>
        </section>


        {/* 📊 RESULTS */}
        <div className="space-y-8">
          <section className="glass rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl h-[650px] flex flex-col">
            <div className="bg-white/5 p-2 flex border-b border-white/10">
              <button onClick={() => setActiveRightTab('marking')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRightTab === 'marking' ? 'bg-white/10 shadow-inner' : 'opacity-30'}`}>Assessment Matrix</button>
              <button onClick={() => setActiveRightTab('terminal')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRightTab === 'terminal' ? 'bg-white/10 shadow-inner' : 'opacity-30'}`}>Staging Console</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <AnimatePresence mode="wait">
                {activeRightTab === 'marking' ? (
                  <motion.div key="marking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {!judgeResult && !isJudging && (
                      <div className="h-[400px] flex flex-col items-center justify-center opacity-10">
                        <Cpu size={60} className="mb-6 stroke-[1.5px]"/>
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Deployment</p>
                      </div>
                    )}
                    {isJudging && [1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5 mb-6" />)}
                    {judgeResult && judgeResult.results.map((res, i) => (
                      <div key={i} className={`p-6 rounded-3xl border ${res.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} mb-6 relative overflow-hidden group transition-all`}>
                        <div className="flex justify-between items-center mb-5">
                           <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Marking Unit #{(i+1).toString().padStart(2, '0')}</span>
                             <ChevronRight size={14} className="opacity-20" />
                             <span className="text-[10px] font-mono tracking-tighter opacity-60">IN: {res.input}</span>
                           </div>
                           {res.passed ? <CheckCircle2 className="text-green-500" size={20}/> : <XCircle className="text-red-500" size={20}/>}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <p className="text-[8px] uppercase font-black opacity-30 tracking-widest">Expected Solution</p>
                             <pre className="text-[10px] opacity-40 bg-black/30 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed font-mono border border-white/5">{res.expected}</pre>
                           </div>
                           <div className="space-y-2">
                             <p className="text-[8px] uppercase font-black opacity-30 tracking-widest">Captured Logic</p>
                             <pre className={`text-[10px] p-4 rounded-2xl whitespace-pre-wrap leading-relaxed font-mono border ${res.passed ? 'text-green-400 bg-green-500/10 border-green-500/10' : 'text-red-400 bg-red-500/10 border-red-500/10'}`}>{res.actual}</pre>
                           </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs space-y-3">
                    <div className="text-blue-400 opacity-40 mb-6 border-b border-blue-500/20 pb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3"><Terminal size={16}/> SYSTEM_RUNTIME_STDOUT</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em]">Live Stream</div>
                    </div>
                    {terminalOutput.length > 0 ? terminalOutput.map((line, i) => (
                      <div key={i} className="text-blue-300/80 border-l-2 border-blue-500/30 pl-6 py-1 italic mb-2">
                         <span className="opacity-20 mr-4 select-none">{(i+1).toString().padStart(3, '0')}</span>
                         {line}
                      </div>
                    )) : (
                      <div className="h-[400px] flex items-center justify-center opacity-10 uppercase font-black text-center leading-[3] tracking-widest text-[10px]">
                        Diagnostics Clear.<br/>No buffered runtime output.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Total Accuracy Footer */}
            {judgeResult && (
               <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Overall Performance</span>
                  <span className={`text-xl font-black italic tracking-tighter ${judgeResult.score >= 80 ? 'text-green-400' : 'text-red-400'}`}>
                    {judgeResult.score}% ACCURACY
                  </span>
               </div>
            )}
          </section>

          {/* 📟 DIAGNOSTICS */}
          <div className="glass rounded-[2rem] p-6 h-[160px] font-mono text-[10px] overflow-y-auto border border-white/10 bg-black/40 scrollbar-hide">
             <div className="opacity-20 uppercase font-black text-[9px] mb-3 flex items-center gap-2 tracking-[0.2em]"><Activity size={14}/> Diagnostic_Stream</div>
             {consoleLogs.map((log, i) => (
                <div key={i} className="text-blue-400/60 border-l border-blue-500/20 pl-4 mb-2 flex items-start gap-4">
                  <span className="opacity-20 shrink-0">[{i+1}]</span>
                  <span>{log}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}