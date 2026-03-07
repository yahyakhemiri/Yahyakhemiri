import React from 'react';
import { OptimizationMetrics, Language } from '../types';
import { ShieldCheck, Construction, Ruler, Info } from 'lucide-react';

interface OptimizationTableProps {
  metrics: OptimizationMetrics;
  lang: Language;
}

export const OptimizationTable: React.FC<OptimizationTableProps> = ({ metrics, lang }) => {
  const t = {
    en: {
      title: 'Structural Optimization Review',
      pillar1: 'Code Compliance',
      pillar2: 'Constructability',
      pillar3: 'Geometry & Spacing',
      asMin: 'Min Steel (As,min)',
      asMax: 'Max Steel (As,max)',
      asCalc: 'Calculated (As,req)',
      ratio: 'Steel Ratio (ρ)',
      score: 'Constructability Score',
      spacing: 'Bar Spacing',
      clearSpacing: 'Clear Spacing',
      recommendation: 'Expert Recommendation',
      aggregate: 'Aggregate Flow Check',
      passed: 'Passed',
      warning: 'Warning'
    },
    ar: {
      title: 'مراجعة تحسين التصميم الإنشائي',
      pillar1: 'الامتثال للكود',
      pillar2: 'قابلية التنفيذ',
      pillar3: 'الهندسة والتباعد',
      asMin: 'الحد الأدنى للتسليح (As,min)',
      asMax: 'الحد الأقصى للتسليح (As,max)',
      asCalc: 'التسليح المطلوب (As,req)',
      ratio: 'نسبة التسليح (ρ)',
      score: 'تقييم قابلية التنفيذ',
      spacing: 'تباعد القضبان',
      clearSpacing: 'التباعد الصافي بين القضبان',
      recommendation: 'توصية الخبير الإنشائي',
      aggregate: 'فحص تدفق الركام',
      passed: 'ناجح',
      warning: 'تحذير'
    }
  }[lang];

  return (
    <div className="mt-8 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t.title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Pillar 1: Code Compliance */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.pillar1}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{t.asMin}</span>
              <span className="text-xs font-mono text-slate-200">{metrics.asMin.toFixed(2)} cm²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{t.asMax}</span>
              <span className="text-xs font-mono text-slate-200">{metrics.asMax.toFixed(2)} cm²</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
              <span className="text-xs font-bold text-slate-300">{t.asCalc}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{metrics.asCalculated.toFixed(2)} cm²</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Constructability */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Construction className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.pillar2}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{t.ratio}</span>
              <span className="text-xs font-mono text-slate-200">{metrics.steelRatio.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{t.score}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${metrics.constructabilityScore > 7 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                    style={{ width: `${metrics.constructabilityScore * 10}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">{metrics.constructabilityScore}/10</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
              <span className="text-xs text-slate-400">{t.aggregate}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${metrics.clearSpacing >= 25 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {metrics.clearSpacing >= 25 ? t.passed : t.warning}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Geometry */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Ruler className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.pillar3}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{t.spacing}</span>
              <span className="text-xs font-mono text-slate-200">{Math.round(metrics.spacing)} mm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{t.clearSpacing}</span>
              <span className="text-xs font-mono text-slate-200">{Math.round(metrics.clearSpacing)} mm</span>
            </div>
            <div className="pt-2 border-t border-slate-800/50">
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-tight italic">{metrics.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
