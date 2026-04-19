// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { THEMES, Language, Problem, SUPPORT_LIBRARY } from './constants';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Code2, Terminal, Play, RefreshCcw, Download, Upload, 
  CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight,
  Cpu, Activity, Zap, ShieldAlert, Settings, Save, FileCode, Beaker
} from 'lucide-react';

/** 
 * 1. DYNAMIC FILE SCANNING 
 * Scans src/problems_data/*.json to populate the system automatically.
 */
const problemFiles = import.meta.glob('./problems_data/*.json', { eager: true });

const DYNAMIC_PROBLEMS: Problem[] = Object.entries(problemFiles).map(([path, module]) => {
  const id = path.split('/').pop()?.replace('.json', '') || 'unknown';
  const data = module.default;
  
  // Format check: Handle both raw array and the new Object format
  const isObjectFormat = !Array.isArray(data) && data.tests;
  const testData = isObjectFormat ? data.tests : (Array.isArray(data) ? data : []);
  const supportKey = isObjectFormat ? data.support : 'none';

  return {
    id: id,
    title: id.replace(/_/g, ' ').toUpperCase(),
    description: `Automated Logic Staging for ${id}`,
    supportKey: supportKey || 'none',
    testCases: testData.length,
    testData: testData,
    starterCode: {
      java: `public class Solution {\n    // Implementation for ${id}\n}`,
      python: `# Logic for ${id}\ndef solution():\n    pass`,
      r: `# Logic for ${id}\nmain <- function() {}`
    }
  };
});

/**
 * 2. ALGORITHM MAPPING
 * Ensures the harness knows exactly which method to trigger.
 */
const getAlgorithmCall = (problemId) => {
  if (!problemId) return 'Algorithm.execute';
  const map = {
    'fifo_algorithm': 'FIFO_Algorithm.firstInFirstOut',
    'lru_algorithm': 'LRU_Algorithm.leastRecentlyUsed',
    'opt_algorithm': 'OPT_Algorithm.optimalPageReplacement',
    'clock_algorithm': 'Clock_Algorithm.clockReplacement'
  };
  return map[problemId.toLowerCase()] || 'Algorithm.execute';
};

