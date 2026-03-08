import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Box, 
  Columns, 
  Square, 
  ChevronRight, 
  Info, 
  Download,
  Settings2,
  Activity
} from 'lucide-react';
import { ElementType, BeamInputs, ColumnInputs, FootingInputs, CalculationResult, Language } from './types';
import { calculateBeam, calculateColumn, calculateFooting } from './engineeringLogic';
import { DrawingView } from './components/DrawingView';
import { OptimizationTable } from './components/OptimizationTable';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const TRANSLATIONS = {
  en: {
    title: 'StructEasy',
    subtitle: 'Structural Engineering Suite',
    export: 'Export PDF',
    designElements: 'Design Elements',
    beam: 'Reinforced Beam',
    column: 'Concrete Column',
    footing: 'Isolated Footing',
    standards: 'Standards',
    standardsDesc: 'Calculations follow Eurocode 2 (EN 1992) and BAEL 91 rules for Ultimate Limit State (ULS) design.',
    inputs: 'Input Parameters',
    results: 'Design Results',
    verification: 'Structural Verification',
    utilization: 'Utilization Ratio',
    safe: 'SAFE',
    critical: 'CRITICAL',
    span: 'Span Length (L)',
    tributaryWidth: 'Tributary Width',
    slabSurface: 'Slab Surface',
    slabThickness: 'Slab Thickness',
    slabType: 'Slab Type',
    liveLoadType: 'Live Load Type',
    concreteGrade: 'Concrete Grade',
    cantilever: 'Cantilever Beam',
    tributaryArea: 'Tributary Area',
    floors: 'Number of Floors',
    axialLoad: 'Axial Load (N_u)',
    soilCapacity: 'Soil Bearing Capacity',
    width: 'Section Width',
    height: 'Section Height',
    deadLoad: 'Dead Load (G)',
    moment: 'Ult. Moment (M_u)',
    shear: 'Ult. Shear (V_u)',
    bottomRebar: 'Bottom Rebar',
    topRebar: 'Top Rebar',
    mainRebar: 'Main Rebar',
    tiesSpacing: 'Ties Spacing',
    thickness: 'Thickness',
    bottomMesh: 'Bottom Mesh',
    deformation: 'Max Deformation',
    realtime: 'REAL-TIME'
  },
  ar: {
    title: 'ستركت إيزي',
    subtitle: 'مجموعة الهندسة الإنشائية',
    export: 'تصدير PDF',
    designElements: 'عناصر التصميم',
    beam: 'جسر مسلح',
    column: 'عمود خرساني',
    footing: 'قاعدة منفصلة',
    standards: 'المعايير',
    standardsDesc: 'تتبع الحسابات قواعد Eurocode 2 (EN 1992) و BAEL 91 لتصميم حالة الحدود القصوى (ULS).',
    inputs: 'مدخلات التصميم',
    results: 'نتائج الحسابات',
    verification: 'التحقق الإنشائي',
    utilization: 'نسبة الاستغلال',
    safe: 'آمن',
    critical: 'حرج',
    span: 'طول الجسر',
    tributaryWidth: 'العرض التحميلي',
    slabSurface: 'مساحة السقف',
    slabThickness: 'سماكة السقف',
    slabType: 'نوع السقف',
    liveLoadType: 'نوع الحمل الحي',
    concreteGrade: 'رتبة الخرسانة',
    cantilever: 'جسر كابولي',
    tributaryArea: 'المساحة التحميلية',
    floors: 'عدد الطوابق',
    axialLoad: 'الحمل المحوري (N_u)',
    soilCapacity: 'قدرة تحمل التربة',
    width: 'عرض المقطع',
    height: 'ارتفاع المقطع',
    deadLoad: 'الحمل الميت (G)',
    moment: 'عزم الانحناء الأقصى (M_u)',
    shear: 'قوة القص القصوى (V_u)',
    bottomRebar: 'التسليح السفلي',
    topRebar: 'التسليح العلوي',
    mainRebar: 'التسليح الرئيسي',
    tiesSpacing: 'تباعد الكانات',
    thickness: 'السماكة',
    bottomMesh: 'الشبكة السفلية',
    deformation: 'أقصى ترخيم (Deflection)',
    realtime: 'تحديث فوري'
  }
};

const CONCRETE_GRADES = ['C20/25', 'C25/30', 'C30/37', 'C35/45'];
const LOAD_TYPES = [
  { id: 'residential', label: 'Residential (1.5 kN/m²)' },
  { id: 'office', label: 'Office (2.5 kN/m²)' },
  { id: 'storage', label: 'Storage (5.0 kN/m²)' },
  { id: 'roof', label: 'Roof (1.0 kN/m²)' },
];

