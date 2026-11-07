import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Smartphone, Layers, History, PlusCircle, Search, 
  Filter, Download, CheckCircle2, AlertTriangle, Ban, RefreshCw, 
  ExternalLink, ChevronRight, ChevronLeft, Upload, 
  Sparkles, Terminal, Check, X, Settings, FileSpreadsheet, Globe, Info, Radio, Code
} from 'lucide-react';

// URL OFICIAL DO GOOGLE APPS SCRIPT
const GOOGLE_SHEETS_URL = '[https://script.google.com/macros/s/AKfycbz01YeFqOpWZI1qbI7-4WfRXUldwi7smPhwMXwrk6O_lU5h_Yyl9n4Ucu6N1vOV9zs/exec](https://script.google.com/macros/s/AKfycbz01YeFqOpWZI1qbI7-4WfRXUldwi7smPhwMXwrk6O_lU5h_Yyl9n4Ucu6N1vOV9zs/exec)';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appsList, setAppsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
    clubName: '', appName: '', internalId: '', url: '', logoBase64: '', originalImageSizeKB: 0, optimizedImageSizeKB: 0
  });

  const fileInputRef = useRef(null);
  const [isProcessingCanvas, setIsProcessingCanvas] = useState(false);
  const [buildLogs, setBuildLogs] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildFinished, setBuildFinished] = useState(false);
  const [generatedAppId, setGeneratedAppId] = useState(null);

  const addLog = (appName, action, details) => {
    setAuditLogs(prev => [{ id: `log-${Date.now()}`, timestamp: new Date().toISOString(), appName, action, details }, ...prev]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const originalKB = (file.size / 1024).toFixed(1);
    setIsProcessingCanvas(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 512);
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 512, 512);
        const compressedBase64 = canvas.toDataURL('image/webp', 0.85);
        const base64Length = compressedBase64.length - (compressedBase64.indexOf(',') + 1);
        const optimizedKB = ((base64Length * 3 / 4) / 1024).toFixed(1);
        setFormData(prev => ({ ...prev, logoBase64: compressedBase64, originalImageSizeKB: originalKB, optimizedImageSizeKB: optimizedKB }));
        setIsProcessingCanvas(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const startApkBuildProcess = () => {
    setIsBuilding(true);
    setBuildFinished(false);
    setBuildLogs([]);

    const steps = [
      { text: "Iniciando processo de geração de APK...", delay: 400 },
      { text: "Enviando dados para o Google Sheets e GitHub Actions...", delay: 1500 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setBuildLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.text}`]);
        if (index === steps.length - 1) {
          fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appId: formData.internalId,
              clubName: formData.clubName,
              appName: formData.appName,
              clubUrl: formData.url,
              logoBase64: formData.logoBase64
            })
          }).then(() => {
            setBuildLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SUCESSO! Ordem enviada ao GitHub Actions. O APK está sendo compilado nos servidores.`]);
            
            setIsBuilding(false);
            setBuildFinished(true);
            const newId = formData.internalId;
            const newApp = {
              id: newId, clubName: formData.clubName, appName: formData.appName, internalId: formData.internalId,
              url: formData.url, logoBase64: formData.logoBase64, status: 'ATIVO', version: '1.0.0',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              statusMessage: 'Aplicação operando normalmente.', originalImageSizeKB: formData.originalImageSizeKB, optimizedImageSizeKB: formData.optimizedImageSizeKB
            };
            setAppsList(prev => [newApp, ...prev]);
            setGeneratedAppId(newId);
            addLog(formData.appName, 'Criação de APK', `Novo aplicativo enviado para compilação. ID: ${newId}`);
          }).catch(err => {
            setBuildLogs(prev => [...prev, `[ERRO] Falha ao conectar com o servidor central.`]);
            setIsBuilding(false);
          });
        }
      }, step.delay);
    });
  };

  const filteredApps = appsList.filter(app => {
    const matchesSearch = app.clubName.toLowerCase().includes(searchTerm.toLowerCase()) || app.appName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="font-bold text-base leading-none text-white tracking-wide">SPORTECH</h1>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Gerador Central</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <Layers className="w-4 h-4"/> <span>Início (Dashboard)</span>
            </button>
            <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'library' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <Smartphone className="w-4 h-4"/> <span>Biblioteca de Apps</span>
              <span className="ml-auto bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{appsList.length}</span>
            </button>
            <button onClick={() => { setActiveTab('wizard'); setWizardStep(1); setBuildFinished(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'wizard' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <PlusCircle className="w-4 h-4 text-emerald-400"/> <span className="text-emerald-400 font-semibold">Criar Novo Aplicativo</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              <History className="w-4 h-4"/> <span>Histórico de Ações</span>
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
          <h2 className="text-sm font-semibold text-slate-200">Acesso Pessoal Sportech (Modo Administrador)</h2>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/20 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-1">Painel Gerenciador Sportech</h2>
              <p className="text-xs text-slate-300">Plataforma privada de automação e compilação de APKs conectados ao Google Sheets.</p>
              <div className="mt-4">
                <button onClick={() => { setActiveTab('wizard'); setWizardStep(1); }} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2">
                  <PlusCircle className="w-4 h-4"/> Gerar Novo Aplicativo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <h3 className="font-bold text-white text-sm">Biblioteca de Aplicações</h3>
                <p className="text-xs text-slate-400">Total de apps registados nesta sessão: {appsList.length}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={app.logoBase64} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800" />
                      <div>
                        <h3 className="font-bold text-sm text-white">{app.appName}</h3>
                        <p className="text-[11px] text-slate-400">{app.clubName}</p>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                      URL: <a href={app.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{app.url}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wizard' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center font-bold text-sm text-blue-400">
                Passo {wizardStep} de 4
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white">Identificação do Clube</h3>
                    <input type="text" value={formData.clubName} onChange={(e) => { const val = e.target.value; setFormData(prev => ({...prev, clubName: val, appName: val, internalId: val.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-v1' })); }} placeholder="Nome do Clube" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500" />
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="text-sm font-bold text-white">Logotipo (Otimização Automática)</h3>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    {formData.logoBase64 ? (
                      <div className="text-center space-y-3">
                        <img src={formData.logoBase64} alt="Preview" className="w-24 h-24 mx-auto rounded-2xl bg-slate-900 p-2 border border-slate-700" />
                        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl font-medium">Trocar Imagem</button>
                      </div>
                    ) : (
                      <div className="cursor-pointer border-2 border-dashed border-slate-800 p-6 text-center rounded-xl" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-6 h-6 mx-auto text-blue-400 mb-2"/>
                        <p className="font-semibold text-slate-200">Clique para selecionar imagem</p>
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white">URL do Sistema Web</h3>
                    <input type="url" value={formData.url} onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))} placeholder="[https://seudominio.com](https://seudominio.com)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500" />
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white">Compilação e Envio</h3>
                    {!isBuilding && !buildFinished && (
                      <button onClick={startApkBuildProcess} className="w-full py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30">Enviar para GitHub e Compilar APK</button>
                    )}
                    {(isBuilding || buildFinished) && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 h-40 overflow-y-auto space-y-1.5">
                        {buildLogs.map((log, index) => (
                          <div key={index} className="flex gap-2"><span className="text-slate-600">&gt;</span><span className={log.includes("SUCESSO") ? "text-emerald-400 font-bold" : "text-slate-300"}>{log}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-800">
                  <button disabled={wizardStep === 1 || isBuilding} onClick={() => setWizardStep(prev => prev - 1)} className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl disabled:opacity-40">Anterior</button>
                  {wizardStep < 4 && <button disabled={(wizardStep===1 && !formData.clubName) || (wizardStep===2 && !formData.logoBase64) || (wizardStep===3 && !formData.url)} onClick={() => setWizardStep(prev => prev + 1)} className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:opacity-40">Próximo</button>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Registro Central de Auditoria</h3>
              {auditLogs.map(log => (
                <div key={log.id} className="text-xs text-slate-300 border-b border-slate-800 py-2">
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.action} - {log.details}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}