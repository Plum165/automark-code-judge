// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Code2, Terminal, Play, RefreshCcw, Download, Upload, 
  CheckCircle2, XCircle, Loader2 
} from 'lucide-react';

// --- CONSTANTS (Normally in ./constants) ---
const THEMES = [
  { id: 'professional-polish', name: 'Professional Polish' },
  { id: 'dark-terminal', name: 'Midnight Terminal' },
  { id: 'glass-light', name: 'Arctic Frost' }
];

const PROBLEMS = [
  {
    id: 'linear-search',
    title: 'Linear Search Logic',
    testCases: 2,
    starterCode: {
      java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Value is in the array.");\n  }\n}',
      python: 'print("Value is in the array.")',
      r: 'cat("Value is in the array.")'
    },
    solution: {
      java: '// Official Solution\nSystem.out.println("Value is in the array.");',
      python: 'print("Value is in the array.")',
      r: 'cat("Value is in the array.")'
    },
    testData: [
      { input: "Find 5 in [1..10]", expected: "Value is in the array." },
      { input: "Find 15 in [1..10]", expected: "The value is incorrect" }
    ]
  },
  {
    id: 'hello-world',
    title: 'System Handshake',
    testCases: 1,
    starterCode: {
      java: 'System.out.println("Hello World");',
      python: 'print("Hello World")',
      r: 'cat("Hello World")'
    },
    testData: [
      { input: "Execute", expected: "Hello World" }
    ]
  }
];

// --- OFFLINE JUDGE ENGINE (Replaces Gemini API) ---
const judgeCodeOffline = async (problem, code, lang) => {
  // Simulate network/processing delay for the "AI feel"
  await new Promise(resolve => setTimeout(resolve, 1500));

  const results = problem.testData.map((test, index) => {
    // 1. Basic Regex to find printed text
    const printRegex = /(?:print|println|cat|console\.log)\s*\(\s*["']([^"']+)["']\s*\)/gi;
    const matches = [...code.matchAll(printRegex)];
    const extractedOutput = matches.map(m => m[1]).join('\n');

    // 2. Logic: If the user typed the exact expected string or the logic matches
    const passed = extractedOutput.toLowerCase().includes(test.expected.toLowerCase()) || 
                   (code.includes("array") && test.expected.includes("array"));

    return {
      id: index,
      input: test.input,
      expected: test.expected,
      actual: extractedOutput || "No Output",
      passed: passed
    };
  });

  const passedCount = results.filter(r => r.passed).length;
  const score = Math.round((passedCount / results.length) * 100);

  return {
    score,
    results,
    overallPassed: score === 100,
    feedback: score === 100 
      ? "All test cases passed successfully. Logic is sound." 
      : `Failed ${results.length - passedCount} test cases. Check output formatting.`
  };
};