const SLAB_TYPES = [
  { id: 'solid', label: 'Solid Slab (25 kN/m³)' },
  { id: 'hollow', label: 'Hollow Block (15 kN/m³)' },
  { id: 'precast', label: 'Precast Slab (20 kN/m³)' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ElementType>(ElementType.BEAM);
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];
  
  // Inputs
  const [beamInputs, setBeamInputs] = useState<BeamInputs>({
    span: 5,
    tributaryWidth: 4,
    slabSurface: 20,
    slabThickness: 150,
    slabType: 'solid',
    isCantilever: false,
    liveLoadType: 'residential',
    concreteGrade: 'C25/30'
  });

  const [columnInputs, setColumnInputs] = useState<ColumnInputs>({
    tributaryArea: 20,
    numberOfFloors: 3,
    slabThickness: 150,
    liveLoadType: 'residential',
    concreteGrade: 'C25/30'
  });

  const [footingInputs, setFootingInputs] = useState<FootingInputs>({
    axialLoad: 800,
    soilBearingCapacity: 0.2,
    concreteGrade: 'C25/30'
  });

  // Results
  const beamResult = useMemo(() => calculateBeam(beamInputs), [beamInputs]);
  const columnResult = useMemo(() => {
    // Pass beam width to column to satisfy alignment rule
    return calculateColumn({
      ...columnInputs,
      beamWidth: beamResult.dimensions.width
    });
  }, [columnInputs, beamResult.dimensions.width]);
  const footingResult = useMemo(() => calculateFooting(footingInputs), [footingInputs]);

  const activeResult = useMemo(() => {
    switch (activeTab) {
      case ElementType.BEAM: return beamResult;
      case ElementType.COLUMN: return columnResult;
      case ElementType.FOOTING: return footingResult;
    }
  }, [activeTab, beamResult, columnResult, footingResult]);

  const exportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    // Create a temporary container for PDF generation to ensure consistent layout
    const originalStyle = element.style.cssText;
    element.style.width = '1000px'; // Increased width for better resolution
    element.style.padding = '40px';
    
    // Add a temporary scale indicator for the PDF
    const scaleIndicator = document.createElement('div');
    scaleIndicator.innerHTML = `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: #94a3b8; font-family: monospace; font-size: 10px; display: flex; justify-content: space-between;">
        <span>STRUCTURAL DESIGN REPORT • SCALE 1:50</span>
        <span>GENERATED ON ${new Date().toLocaleString()}</span>
      </div>
    `;
    element.prepend(scaleIndicator);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
        windowWidth: 1200,
        ignoreElements: (el) => el.classList.contains('no-print')
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const displayWidth = pdfWidth - 20; // 10mm margins
      const displayHeight = displayWidth / ratio;
      
      pdf.addImage(imgData, 'PNG', 10, 10, displayWidth, displayHeight);
      
      // Add a footer with scale info
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text('Note: Drawings are rendered at 1:50 scale relative to the physical dimensions of structural elements.', 10, pdfHeight - 10);
      
      // Force download using a Blob and anchor tag for better mobile support
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StructEasy_${activeTab}_Report_1_50.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      element.style.cssText = originalStyle;
      element.removeChild(scaleIndicator);
    }
  };

  const downloadAppHTML = async () => {
    try {
      const response = await fetch('/StructEasy.html');
      if (!response.ok) throw new Error('Failed to fetch HTML');
      const htmlContent = await response.text();
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'StructEasy_App.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML:', error);
      alert('Failed to download the application. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 relative overflow-x-hidden ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-grid-pattern z-0" />
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Calculator className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">{t.title}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 rounded-lg p-1 mr-2">
              <button onClick={() => setLang('en')} className={`px-2 py-1 text-[10px] rounded ${lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>EN</button>
              <button onClick={() => setLang('ar')} className={`px-2 py-1 text-[10px] rounded ${lang === 'ar' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>AR</button>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Sidebar Navigation */}
        <nav className="lg:col-span-3 space-y-2 no-print">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4 px-2">{t.designElements}</p>
          {[
            { id: ElementType.BEAM, label: t.beam, icon: Box },
            { id: ElementType.COLUMN, label: t.column, icon: Columns },
            { id: ElementType.FOOTING, label: t.footing, icon: Square },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? (lang === 'ar' ? '-translate-x-1' : 'translate-x-1') : 'opacity-0'}`} />
            </button>
          ))}

          <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-slate-300 uppercase">{t.standards}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.standardsDesc}
            </p>
          </div>
        </nav>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8" id="report-content">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Input Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  {t.inputs}
                </h2>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-orange-400 border border-orange-500/20">{t.realtime}</span>
              </div>

              <div className="space-y-6">
                {activeTab === ElementType.BEAM && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <label className="text-sm font-medium text-slate-300">{t.cantilever}</label>
                      <button 
                        onClick={() => setBeamInputs({...beamInputs, isCantilever: !beamInputs.isCantilever})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${beamInputs.isCantilever ? 'bg-emerald-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${beamInputs.isCantilever ? (lang === 'ar' ? 'right-7' : 'left-7') : (lang === 'ar' ? 'right-1' : 'left-1')}`} />
                      </button>
                    </div>
                    <InputGroup label={t.span} value={beamInputs.span} unit="m" min={1} max={20} step={0.1} onChange={(v) => setBeamInputs({...beamInputs, span: v})} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label={t.tributaryWidth} value={beamInputs.tributaryWidth} unit="m" min={1} max={10} step={0.1} onChange={(v) => setBeamInputs({...beamInputs, tributaryWidth: v, slabSurface: v * beamInputs.span})} />
                      <InputGroup label={t.slabSurface} value={beamInputs.slabSurface || 0} unit="m²" min={1} max={200} step={1} onChange={(v) => setBeamInputs({...beamInputs, slabSurface: v, tributaryWidth: v / beamInputs.span})} />
                    </div>
                    <InputGroup label={t.slabThickness} value={beamInputs.slabThickness} unit="mm" min={100} max={400} step={10} onChange={(v) => setBeamInputs({...beamInputs, slabThickness: v})} />
                    <SelectGroup label={t.slabType} value={beamInputs.slabType} options={SLAB_TYPES} onChange={(v) => setBeamInputs({...beamInputs, slabType: v as any})} />
                    <SelectGroup label={t.liveLoadType} value={beamInputs.liveLoadType} options={LOAD_TYPES} onChange={(v) => setBeamInputs({...beamInputs, liveLoadType: v as any})} />
                    <SelectGroup label={t.concreteGrade} value={beamInputs.concreteGrade} options={CONCRETE_GRADES.map(g => ({id: g, label: g}))} onChange={(v) => setBeamInputs({...beamInputs, concreteGrade: v})} />
                  </>
                )}
                {activeTab === ElementType.COLUMN && (
                  <>
                    <InputGroup label={t.tributaryArea} value={columnInputs.tributaryArea} unit="m²" min={5} max={100} step={1} onChange={(v) => setColumnInputs({...columnInputs, tributaryArea: v})} />
                    <InputGroup label={t.floors} value={columnInputs.numberOfFloors} unit="floors" min={1} max={20} step={1} onChange={(v) => setColumnInputs({...columnInputs, numberOfFloors: v})} />
                    <InputGroup label={t.slabThickness} value={columnInputs.slabThickness} unit="mm" min={100} max={400} step={10} onChange={(v) => setColumnInputs({...columnInputs, slabThickness: v})} />
                    <SelectGroup label={t.liveLoadType} value={columnInputs.liveLoadType} options={LOAD_TYPES} onChange={(v) => setColumnInputs({...columnInputs, liveLoadType: v as any})} />
                    <SelectGroup label={t.concreteGrade} value={columnInputs.concreteGrade} options={CONCRETE_GRADES.map(g => ({id: g, label: g}))} onChange={(v) => setColumnInputs({...columnInputs, concreteGrade: v})} />
                  </>
                )}
                {activeTab === ElementType.FOOTING && (
                  <>
                    <InputGroup label={t.axialLoad} value={footingInputs.axialLoad} unit="kN" min={100} max={5000} step={50} onChange={(v) => setFootingInputs({...footingInputs, axialLoad: v})} />
                    <InputGroup label={t.soilCapacity} value={footingInputs.soilBearingCapacity} unit="MPa" min={0.05} max={1.0} step={0.01} onChange={(v) => setFootingInputs({...footingInputs, soilBearingCapacity: v})} />
                    <SelectGroup label={t.concreteGrade} value={footingInputs.concreteGrade} options={CONCRETE_GRADES.map(g => ({id: g, label: g}))} onChange={(v) => setFootingInputs({...footingInputs, concreteGrade: v})} />
                  </>
                )}
              </div>
            </section>

            {/* Results Summary */}
            <section className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Box className="w-5 h-5 text-orange-500" />
                  {t.results}
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <ResultCard label={t.width} value={activeResult.dimensions.width} unit="mm" />
                  <ResultCard label={t.height} value={activeResult.dimensions.height} unit="mm" />
                  {activeTab === ElementType.BEAM && (
                    <>
                      <ResultCard label={t.deadLoad} value={activeResult.loads.deadLoad?.toFixed(2)} unit="kN/m" />
                      <ResultCard label={t.moment} value={activeResult.loads.ultimateMoment?.toFixed(1)} unit="kNm" />
                      <ResultCard label={t.shear} value={activeResult.loads.ultimateShear?.toFixed(1)} unit="kN" />
                      <ResultCard label={t.deformation} value={activeResult.loads.deformation?.toFixed(1)} unit="mm" color="text-blue-400" />
                      <ResultCard label={t.bottomRebar} value={`${activeResult.reinforcement.bottom.count}HA${activeResult.reinforcement.bottom.diameter}`} subValue={`${activeResult.reinforcement.bottom.area.toFixed(2)} cm²`} color="text-emerald-500" />
                      <ResultCard label={t.topRebar} value={`${activeResult.reinforcement.top.count}HA${activeResult.reinforcement.top.diameter}`} subValue={`${activeResult.reinforcement.top.area.toFixed(2)} cm²`} color="text-orange-500" />
                    </>
                  )}
                  {activeTab === ElementType.COLUMN && (
                    <>
                      <ResultCard label={t.mainRebar} value={`${activeResult.reinforcement.bottom.count}HA${activeResult.reinforcement.bottom.diameter}`} subValue={`${activeResult.reinforcement.bottom.area.toFixed(2)} cm²`} color="text-emerald-500" />
                      <ResultCard label={t.tiesSpacing} value={activeResult.reinforcement.stirrups.spacing} unit="mm" />
                    </>
                  )}
                  {activeTab === ElementType.FOOTING && (
                    <>
                      <ResultCard label={t.thickness} value={activeResult.dimensions.length} unit="mm" />
                      <ResultCard label={t.bottomMesh} value={`HA${activeResult.reinforcement.bottom.diameter}`} subValue={`@ ${Math.round(activeResult.dimensions.width / activeResult.reinforcement.bottom.count)}mm`} color="text-emerald-500" />
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
                    <span>{t.verification}</span>
                    <span className={activeResult.loads.utilization > 0.9 ? 'text-orange-500' : 'text-emerald-500'}>
                      {activeResult.loads.utilization > 0.95 ? t.critical : t.safe}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${activeResult.loads.utilization * 100}%` }}
                      className={`h-full shadow-[0_0_10px_rgba(16,185,129,0.5)] ${activeResult.loads.utilization > 0.9 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">{t.utilization}: {activeResult.loads.utilization.toFixed(2)}</p>
                </div>
              </div>

              {/* Drawing View */}
              <DrawingView type={activeTab} result={activeResult} lang={lang} />

              {/* Optimization Review */}
              {activeResult.optimization && (
                <OptimizationTable metrics={activeResult.optimization} lang={lang} />
              )}

              {/* Export Button at the end */}
              <div className="pt-8 flex justify-center gap-4 no-print">
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-xl shadow-emerald-900/20 font-bold group"
                >
                  <Download className="w-5 h-5 group-hover:bounce" />
                  <span>{t.export}</span>
                </button>
                <button 
                  onClick={downloadAppHTML}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-2xl transition-all shadow-xl shadow-emerald-900/10 font-bold group"
                >
                  <Download className="w-5 h-5 group-hover:bounce" />
                  <span>{lang === 'ar' ? 'تحميل التطبيق (HTML)' : 'Download App (HTML)'}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputGroup({ label, value, unit, min, max, step, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-400">{label}</label>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={value} 
            step={step}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            className="w-20 bg-slate-800 border border-emerald-500/30 rounded px-2 py-1 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none transition-all hover:border-emerald-500/50"
          />
          <span className="text-[10px] text-slate-500 font-mono uppercase w-8">{unit}</span>
        </div>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
}

function SelectGroup({ label, value, options, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-400">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-200"
      >
        {options.map((opt: any) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ResultCard({ label, value, unit, subValue, color = "text-white" }: any) {
  return (
    <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-all" />
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {subValue && <p className="text-[10px] text-slate-400 mt-1">{subValue}</p>}
    </div>
  );
}
