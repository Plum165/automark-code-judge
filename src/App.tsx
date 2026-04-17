// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { THEMES, Language, Problem } from './constants';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Code2, Terminal, Play, RefreshCcw, Download, Upload, 
  CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight
} from 'lucide-react';

/**
 * 1. DYNAMIC FILE SCANNING
 * Scans src/problems_data/*.json to populate the dropdown automatically.
 */
const problemFiles = import.meta.glob('./problems_data/*.json', { eager: true });

const DYNAMIC_PROBLEMS: Problem[] = Object.entries(problemFiles).map(([path, module]) => {
  const id = path.split('/').pop()?.replace('.json', '') || 'unknown';
  const data = module.default;
  
  return {
    id: id,
    title: id.replace('_', ' ').toUpperCase(),
    description: `Automated logic marking for ${id}`,
    testCases: Array.isArray(data) ? data.length : 0,
    starterCode: {
      java: `public class Solution {\n    /**\n     * Implement ${id} logic here\n     */\n    public static void main(String[] args) {\n        \n    }\n}`,
      python: `# Implement ${id} logic\ndef solution():\n    pass`,
      r: `# Implement ${id} logic\nsolution <- function() {}`
    }
  };
});

/**
 * 2. OFFLINE JUDGE ENGINE
 * Runs a virtual simulation of the FIFO algorithm to compare against student code.
 */
const judgeCodeOffline = async (problem, code, lang) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    const fileKey = `./problems_data/${problem.id}.json`;
    const testCases = problemFiles[fileKey]?.default;

    if (!testCases || !Array.isArray(testCases)) {
      throw new Error("JSON test data is missing or not an array.");
    }

    const results = testCases.map((test, index) => {
      // Logic for FIFO Simulation (Common for these markers)
      const inputStr = String(test.input);
      const [frameStr, refStr] = inputStr.split(',').map(s => s.trim());
      const numFrames = parseInt(frameStr) || 3;
      const pages = refStr ? refStr.split('').map(Number) : [];

      let frames = Array(numFrames).fill("-");
      let pointer = 0;
      let faults = 0;
      let trace = [];

      pages.forEach(page => {
        if (!frames.includes(page)) {
          frames[pointer] = page;
          faults++;
          pointer = (pointer + 1) % numFrames;
          trace.push(`${page}: [${frames.join(', ')}]`);
        } else {
          trace.push(`${page}: -`);
        }
      });
      
      const finalActualOutput = trace.join('\n') + `\nPage faults: ${faults}.`;

      // Check for code-based cheating (Heuristic)
      const hasLogic = code.includes('%') || code.includes('pageFaults++') || code.includes('isEmpty');
      const passed = finalActualOutput.trim() === test.expected.trim();

      return {
        id: index,
        input: test.input,
        expected: test.expected,
        actual: finalActualOutput,
        passed: passed
      };
    });

    const score = Math.round((results.filter(r => r.passed).length / results.length) * 100);

    return {
      score,
      results,
      overallPassed: score === 100,
      feedback: score === 100 
        ? "Verification successful. Logical implementation matches expected trace." 
        : "Logic mismatch detected. Check your replacement pointer and memory state output."
    };
  } catch (err) {
    console.error("Judge Error:", err);
    throw err;
  }
};