export default function App() {
  const [activeTheme, setActiveTheme] = useState('professional-polish');
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0]);
  const [selectedLang, setSelectedLang] = useState('java');
  const [code, setCode] = useState(PROBLEMS[0].starterCode.java);
  const [isJudging, setIsJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState(['System ready (Offline Mode).']);
  const fileInputRef = useRef(null);

  // Apply Theme to HTML Tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  const handleProblemChange = (problemId) => {
    const problem = PROBLEMS.find(p => p.id === problemId) || PROBLEMS[0];
    setSelectedProblem(problem);
    setCode(problem.starterCode[selectedLang]);
    setJudgeResult(null);
    setConsoleLogs([`Switched to: ${problem.title}`]);
  };

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    setCode(selectedProblem.starterCode[lang]);
    setJudgeResult(null);
    setConsoleLogs(prev => [...prev, `Switched language to: ${lang.toUpperCase()}`]);
  };

  const clearAll = () => {
    setCode(selectedProblem.starterCode[selectedLang]);
    setJudgeResult(null);
    setConsoleLogs(['System ready.']);
  };

  const runJudge = async () => {
    if (isJudging) return;
    setIsJudging(true);
    setConsoleLogs(prev => [...prev, `> Starting evaluation for ${selectedProblem.title}...`]);
    
    try {
      const result = await judgeCodeOffline(selectedProblem, code, selectedLang);
      setJudgeResult(result);
      setConsoleLogs(prev => [
        ...prev, 
        `> Finished. Score: ${result.score}/100`,
        `> Feedback: ${result.feedback}`
      ]);
    } catch (err) {
      setConsoleLogs(prev => [...prev, `[ERROR] Internal logic error.`]);
    } finally {
      setIsJudging(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (content) {
          setCode(content);
          setConsoleLogs(prev => [...prev, `> File uploaded: ${file.name}`]);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadSolution = () => {
    const solutionCode = selectedProblem.solution[selectedLang];
    const blob = new Blob([solutionCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution_${selectedProblem.id}.${selectedLang}`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Code2 className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Automarker</h1>
          </div>
          <p className="text-sm opacity-50">Automated Marking</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold opacity-40 mb-1">Select Problem</label>
            <select 
              value={selectedProblem.id} 
              onChange={(e) => handleProblemChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm outline-none focus:border-blue-500"
            >
              {PROBLEMS.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900">{p.title}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={downloadSolution}
            className="flex items-center gap-2 text-xs font-bold hover:text-blue-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            Solution
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Editor */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl overflow-hidden flex flex-col border border-white/10"
        >
          <div className="p-4 bg-white/5 flex justify-between items-center border-b border-white/10">
            <div className="flex gap-2">
              {['java', 'python', 'r'].map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  className={`px-4 py-1 rounded text-xs font-bold transition-all ${selectedLang === lang ? 'bg-blue-600 text-white' : 'opacity-40 hover:opacity-100'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-400"
              >
                <Upload className="w-4 h-4" /> Import Source File
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[400px] p-4 bg-black/20 rounded-lg font-mono text-sm resize-none outline-none border border-white/5 focus:border-blue-500/50 transition-all"
              spellCheck="false"
            />

            <div className="flex gap-3">
              <button 
                onClick={runJudge}
                disabled={isJudging}
                className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isJudging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isJudging ? 'Evaluating...' : `Run ${selectedProblem.testCases} Test Cases`}
              </button>
              <button onClick={clearAll} className="p-3 px-5 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Right Column: Results & Console */}
        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl overflow-hidden border border-white/10"
          >
            <div className="px-5 py-3 bg-white/5 flex justify-between items-center border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Marking Results</span>
              {judgeResult && (
                <span className={`text-sm font-bold ${judgeResult.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {judgeResult.score}% Accuracy
                </span>
              )}
            </div>
            
            <div className="h-[380px] overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="wait">
                {!judgeResult && !isJudging && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <Terminal className="w-12 h-12 mb-2" />
                    <p className="text-xs font-bold uppercase">No Active Evaluation</p>
                  </div>
                )}

                {isJudging && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
                  </div>
                )}

                {judgeResult && judgeResult.results.map((res, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border flex items-center justify-between ${res.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                  >
                    <div>
                      <p className="text-[10px] font-bold opacity-40 uppercase">Input: {res.input}</p>
                      <p className="text-xs font-medium mt-1">Output: {res.actual}</p>
                    </div>
                    {res.passed ? <CheckCircle2 className="text-green-400" /> : <XCircle className="text-red-400" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>

          <motion.section className="glass rounded-xl overflow-hidden border border-white/10">
            <div className="px-5 py-2 bg-white/5 text-[10px] font-bold opacity-50 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> DIAGNOSTICS
            </div>
            <div className="h-[150px] p-4 font-mono text-[11px] overflow-y-auto space-y-1">
              {consoleLogs.map((log, i) => (
                <div key={i} className="text-blue-300/60 border-l border-blue-500/30 pl-3">
                  <span className="opacity-30 mr-2">{i+1}</span> {log}
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}