export default function App() {
  // --- SETTINGS & AUTH ---
  const [apiKeys, setApiKeys] = useState({
    clientId: localStorage.getItem('jd_client_id') || '',
    clientSecret: localStorage.getItem('jd_client_secret') || ''
  });
  const [showSettings, setShowSettings] = useState(false);

  // --- APP STATE ---
  const [activeTheme, setActiveTheme] = useState('cyberpunk-glow');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(DYNAMIC_PROBLEMS[0] || null);
  const [selectedLang, setSelectedLang] = useState<Language>('java');
  const [code, setCode] = useState(DYNAMIC_PROBLEMS[0]?.starterCode.java || '');
  const [isJudging, setIsJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'marking' | 'terminal'>('marking');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['Staging Environment Online.']);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  // --- 🧪 JAVA HARNESS GENERATOR ---
  const generateJavaHarness = (userCode, problem, lang) => {
    const supportCode = SUPPORT_LIBRARY[problem.supportKey] || "";
    const algoCall = getAlgorithmCall(problem.id);

    // Extraction: Move imports to the very top to satisfy Java compiler
    const importRegex = /^import\s+[\w.]+;|^import\s+[\w.]+\.\*;$/gm;
    const userImports = (userCode.match(importRegex) || []).join('\n');

    let processedUserCode = userCode
      .replace(importRegex, '') 
      .replace(/package\s+[\w.]+;/g, '') 
      .replace(/public\s+class/g, 'class'); 

    return `
// --- 1. IMPORTS ---
import java.util.*;
import java.io.*;
${userImports}

// --- 2. SUPPORT LIBRARY ---
${supportCode}

// --- 3. USER IMPLEMENTATION ---
${processedUserCode}

// --- 4. SOLUTION BRIDGE ---
class Solution {
    public static String execute(String input) {
        try {
            Scanner sc = new Scanner(input.replace(",", " "));
            if(!sc.hasNextInt()) return "ERR_INPUT";
            int numFrames = sc.nextInt();
            String refStr = sc.next();
            Integer[] refs = new Integer[refStr.length()];
            for(int i=0; i<refStr.length(); i++) refs[i] = Character.digit(refStr.charAt(i), 10);

            // Trigger the Dynamic Call
            int faults = ${algoCall}(new Memory(numFrames), refs);
            return "Page faults: " + faults + ".";
        } catch (Exception e) {
            return "RUNTIME_ERROR: " + e.toString();
        }
    }
}

// --- 5. BATCH TEST RUNNER ---
public class Main {
    public static void main(String[] args) {
        String[] inputs = {${problem.testData.map(t => `"${t.input}"`).join(", ")}};
        String[] expected = {${problem.testData.map(t => `"${t.expected}"`).join(", ")}};
        
        for (int i = 0; i < inputs.length; i++) {
            System.out.println("START_TEST_" + (i + 1));
            String result = Solution.execute(inputs[i]);
            System.out.println(result);
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
    if (!response.ok) throw new Error("BRIDGE_FAILURE");
    return await response.json();
  };

  // --- 🚀 MAIN MARKING ENGINE ---
  const runMarking = async (useReference = false) => {
    if (!selectedProblem) return;
    setIsJudging(true);
    setIsOfflineFallback(false);
    setActiveRightTab('marking');
    
    setConsoleLogs(prev => [...prev, `Deploying ${useReference ? 'REFERENCE' : 'EDITOR'} context for ${selectedProblem.id}...`]);

    try {
      let codeToRun = code;
      if (useReference) {
        const res = await fetch(`/scripts/${selectedProblem.id}.java`);
        if (!res.ok) throw new Error("REFERENCE_FILE_NOT_FOUND");
        codeToRun = await res.text();
      }

      const fullScript = generateJavaHarness(codeToRun, selectedProblem, selectedLang);
      const data = await executeJdoodle(fullScript);
      
      const out = data?.output || "";
      if (out.toLowerCase().includes("error")) {
        setTerminalOutput(out.split('\n'));
        throw new Error("VM_COMPILER_ERROR");
      }

      const results = selectedProblem.testData.map((test, i) => {
        const startMarker = `START_TEST_${i + 1}`;
        const endMarker = `END_TEST_${i + 1}`;
        const startIndex = out.indexOf(startMarker);
        const endIndex = out.indexOf(endMarker);
        
        let actual = "Marker Error";
        if (startIndex > -1 && endIndex > -1) {
            actual = out.substring(startIndex + startMarker.length, endIndex).trim();
        }

        const passed = actual.replace(/\r/g, "").trim() === test.expected.trim();
        return { id: i, input: test.input, expected: test.expected, actual, passed };
      });

      setJudgeResult({ score: Math.round((results.filter(r => r.passed).length / results.length) * 100), results });
      setTerminalOutput(out.split('\n'));
      setConsoleLogs(prev => [...prev, `Execution Finished. Stability: ${results.every(r => r.passed) ? 'STABLE' : 'UNSTABLE'}`]);

    } catch (err) {
      setIsOfflineFallback(true);
      setConsoleLogs(prev => [...prev, `⚠️ Error: ${err.message}`]);
    } finally {
      setIsJudging(false);
    }
  };

  // --- 🕹️ HANDLERS ---
  const handleProblemChange = (id: string) => {
    const prob = DYNAMIC_PROBLEMS.find(p => p.id === id);
    if (prob) {
      setSelectedProblem(prob);
      setCode(prob.starterCode[selectedLang]);
      setJudgeResult(null);
      setTerminalOutput([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCode(ev.target?.result as string);
        setConsoleLogs(prev => [...prev, `Context Loaded: ${file.name}`]);
      };
      reader.readAsText(file);
      // FIX: Reset input value so same file can be uploaded again
      e.target.value = '';
    }
  };

  const downloadTestFile = () => {
    if (!selectedProblem) return;
    const content = generateJavaHarness(code, selectedProblem, selectedLang);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProblem.id.toUpperCase()}_tests.java`;
    a.click();
  };

  if (DYNAMIC_PROBLEMS.length === 0) return <div className="p-20 text-white font-black text-center"><AlertTriangle className="mx-auto mb-4" /> No Staging Data Detected in problems_data/</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* 🔐 SETTINGS OVERLAY */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="glass w-full max-w-md p-8 rounded-[3rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <Settings className="text-blue-400 w-8 h-8" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">System Access</h2>
              </div>
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-30 ml-2">JDoodle client_id</label>
                  <input type="text" value={apiKeys.clientId} onChange={(e) => setApiKeys({...apiKeys, clientId: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 font-mono text-sm" placeholder="ID" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-30 ml-2">JDoodle client_secret</label>
                  <input type="password" value={apiKeys.clientSecret} onChange={(e) => setApiKeys({...apiKeys, clientSecret: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 font-mono text-sm" placeholder="SECRET" />
                </div>
                <button onClick={() => { localStorage.setItem('jd_client_id', apiKeys.clientId); localStorage.setItem('jd_client_secret', apiKeys.clientSecret); setShowSettings(false); }} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all">Sync Keys</button>
                <button onClick={() => setShowSettings(false)} className="w-full text-[10px] uppercase font-bold opacity-30 py-2">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 HEADER */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 rounded-[2.5rem] mb-8 flex flex-col lg:flex-row justify-between items-center border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg"><Zap className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Automarker <span className="text-blue-400 not-italic opacity-50">PRO</span></h1>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">Hybrid Logic Staging v3.6</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => setShowSettings(true)} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-500/20 transition-all text-slate-400"><Settings size={18}/></button>
          
          <select value={selectedProblem?.id} onChange={(e) => handleProblemChange(e.target.value)} className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 text-xs font-bold outline-none cursor-pointer">
            {DYNAMIC_PROBLEMS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>

          <select value={activeTheme} onChange={(e) => setActiveTheme(e.target.value)} className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 text-xs font-bold w-40 outline-none">
            {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <button onClick={downloadTestFile} className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 hover:bg-blue-500/20 transition-all"><FileCode size={18}/></button>
        </div>
      </motion.header>

      {/* ⚠️ FALLBACK STATUS */}
      {isOfflineFallback && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 overflow-hidden bg-red-500/10 border border-red-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-red-500">
            <ShieldAlert size={32} />
            <div>
              <h4 className="text-sm font-black uppercase">Remote JVM Execution Blocked</h4>
              <p className="text-[10px] opacity-60 italic mt-1 uppercase tracking-widest">Compiler returned an error or API limits reached.</p>
            </div>
          </div>
          <button onClick={downloadTestFile} className="bg-red-500 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 hover:bg-red-400 transition-all shadow-xl shadow-red-500/20">
            <Terminal size={16} /> Debug Locally
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 📝 WORKSPACE */}
        <section className="glass rounded-[3rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
          <div className="p-5 bg-white/5 border-b border-white/10 flex justify-between items-center px-10">
            <div className="flex gap-2">
              {['java', 'python', 'r'].map(lang => (
                <button key={lang} onClick={() => { setSelectedLang(lang); setCode(selectedProblem.starterCode[lang]); }} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLang === lang ? 'bg-blue-600 shadow-lg' : 'opacity-30 hover:opacity-100'}`}>{lang}</button>
              ))}
            </div>
            <div className="flex items-center gap-4">
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
               <button onClick={() => fileInputRef.current.click()} className="p-2 text-slate-500 hover:text-white transition-all"><Upload size={20}/></button>
               <button onClick={() => setCode(selectedProblem.starterCode[selectedLang])} className="p-2 text-slate-500 hover:text-red-400 transition-all"><RefreshCcw size={20}/></button>
            </div>
          </div>
          <div className="p-10 space-y-6">
            <div className="relative rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 shadow-inner">
              <textarea value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-[520px] p-8 font-mono text-sm bg-transparent text-emerald-400 outline-none scrollbar-hide resize-none leading-relaxed" spellCheck="false" placeholder="// Inject Source Logic..." />
              <div className="absolute top-4 right-8 text-[10px] font-black opacity-10 uppercase tracking-[0.3em] pointer-events-none italic">Cloud-Linked Staging</div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => runMarking(false)} disabled={isJudging} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                {isJudging ? <Loader2 className="animate-spin w-5 h-5" /> : <Play size={18} fill="currentColor" />} 
                {isJudging ? 'Streaming Source...' : `Mark ${selectedProblem?.testCases} Test Units`}
              </button>
              <button onClick={() => runMarking(true)} disabled={isJudging} className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl hover:bg-emerald-500/20 transition-all" title="Validate Reference Logic">
                <Beaker size={22}/>
              </button>
            </div>
          </div>
        </section>

        {/* 📊 RESULTS */}
        <div className="space-y-8">
          <section className="glass rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl h-[680px] flex flex-col">
            <div className="bg-white/5 p-3 flex border-b border-white/10 mx-4 mt-4 rounded-2xl">
              <button onClick={() => setActiveRightTab('marking')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRightTab === 'marking' ? 'bg-white/10 text-blue-400' : 'opacity-20'}`}>Assessment Matrix</button>
              <button onClick={() => setActiveRightTab('terminal')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRightTab === 'terminal' ? 'bg-white/10 text-blue-400' : 'opacity-20'}`}>Virtual Console</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
              <AnimatePresence mode="wait">
                {activeRightTab === 'marking' ? (
                  <motion.div key="marking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {!judgeResult && !isJudging && (
                      <div className="h-[400px] flex flex-col items-center justify-center opacity-10">
                        <Cpu size={70} className="mb-6 stroke-[1.2px]"/>
                        <p className="font-black uppercase tracking-[0.4em] text-[10px]">Awaiting Deployment</p>
                      </div>
                    )}
                    {isJudging && [1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse mb-6 border border-white/5" />)}
                    {judgeResult && judgeResult.results.map((res, i) => (
                      <div key={i} className={`p-6 rounded-[2rem] border ${res.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} mb-6 relative group transition-all`}>
                        <div className="flex justify-between items-center mb-5">
                           <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Unit #{(i+1).toString().padStart(2, '0')}</span>
                             <ChevronRight size={14} className="opacity-10" />
                             <span className="text-[10px] font-mono tracking-tighter opacity-50 italic">IN: {res.input}</span>
                           </div>
                           {res.passed ? <CheckCircle2 className="text-green-500" size={20}/> : <XCircle className="text-red-500" size={20}/>}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <p className="text-[8px] font-black uppercase opacity-20 tracking-widest">Oracle Answer</p>
                             <pre className="text-[10px] opacity-30 bg-black/20 p-4 rounded-2xl whitespace-pre-wrap font-mono border border-white/5">{res.expected}</pre>
                           </div>
                           <div className="space-y-2">
                             <p className="text-[8px] font-black uppercase opacity-20 tracking-widest">Calculated</p>
                             <pre className={`text-[10px] p-4 rounded-2xl whitespace-pre-wrap font-mono border ${res.passed ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{res.actual}</pre>
                           </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[11px] space-y-4">
                    <div className="text-blue-400 opacity-40 mb-8 border-b border-blue-500/20 pb-4 flex items-center justify-between tracking-tighter">
                      <div className="flex items-center gap-3"><Terminal size={18}/> raw_bridge_stdout</div>
                      <div className="text-[9px] font-black px-3 py-1 bg-blue-500/20 rounded-full">JVM_LIVE_STREAM</div>
                    </div>
                    {terminalOutput.length > 0 ? terminalOutput.map((line, i) => (
                      <div key={i} className="text-blue-300/70 border-l-2 border-blue-500/20 pl-6 py-1 italic mb-2 hover:bg-white/5 transition-all">
                         <span className="opacity-10 mr-4 select-none tracking-tighter">{(i+1).toString().padStart(3, '0')}</span>
                         {line}
                      </div>
                    )) : (
                      <div className="h-[400px] flex flex-col items-center justify-center opacity-10 uppercase font-black text-center leading-[3] tracking-widest text-[10px]">
                        <Activity size={40} className="mb-4" /> Diagnostics Buffer Empty
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {judgeResult && (
               <div className="p-8 bg-white/5 border-t border-white/10 flex items-center justify-between mx-6 mb-6 rounded-3xl">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Stability performance index</span>
                  <span className={`text-2xl font-black italic tracking-tighter ${judgeResult.score >= 80 ? 'text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-red-400'}`}>
                    {judgeResult.score}% ACCURACY
                  </span>
               </div>
            )}
          </section>

          {/* 📟 DIAGNOSTICS STREAM */}
          <div className="glass rounded-[2.5rem] p-8 h-[180px] font-mono text-[10px] overflow-y-auto border border-white/10 bg-black/40 scrollbar-hide">
             <div className="opacity-20 uppercase font-black text-[9px] mb-4 flex items-center gap-3 tracking-[0.3em] border-b border-white/5 pb-2"><Activity size={16}/> SYSTEM_KERNEL_LOGS</div>
             {consoleLogs.map((log, i) => (
                <div key={i} className="text-blue-400/50 border-l-2 border-blue-500/10 pl-5 mb-3 flex items-start gap-4 hover:border-blue-400 transition-colors">
                  <span className="opacity-20 shrink-0 select-none">[{i+1}]</span>
                  <span className="leading-relaxed">{log}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}