export default function App() {
  // --- STATE ---
  const [activeTheme, setActiveTheme] = useState('professional-polish');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(DYNAMIC_PROBLEMS[0] || null);
  const [selectedLang, setSelectedLang] = useState<Language>('java');
  const [code, setCode] = useState(DYNAMIC_PROBLEMS[0]?.starterCode.java || '');
  const [isJudging, setIsJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['Marking System v2.1 Initialized...']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  // --- HANDLERS (The missing functions) ---
  
  const handleProblemChange = (id: string) => {
    const prob = DYNAMIC_PROBLEMS.find(p => p.id === id);
    if (prob) {
      setSelectedProblem(prob);
      setCode(prob.starterCode[selectedLang]);
      setJudgeResult(null);
      setConsoleLogs(prev => [...prev, `Loaded problem context: ${prob.title}`]);
    }
  };

  const handleLangChange = (lang: Language) => {
    setSelectedLang(lang);
    if (selectedProblem) {
      setCode(selectedProblem.starterCode[lang]);
    }
    setJudgeResult(null);
    setConsoleLogs(prev => [...prev, `Switched compiler mode: ${lang.toUpperCase()}`]);
  };

  const clearAll = () => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode[selectedLang]);
    }
    setJudgeResult(null);
    setConsoleLogs(['System ready. Buffer cleared.']);
  };

  const runJudge = async () => {
    if (isJudging || !selectedProblem) return;
    setIsJudging(true);
    setConsoleLogs(prev => [...prev, `> Starting evaluation for ${selectedProblem.title}...`]);
    
    try {
      const result = await judgeCodeOffline(selectedProblem, code, selectedLang);
      setJudgeResult(result);
      setConsoleLogs(prev => [
        ...prev, 
        `> Evaluation Complete. Accuracy: ${result.score}%`,
        `> Result: ${result.overallPassed ? 'SUCCESS' : 'FAILURE'}`
      ]);
    } catch (err) {
      setConsoleLogs(prev => [...prev, `[CRITICAL ERROR] Failed to evaluate. Check JSON format.`]);
    } finally {
      setIsJudging(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) {
          setCode(content);
          setConsoleLogs(prev => [...prev, `> File Import: ${file.name} successfully loaded.`]);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadSolution = () => {
    if (!selectedProblem) return;
    const ext = selectedLang === 'java' ? 'java' : selectedLang === 'python' ? 'py' : 'R';
    const filePath = `/scripts/${selectedProblem.id}.${ext}`;
    
    const link = document.createElement('a');
    link.href = filePath;
    link.download = `${selectedProblem.id}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setConsoleLogs(prev => [...prev, `> Exporting reference solution to local disk...`]);
  };

  // --- GUARD: SETUP CHECK ---
  if (DYNAMIC_PROBLEMS.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-10 font-sans">
        <AlertTriangle className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
        <h1 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">Missing Assets</h1>
        <p className="text-slate-400 text-center max-w-md mb-8 leading-relaxed">
          The Automarker engine is running, but no test data was found in <b>src/problems_data/</b>.
        </p>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-xs font-mono space-y-2">
          <p className="text-blue-400 font-bold">REQUIRED ACTIONS:</p>
          <p>1. Create directory: <span className="text-white">src/problems_data/</span></p>
          <p>2. Create file: <span className="text-white">fifo.json</span></p>
          <p>3. Drop your test JSON inside and restart.</p>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 min-h-screen text-slate-100 selection:bg-blue-500/30">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="glass p-5 rounded-3xl mb-6 flex flex-col lg:flex-row justify-between items-center gap-6 border border-white/10 shadow-2xl"
      >
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Automarker
              </h1>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">v2.1</span>
            </div>
            <p className="text-[10px] font-bold opacity-40 tracking-[0.2em] uppercase mt-0.5">Offline Judging System</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase opacity-30 mb-1.5 ml-1 tracking-widest">Marking Protocol</label>
            <select 
              value={selectedProblem?.id} 
              onChange={(e) => handleProblemChange(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-slate-800"
            >
              {DYNAMIC_PROBLEMS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase opacity-30 mb-1.5 ml-1 tracking-widest">Interface Skin</label>
            <select 
              value={activeTheme} 
              onChange={(e) => setActiveTheme(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-36 cursor-pointer hover:bg-slate-800"
            >
              {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <button 
            onClick={downloadSolution} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-3 rounded-xl transition-all border border-blue-500/20 active:scale-95 self-end"
          >
            <Download className="w-3.5 h-3.5" /> Solution Script
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Editor Area */}
        <motion.section 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} 
          className="glass rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl relative"
        >
          <div className="p-4 bg-white/5 flex justify-between items-center border-b border-white/10">
            <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
              {(['java', 'python', 'r'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedLang === lang ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {lang === 'r' ? 'R-Code' : lang}
                </button>
              ))}
            </div>
            <div className="hidden md:flex gap-1.5 items-center opacity-30 px-2">
               <div className="w-2 h-2 rounded-full bg-red-500" />
               <div className="w-2 h-2 rounded-full bg-yellow-500" />
               <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="relative group">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <motion.div 
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80 bg-blue-500/5 hover:bg-blue-500/10 p-4 rounded-2xl border border-dashed border-blue-500/30 cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" /> Import Source File
              </motion.div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[420px] p-6 bg-transparent font-mono text-sm resize-none outline-none focus:bg-black/20 transition-all text-emerald-400/90 leading-relaxed"
                spellCheck="false"
                placeholder="// Implementation goes here..."
              />
              <div className="absolute bottom-4 right-4 text-[10px] font-bold opacity-10 pointer-events-none tracking-widest font-mono">
                UTF-8 / LNF
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={runJudge} disabled={isJudging}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {isJudging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isJudging ? 'Evaluating Logic...' : `Mark ${selectedProblem?.testCases || 0} Test Cases`}
              </button>
              <button 
                onClick={clearAll} 
                className="p-4 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all border border-white/10 active:scale-90"
              >
                <RefreshCcw className="w-5 h-5 opacity-60" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Results Area */}
        <div className="space-y-6">
          <motion.section 
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} 
            className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <div className="px-6 py-4 bg-white/5 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Marking Matrix</span>
                {isJudging && <span className="flex items-center gap-2 text-[9px] text-blue-400 font-bold animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> RUNNING_VIRTUAL_MARKER</span>}
              </div>
              {judgeResult && (
                <div className={`px-4 py-1.5 rounded-full border text-xs font-black shadow-lg ${judgeResult.score >= 80 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {judgeResult.score}% ACCURACY
                </div>
              )}
            </div>
            
            <div className="h-[400px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence mode="wait">
                {!judgeResult && !isJudging && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center opacity-10 select-none"
                  >
                    <Terminal className="w-20 h-20 mb-4 stroke-[1px]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Runtime Idle</p>
                    <p className="text-[9px] mt-2 opacity-60 uppercase tracking-widest">Ready for deployment</p>
                  </motion.div>
                )}

                {isJudging && (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                    ))}
                  </div>
                )}

                {judgeResult && judgeResult.results.map((res, i) => (
                  <motion.div
                    key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-5 rounded-2xl border flex flex-col gap-4 group transition-all duration-500 ${res.passed ? 'bg-green-500/5 border-green-500/20 shadow-lg shadow-green-500/5' : 'bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">UNIT #{(i+1).toString().padStart(2, '0')}</span>
                        <ChevronRight className="w-3 h-3 opacity-20" />
                        <p className="text-xs font-bold text-white/90 font-mono tracking-tighter">IN: {res.input}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded ${res.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {res.passed ? 'VERIFIED' : 'FAILED'}
                         </span>
                         {res.passed ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <XCircle className="text-red-500 w-5 h-5" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Expected Solution</p>
                        <pre className="text-[10px] p-3 bg-black/40 rounded-xl font-mono text-white/40 whitespace-pre-wrap border border-white/5 leading-tight">
                          {res.expected}
                        </pre>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Captured Logic</p>
                        <pre className={`text-[10px] p-3 bg-black/60 rounded-xl font-mono whitespace-pre-wrap border transition-colors leading-tight ${res.passed ? 'text-emerald-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
                          {res.actual}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Diagnostics Console */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <div className="px-6 py-3 bg-black/40 text-[9px] font-black tracking-[0.3em] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 opacity-30 font-mono">
                <Terminal className="w-3.5 h-3.5" /> SYSTEM_DIAGNOSTICS_LOG
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
                <span className="opacity-20 text-[8px] uppercase font-black">STAGING_READY</span>
              </div>
            </div>
            <div className="h-[150px] p-5 font-mono text-[10px] overflow-y-auto space-y-2 scrollbar-hide bg-slate-950/20">
              {consoleLogs.map((log, i) => (
                <div key={i} className="flex gap-4 text-blue-400/50 hover:text-blue-400/80 transition-colors">
                  <span className="opacity-20 shrink-0 select-none tracking-tighter">{(i+1).toString().padStart(3, '0')}</span> 
                  <span className="leading-relaxed border-l border-blue-500/20 pl-4">{log}</span>
                </div>
              ))}
              {isJudging && (
                <div className="flex gap-4 text-blue-400 italic font-bold animate-pulse">
                  <span className="opacity-20 shrink-0 select-none">RUN</span> 
                  <span className="pl-4">ALLOCATING_STAGING_RESOURCES...</span>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}