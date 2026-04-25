import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Terminal, Play, Cpu, Usb, Unplug, Zap, Loader2, Download, 
  HardDrive, Send, Search, Filter, Settings as SettingsIcon, 
  Info as InfoIcon, X, Bug, StepForward, Disc, List, Braces, BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';

const IDE_TEMPLATES = [
  {
    name: 'Blink LED',
    code: `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Blink Initialized");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
  Serial.println("Pulse...");
}`
  },
  {
    name: 'Serial Echo',
    code: `void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for connection
  Serial.println("Echo Terminal Active. Send something!");
}

void loop() {
  if (Serial.available() > 0) {
    String incoming = Serial.readStringUntil('\\n');
    Serial.print("Board received: ");
    Serial.println(incoming);
  }
}`
  },
  {
    name: 'Sensor Simulation',
    code: `float temp = 25.0;
float hum = 60.0;

void setup() {
  Serial.begin(9600);
  Serial.println("Virtual DHT22 Ready");
}

void loop() {
  temp += (random(-10, 10) / 10.0);
  hum += (random(-5, 5) / 10.0);
  
  Serial.print("[INFO] T:");
  Serial.print(temp);
  Serial.print(" H:");
  Serial.println(hum);
  
  delay(2000);
}`
  }
];

const LogList = React.memo(({ filteredOutput, outputEndRef }: { filteredOutput: string[], outputEndRef: any }) => (
  <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed break-all">
    {filteredOutput.length === 0 ? (
      <div className="text-white/20 italic">No logs matching filters</div>
    ) : (
      filteredOutput.map((line, idx) => {
        let colorClass = "text-white/70";
        if (line.includes("[WARN]")) colorClass = "text-yellow-400";
        if (line.includes("[ERROR]")) colorClass = "text-red-400";
        if (line.includes("[INFO]")) colorClass = "text-blue-400";
        if (line.includes("[SUCCESS]")) colorClass = "text-green-400";
        if (line.startsWith("> ")) colorClass = "text-brand-primary/50 italic";
        
        return (
          <div key={idx} className={colorClass}>
            {line}
          </div>
        );
      })
    )}
    <div ref={outputEndRef} />
  </div>
));

const WebIDE = () => {
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [terminalInput, setTerminalInput] = useState('');
  const [lineEnding, setLineEnding] = useState<'none' | 'nl' | 'cr' | 'both'>('nl');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'>('ALL');
  const [isRegex, setIsRegex] = useState(false);
  
  const [showBuildSettings, setShowBuildSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [viewMode, setViewMode] = useState<'monitor' | 'plotter'>('monitor');
  const [plotData, setPlotData] = useState<any[]>([]);
  
  const [isDebugging, setIsDebugging] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [watchedVariables, setWatchedVariables] = useState<{name: string, value: string, type: string}[]>([
    { name: 'LED_STATE', value: 'LOW', type: 'volatile int' },
    { name: 'ITERATION', value: '0', type: 'uint32_t' },
    { name: 'SYSTEM_UPTIME', value: '0ms', type: 'unsigned long' }
  ]);

  const [debugLog, setDebugLog] = useState<{msg: string, time: string}[]>([
    { msg: 'Kernel initialized', time: '00:00:01' },
    { msg: 'Waiting for debugger attach...', time: '00:00:02' }
  ]);

  const [buildFlags, setBuildFlags] = useState({
    optimize: true,
    warnings: 'all',
    debug: false,
    verbose: false,
    targetArch: 'esp32'
  });

  const readerRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  const [compiling, setCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);

  const defaultCode = `void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("System Initialized");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
  Serial.println("Ping...");
}`;

  const [code, setCode] = useState(defaultCode);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  // Support for Web Serial API auto-detection of disconnection and auto-reconnect
  useEffect(() => {
    if (!('serial' in navigator)) return;

    const handleDisconnect = () => {
      setIsConnected(false);
      setPort(null);
      setOutput(prev => [...prev, '\n[WARN] Board disconnected. Attempting auto-reconnect standby...']);
    };

    const handleConnect = async () => {
      setOutput(prev => [...prev, '\n[INFO] Board detected. Attempting auto-reconnect...']);
      autoReconnect();
    };

    const autoReconnect = async () => {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports.length > 0) {
          // Attempt to reconnect to the first authorized port
          const reconnectPort = ports[0];
          await reconnectPort.open({ baudRate });
          setPort(reconnectPort);
          setIsConnected(true);
          setOutput(prev => [...prev, `\n[SUCCESS] Auto-reconnected to board at ${baudRate} baud.`]);
          readFromPort(reconnectPort);
        }
      } catch (err: any) {
        console.error("Auto-reconnect failed:", err);
      }
    };

    (navigator as any).serial.addEventListener('disconnect', handleDisconnect);
    (navigator as any).serial.addEventListener('connect', handleConnect);

    // Initial check for already authorized ports (e.g. on refresh)
    autoReconnect();

    return () => {
      (navigator as any).serial.removeEventListener('disconnect', handleDisconnect);
      (navigator as any).serial.removeEventListener('connect', handleConnect);
    };
  }, [baudRate]);

  const connectBoard = async () => {
    try {
      if (!('serial' in navigator)) {
        alert("Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.");
        return;
      }

      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate });
      
      setPort(selectedPort);
      setIsConnected(true);
      setOutput(prev => [...prev, `\n[INFO] Connected to board at ${baudRate} baud.`]);

      // Start reading loop
      readFromPort(selectedPort);
    } catch (err: any) {
      console.error(err);
      setOutput(prev => [...prev, `\n[ERROR] Connection failed: ${err.message}`]);
    }
  };

  const disconnectBoard = async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
    }
    if (port) {
      await port.close();
      setPort(null);
      setIsConnected(false);
      setOutput(prev => [...prev, '\n[INFO] Disconnected from board.']);
    }
  };

  const readFromPort = async (activePort: any) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = activePort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setOutput(prev => {
            const newOut = [...prev, value];
            if (newOut.length > 100) return newOut.slice(newOut.length - 100);
            return newOut;
          });

          // Parsing Logic for "T:25.5,H:60.2"
          const match = value.match(/T:([\d.]+),H:([\d.]+)/);
          if (match) {
            const newDataPoint = { time: Date.now(), T: parseFloat(match[1]), H: parseFloat(match[2]) };
            setPlotData(prev => {
              const newData = [...prev, newDataPoint];
              if (newData.length > 50) return newData.slice(newData.length - 50);
              return newData;
            });
          }
        }
      }
    } catch (error) {
      console.error("Read error", error);
    } finally {
      reader.releaseLock();
    }
  };

  const handleCompileAndUpload = async () => {
    if (!isConnected) {
      alert("Please connect a board first to upload code.");
      return;
    }
    
    setCompiling(true);
    setCompileProgress(0);
    setOutput(prev => [...prev, '\n[INFO] Initializing compiler...']);

    // Simulate compiling delay
    for (let i = 1; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 100));
      setCompileProgress(i);
      if (i === 30) setOutput(prev => [...prev, '[INFO] Resolving dependencies...']);
      if (i === 60) setOutput(prev => [...prev, '[INFO] Compiling sketch...']);
      if (i === 90) setOutput(prev => [...prev, '[INFO] Generating hex file...']);
    }

    setOutput(prev => [...prev, '[SUCCESS] Compiled successfully. Writing to flash...']);
    
    // Simulate flashing
    await new Promise(r => setTimeout(r, 1500));
    
    setOutput(prev => [...prev, '[SUCCESS] Upload Complete. CPU Reset.']);
    setShowSimulation(true);
    setCompiling(false);
  };

  const toggleBreakpoint = (line: number) => {
    setBreakpoints(prev => 
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    );
    setOutput(prev => [...prev, `\n[DEBUG] ${breakpoints.includes(line) ? 'Breakpoint removed' : 'Breakpoint set'} at line ${line}`]);
  };

  const startDebugging = () => {
    setIsDebugging(true);
    setCurrentLine(13); // Start at setup logic in default code
    setOutput(prev => [...prev, '\n[DEBUG] Debugging session started. System paused at Entry Point.']);
    setDebugLog(prev => [...prev, { msg: 'Debugger attached successfully', time: new Date().toLocaleTimeString() }]);
  };

  const stopDebugging = () => {
    setIsDebugging(false);
    setCurrentLine(null);
    setOutput(prev => [...prev, '\n[DEBUG] Debugging session terminated.']);
  };

  const stepNext = () => {
    if (currentLine === null) return;
    
    // Simple mock stepping logic mapped to default code
    setCurrentLine(prev => {
      const p = prev || 0;
      if (p === 13) return 14;
      if (p === 14) return 15;
      if (p === 15) return 18; // Finish setup, jump to loop block
      if (p === 18) return 19;
      if (p === 19) return 20;
      if (p === 20) return 21;
      if (p === 21) return 22;
      if (p === 22) return 23;
      if (p === 23) return 18; // End of loop, back to start
      return p + 1;
    });

    // Mock variable updates
    if (currentLine === 19) {
      setWatchedVariables(prev => prev.map(v => v.name === 'LED_STATE' ? {...v, value: 'HIGH'} : v));
    } else if (currentLine === 21) {
      setWatchedVariables(prev => prev.map(v => v.name === 'LED_STATE' ? {...v, value: 'LOW'} : v));
    }
    
    setWatchedVariables(prev => {
      return prev.map(v => {
        if (v.name === 'ITERATION') return {...v, value: (parseInt(v.value) + 1).toString()};
        if (v.name === 'SYSTEM_UPTIME') return {...v, value: `${Date.now() % 10000}ms`};
        return v;
      });
    });
  };

  const runToNextBreakpoint = () => {
    if (!isDebugging) return;
    setOutput(prev => [...prev, '\n[DEBUG] Continuing execution...']);
    setTimeout(() => {
      if (breakpoints.length > 0) {
        const nextB = breakpoints.find(b => b > (currentLine || 0)) || breakpoints[0];
        setCurrentLine(nextB);
        setOutput(prev => [...prev, `[DEBUG] Hit breakpoint at line ${nextB}`]);
      } else {
        stepNext();
      }
    }, 500);
  };

  const loadTemplate = (tmpl: any) => {
    if (confirm("Replace current editor content with template?")) {
      setCode(tmpl.code);
      setShowTemplates(false);
    }
  };

  const filteredOutput = useMemo(() => {
    return output.filter(line => {
      // Level filter
      if (filterLevel !== 'ALL' && !line.includes(`[${filterLevel}]`)) return false;
      
      // Keyword filter
      if (filterKeyword) {
        if (isRegex) {
          try {
            return new RegExp(filterKeyword, 'i').test(line);
          } catch (e) {
            return true; // invalid regex, show all
          }
        } else {
          return line.toLowerCase().includes(filterKeyword.toLowerCase());
        }
      }
      return true;
    });
  }, [output, filterKeyword, filterLevel, isRegex]);

  const sendMessage = async () => {
    if (isConnected && port && terminalInput) {
      try {
        let textToSend = terminalInput;
        if (lineEnding === 'nl') textToSend += '\n';
        else if (lineEnding === 'cr') textToSend += '\r';
        else if (lineEnding === 'both') textToSend += '\r\n';

        const writer = port.writable.getWriter();
        const enc = new TextEncoder();
        await writer.write(enc.encode(textToSend));
        writer.releaseLock();
        
        // Local echo
        setOutput(prev => [...prev, `> ${terminalInput}`]);
        setTerminalInput('');
      } catch (err) {
        console.error("Write error", err);
        setOutput(prev => [...prev, `[ERROR] Failed to send: ${err}`]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Top Banner Toolbar */}
      <div className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="text-brand-primary" size={20} />
            <h1 className="text-white font-bold tracking-widest text-sm uppercase">Cloud IDE</h1>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button 
            type="button"
            onClick={handleCompileAndUpload}
            disabled={compiling}
            className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-black transition-all px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {compiling ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {compiling ? 'Compiling...' : 'Compile & Upload'}
          </button>
          <button 
            type="button"
            className="flex items-center gap-2 bg-transparent border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
          >
            <Download size={14} />
            Save Sketch
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button 
            onClick={() => setShowBuildSettings(!showBuildSettings)}
            className={`flex items-center gap-2 transition-all px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${showBuildSettings ? 'bg-brand-primary text-black' : 'bg-transparent border border-white/10 text-white/60 hover:text-white'}`}
          >
            <SettingsIcon size={14} />
            Build Config
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="relative">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className={`flex items-center gap-2 transition-all px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${showTemplates ? 'bg-white text-black' : 'bg-transparent border border-white/10 text-white/60 hover:text-white'}`}
            >
              <Braces size={14} />
              Templates
            </button>
            <AnimatePresence>
              {showTemplates && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 mt-2 w-48 bg-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {IDE_TEMPLATES.map(t => (
                    <button
                      key={t.name}
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      {t.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDebugger(!showDebugger)}
            className={`flex items-center gap-2 transition-all px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${showDebugger ? 'bg-amber-500 text-black' : 'bg-transparent border border-white/10 text-white/60 hover:text-white'}`}
          >
            <Bug size={14} />
            Debugger
          </button>
          <div className="flex items-center gap-3">
             <select 
               value={baudRate}
               onChange={(e) => setBaudRate(Number(e.target.value))}
               disabled={isConnected}
               className="bg-black border border-white/10 text-white/60 text-xs px-3 py-1.5 rounded outline-none focus:border-brand-primary"
             >
                <option value="9600">9600 baud</option>
                <option value="115200">115200 baud</option>
             </select>
             
             {isConnected ? (
               <button 
                 onClick={disconnectBoard}
                 className="flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
               >
                 <Unplug size={14} /> Disconnect
               </button>
             ) : (
               <button 
                 onClick={connectBoard}
                 className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-black px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
               >
                 <Usb size={14} /> Connect Board
               </button>
             )}
          </div>
        </div>
      </div>

      {compiling && (
        <div className="h-1 bg-white/10 w-full relative overflow-hidden">
          <motion.div 
            className="h-full bg-brand-primary"
            initial={{ width: 0 }}
            animate={{ width: `${compileProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Build Settings Sidebar (Drawer) */}
        <AnimatePresence>
          {showBuildSettings && (
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-r border-white/10 z-40 p-8 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-white font-bold uppercase tracking-[0.3em] text-xs">Build Environment</h3>
                <button 
                  onClick={() => setShowBuildSettings(false)}
                  className="text-white/20 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

               <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Board Profiles</label>
                  <select 
                    onChange={(e) => {
                      const profile = e.target.value;
                      if(profile === 'esp32') setBuildFlags({...buildFlags, targetArch: 'esp32', optimize: true});
                      if(profile === 'arduino') setBuildFlags({...buildFlags, targetArch: 'arduino_uno', optimize: false});
                    }}
                    className="w-full bg-black border border-white/10 text-white py-3 px-4 rounded-xl outline-none focus:border-brand-primary"
                  >
                    <option value="">Select a board profile</option>
                    <option value="esp32">ESP32 (Standard)</option>
                    <option value="arduino">Arduino Uno (Basic)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Core Architecture</label>
                  <select 
                    value={buildFlags.targetArch}
                    onChange={(e) => setBuildFlags({...buildFlags, targetArch: e.target.value})}
                    className="w-full bg-black border border-white/10 text-white py-3 px-4 rounded-xl outline-none focus:border-brand-primary"
                  >
                    <option value="esp32">ESP-WROOM-32 (Standard)</option>
                    <option value="esp8266">ESP8266 (Generic)</option>
                    <option value="arduino_uno">AVR ATmega328P (Uno)</option>
                    <option value="rp2040">Raspberry Pi RP2040</option>
                  </select>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Compiler Flags</h4>
                   
                   <div className="flex items-center justify-between group cursor-pointer" onClick={() => setBuildFlags({...buildFlags, optimize: !buildFlags.optimize})}>
                      <div className="flex flex-col">
                        <span className="text-sm text-white/80">Code Optimization</span>
                        <span className="text-[9px] text-white/40">Reduces binary size.</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${buildFlags.optimize ? 'bg-brand-primary' : 'bg-white/10'}`}>
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${buildFlags.optimize ? 'left-6' : 'left-1'}`} />
                      </div>
                   </div>

                   <div className="flex items-center justify-between group cursor-pointer" onClick={() => setBuildFlags({...buildFlags, debug: !buildFlags.debug})}>
                      <div className="flex flex-col">
                        <span className="text-sm text-white/80">Debug Symbols</span>
                        <span className="text-[9px] text-white/40">Retains logic for step-through.</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${buildFlags.debug ? 'bg-brand-primary' : 'bg-white/10'}`}>
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${buildFlags.debug ? 'left-6' : 'left-1'}`} />
                      </div>
                   </div>

                   <div className="flex items-center justify-between group cursor-pointer" onClick={() => setBuildFlags({...buildFlags, verbose: !buildFlags.verbose})}>
                      <div className="flex flex-col">
                        <span className="text-sm text-white/80">Verbose Logging</span>
                        <span className="text-[9px] text-white/40">Shows detailed build steps.</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${buildFlags.verbose ? 'bg-brand-primary' : 'bg-white/10'}`}>
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${buildFlags.verbose ? 'left-6' : 'left-1'}`} />
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-2xl flex gap-4">
                   <InfoIcon size={20} className="text-brand-primary shrink-0" />
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Pro Tip</p>
                      <p className="text-white/40 text-[11px] leading-relaxed">Optimization reduces binary size but may obfuscate stack traces during debug.</p>
                   </div>
                </div>
              </div>

              <div className="mt-auto pt-10 border-t border-white/5 text-[10px] text-white/20 font-mono">
                 Toolchain: GCC v12.1.0-esp-2022r1
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 min-w-0 flex flex-col relative border-r border-white/5">
           {showSimulation && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm p-12 flex flex-col items-center justify-center">
                 <div className="web3-card w-full max-w-2xl border-brand-primary/20 bg-[#0a0a0a] p-10">
                    <div className="flex justify-between items-center mb-10">
                       <h2 className="text-2xl font-black text-white uppercase tracking-widest">Virtual Simulator</h2>
                       <button onClick={() => setShowSimulation(false)} className="text-white/40 hover:text-white"><X /></button>
                    </div>
                    <div className="aspect-video bg-black rounded-2xl flex items-center justify-center border border-white/10 mb-8">
                       <span className="text-brand-primary animate-pulse text-4xl">DEVICE ACTIVE</span>
                    </div>
                    <p className="text-white/60 text-sm italic text-center">Simulated device logic is now running your compiled sketch.</p>
                 </div>
              </div>
           )}
           <div className="h-10 bg-[#1e1e1e] flex items-center px-4 border-b border-black">
              <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded text-xs text-white/50 border border-white/5 border-b-transparent">
                 <HardDrive size={12} />
                 main.ino
              </div>
           </div>
           <div className="flex-1 min-h-0 pt-2 bg-[#1e1e1e]">
              <Editor
                height="100%"
                defaultLanguage="cpp"
                theme="vs-dark"
                value={code}
                onMount={(editor) => {
                  editorRef.current = editor;
                  
                  // Add click listener for breakpoints
                  editor.onMouseDown((e: any) => {
                    if (e.target.type === 2) { // 2 is Gutter
                      const line = e.target.position.lineNumber;
                      toggleBreakpoint(line);
                    }
                  });
                }}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  lineDecorationsWidth: 20,
                  glyphMargin: true,
                  readOnly: isDebugging
                }}
              />
              
              {/* Debug Line Overlay (Simulated) */}
              <AnimatePresence>
                {isDebugging && currentLine !== null && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute left-0 right-0 bg-brand-primary/10 border-y border-brand-primary/30 pointer-events-none z-10"
                    style={{ 
                      top: `${16 + (currentLine - 1) * 19}px`, 
                      height: '19px' 
                    }}
                  >
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-primary rounded-full shadow-[0_0_10px_#10b981]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Breakpoint Dots Overlay */}
              <div className="absolute left-0 top-0 bottom-0 w-[40px] pointer-events-none z-10 overflow-hidden">
                {breakpoints.map(line => (
                  <div 
                    key={line}
                    className="absolute left-2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ top: `${16 + (line - 1) * 19 + 3}px` }}
                  />
                ))}
              </div>
           </div>
        </div>

        {/* Serial Terminal / Debugger Area */}
        <div className="w-full md:w-[400px] h-[300px] md:h-full flex flex-col bg-black">
           {showDebugger ? (
             <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-white/5">
                {/* Debugger Header & Controls */}
                <div className="shrink-0 p-5 bg-[#0d0d0d] border-b border-white/5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                         <Bug size={14} />
                         Cortex Execution Engine
                      </div>
                      <div className="text-[10px] text-white/30 font-medium uppercase tracking-widest mt-1">PID: 8842 // HEX: 0x4F</div>
                    </div>
                    {isDebugging && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20"
                      >
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                         <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Active</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {!isDebugging ? (
                      <button 
                        onClick={startDebugging}
                        className="col-span-2 flex items-center justify-center gap-3 bg-amber-500 text-black py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] group"
                      >
                        <Play size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        Attach Debugger
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={stepNext}
                          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/90 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:border-white transition-all"
                        >
                          <StepForward size={14} />
                          Step Next
                        </button>
                        <button 
                          onClick={runToNextBreakpoint}
                          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-brand-primary py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:border-brand-primary/40 transition-all"
                        >
                          <Play size={14} fill="currentColor" />
                          Resume
                        </button>
                        <button 
                          onClick={stopDebugging}
                          className="col-span-2 flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                          <X size={14} />
                          Terminate Session
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                   {/* Sections with high visual hierarchy */}
                   
                   {/* Call Stack Module */}
                   <div className="border-b border-white/5">
                      <div className="px-6 py-4 flex items-center justify-between bg-white/[0.01]">
                         <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                            <List size={12} className="text-amber-500/50" /> Call Stack
                         </h4>
                         <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-white/20 font-mono">Depth: {isDebugging ? '2' : '0'}</span>
                      </div>
                      <div className="p-4 space-y-1">
                        {isDebugging ? (
                          <>
                            <div className="relative pl-6 pb-2">
                               <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 to-transparent" />
                               <div className="p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 flex justify-between items-center group hover:border-amber-500/40 transition-all cursor-crosshair">
                                  <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                     <span className="text-white text-xs font-bold font-mono">{(currentLine || 0) > 108 ? 'loop()' : 'setup()'}</span>
                                  </div>
                                  <span className="text-amber-500/40 font-mono text-[9px] font-bold">L:{currentLine}</span>
                               </div>
                            </div>
                            <div className="relative pl-6">
                               <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center opacity-40 hover:opacity-100 transition-all">
                                  <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full bg-white/20" />
                                     <span className="text-white text-xs font-medium font-mono">main()</span>
                                  </div>
                                  <span className="text-white/20 font-mono text-[9px]">0x0040</span>
                               </div>
                            </div>
                          </>
                        ) : (
                          <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                             <p className="text-[10px] text-white/10 uppercase font-black tracking-widest italic">Awaiting Attachment...</p>
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Variables Module */}
                   <div className="border-b border-white/5">
                      <div className="px-6 py-4 flex items-center justify-between bg-white/[0.01]">
                         <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Braces size={12} className="text-brand-primary" /> Global Watch
                         </h4>
                         <div className="flex items-center gap-2">
                           <button className="p-1 px-2 rounded-md hover:bg-white/5 text-[9px] text-brand-primary font-black uppercase tracking-widest transition-colors">+ Watch</button>
                         </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 gap-1">
                          {watchedVariables.map(v => (
                            <div key={v.name} className="group relative flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-brand-primary/20 rounded-xl transition-all">
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-white/80 font-mono font-bold group-hover:text-brand-primary transition-colors">{v.name}</span>
                                  <span className="text-[8px] text-white/20 font-mono font-medium uppercase tracking-tighter">{v.type}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="px-3 py-1.5 bg-black border border-white/10 rounded-lg text-brand-primary font-mono text-[11px] font-black shadow-inner">
                                    {v.value}
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>

                   {/* Breakpoints Module */}
                   <div>
                      <div className="px-6 py-4 flex items-center justify-between bg-white/[0.01]">
                         <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Disc size={12} className="text-red-500" /> Control Stops
                         </h4>
                         <span className="text-[9px] text-white/10 font-bold uppercase">{breakpoints.length} ACTIVE</span>
                      </div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {breakpoints.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-6 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                               <Disc size={20} className="text-white/5 mb-4" />
                               <span className="text-white/10 text-[9px] uppercase font-black tracking-[0.2em] text-center max-w-[150px]">Mark code lines in the gutter to initialize stops</span>
                            </div>
                          ) : (
                            breakpoints.map(line => (
                              <div key={line} className="flex items-center justify-between p-4 bg-red-500/[0.02] border border-red-500/10 rounded-xl group transition-all hover:bg-red-500/[0.05]">
                                 <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                                    <div className="flex flex-col">
                                       <span className="text-white/80 text-[11px] font-mono font-bold leading-none mb-1">main.ino</span>
                                       <span className="text-white/20 text-[9px] font-mono leading-none">Line {line}</span>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => toggleBreakpoint(line)}
                                   className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                   </div>
                </div>

                {/* AI Hardware Advisor Footer */}
                <div className="shrink-0 p-6 bg-black border-t border-brand-primary/20 relative group">
                   <div className="absolute -top-px left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center text-black shrink-0 relative overflow-hidden">
                         <Zap size={20} fill="currentColor" />
                         <div className="absolute top-0 right-0 p-0.5 bg-white">
                            <div className="text-[6px] font-black text-black">A.I</div>
                         </div>
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center justify-between">
                            <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">Neural Trace Advisor</h5>
                            <button className="text-[8px] text-white/20 uppercase hover:text-white transition-colors">Expand Insignt</button>
                         </div>
                         <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                            <p className="text-white/70 text-[10px] leading-relaxed font-medium">
                               {isDebugging 
                                 ? `Real-time validation confirmed. Execution Flow 0xBA. The firmware is currently operational with ${watchedVariables.length} tracked variables.` 
                                 : "Awaiting attachment. I will analyze instruction pointers for logic errors and suggest physical hardware optimizations."
                               }
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="flex flex-col h-full">
                <div className="h-fit border-b border-white/5 flex flex-col px-4 py-2 bg-white/[0.02] gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest pl-2">
                       <Zap size={14} className={isConnected ? "text-green-400" : ""} />
                       {viewMode === 'monitor' ? 'Serial Monitor' : 'Real-time Plotter'}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setViewMode('monitor')}
                        className={`p-1.5 rounded-lg ${viewMode === 'monitor' ? 'bg-white/10 text-white' : 'text-white/30'}`}
                      >
                        <Terminal size={12} />
                      </button>
                      <button 
                        onClick={() => setViewMode('plotter')}
                        className={`p-1.5 rounded-lg ${viewMode === 'plotter' ? 'bg-white/10 text-white' : 'text-white/30'}`}
                      >
                        <BarChart3 size={12} />
                      </button>
                    </div>
                    <button 
                      onClick={() => setOutput([])}
                      className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" />
                      <input 
                        type="text"
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        placeholder={isRegex ? "Regex Pattern..." : "Filter..."}
                        className="w-full bg-black/40 border border-white/5 rounded pl-7 pr-2 py-1 text-[10px] text-white/60 focus:border-brand-primary outline-none transition-colors"
                      />
                      <button 
                        onClick={() => setIsRegex(!isRegex)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 text-[8px] px-1 rounded ${isRegex ? 'bg-brand-primary text-black' : 'text-white/20 hover:text-white'}`}
                      >
                        .*
                      </button>
                    </div>
                    <select 
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as any)}
                      className="bg-black/40 border border-white/5 text-white/40 text-[9px] px-2 py-1 rounded outline-none focus:border-brand-primary uppercase font-bold"
                    >
                      <option value="ALL">ALL Logs</option>
                      <option value="INFO">INFO</option>
                      <option value="WARN">WARN</option>
                      <option value="ERROR">ERROR</option>
                      <option value="SUCCESS">SUCCESS</option>
                    </select>
                  </div>
                </div>
                
{viewMode === 'monitor' ? (
                  <LogList filteredOutput={filteredOutput} outputEndRef={outputEndRef} />
                ) : (
                  <div className="flex-1 p-6 relative">
                    {plotData.length === 0 ? (
                      <div className="text-white/20 italic text-center mt-20">Waiting for T/H data...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={plotData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="time" tick={false} stroke="#555" />
                          <YAxis stroke="#555" />
                          <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                          <Line type="monotone" dataKey="T" stroke="#ef4444" dot={false} strokeWidth={2} />
                          <Line type="monotone" dataKey="H" stroke="#3b82f6" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {viewMode === 'monitor' && (
                  <div className="p-3 border-t border-white/5 bg-white/[0.02] space-y-3">
                    <div className="flex gap-2">
                      <select 
                        value={lineEnding}
                        onChange={(e) => setLineEnding(e.target.value as any)}
                        className="bg-black border border-white/10 text-white/40 text-[10px] px-2 py-1 rounded outline-none focus:border-brand-primary uppercase font-bold"
                      >
                        <option value="none">No Line Ending</option>
                        <option value="nl">Newline (NL)</option>
                        <option value="cr">Carriage Return (CR)</option>
                        <option value="both">Both (NL & CR)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder={isConnected ? "Type message to send..." : "Connect board to interact"}
                        disabled={!isConnected}
                        className="flex-1 bg-black border border-white/10 rounded px-4 py-2 text-xs text-white/80 focus:border-brand-primary outline-none disabled:opacity-50"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!isConnected || !terminalInput}
                        className="bg-brand-primary text-black p-2 rounded hover:bg-white transition-all disabled:opacity-50 disabled:grayscale"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default WebIDE;
