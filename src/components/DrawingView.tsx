import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { CalculationResult, ElementType, Language } from '../types';

interface DrawingViewProps {
  type: ElementType;
  result: CalculationResult;
  lang: Language;
}

export const DrawingView: React.FC<DrawingViewProps> = ({ type, result, lang }) => {
  const [viewMode, setViewMode] = useState<'section' | 'longitudinal' | 'diagrams'>('section');
  
  const t = {
    en: {
      detailing: 'Technical Detailing',
      section: 'Section',
      plan: 'Plan',
      longitudinal: 'Longitudinal',
      side: 'Side',
      diagrams: 'Diagrams',
      drag: 'DRAG TO PAN • SCROLL TO ZOOM',
      top: 'Top',
      bot: 'Bot',
      sideLabel: 'Side',
      stirrups: 'Stirrups',
      ties: 'Ties',
      mesh: 'Mesh',
      thickness: 'Thickness',
      moment: 'Bending Moment Diagram (M_u)',
      shear: 'Shear Force Diagram (V_u)',
      maxM: 'Max M_u',
      maxV: 'Max V_u',
      noData: 'No diagram data available'
    },
    ar: {
      detailing: 'التفاصيل الفنية',
      section: 'مقطع عرضي',
      plan: 'مسقط أفقي',
      longitudinal: 'مقطع طولي',
      side: 'جانبي',
      diagrams: 'مخططات القوى',
      drag: 'اسحب للتحريك • مرر للتكبير',
      top: 'علوي',
      bot: 'سفلي',
      sideLabel: 'جانبي',
      stirrups: 'كانات',
      ties: 'أساور',
      mesh: 'شبكة',
      thickness: 'السماكة',
      moment: 'مخطط عزم الانحناء (M_u)',
      shear: 'مخطط قوة القص (V_u)',
      maxM: 'أقصى عزم',
      maxV: 'أقصى قص',
      noData: 'لا توجد بيانات للمخطط'
    }
  }[lang];

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { width, height, length = 5000 } = result.dimensions;
  const { bottom, top, stirrups, sideBars } = result.reinforcement;

  // Reset zoom/pan when result or viewMode changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [result, viewMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.2, Math.min(5, prev * delta)));
  };

  const zoomIn = () => setZoom(prev => Math.min(5, prev * 1.2));
  const zoomOut = () => setZoom(prev => Math.max(0.2, prev * 0.8));
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Colors
  const concreteColor = "#94a3b8";
  const stirrupColor = "#64748b";
  const topBarColor = "#f97316"; // Orange
  const bottomBarColor = "#10b981"; // Emerald
  const sideBarColor = "#fbbf24"; // Amber/Orange-ish

  // Scaling factor for SVG
  const maxDim = Math.max(width, height);
  const scale = 250 / maxDim;
  const svgW = width * scale + 100;
  const svgH = height * scale + 100;
  const offsetX = 50;
  const offsetY = 50;

  const renderBeamSection = () => {
    const rectW = width * scale;
    const rectH = height * scale;
    const cover = 30 * scale;

    const stirrupPath = `M ${offsetX + cover} ${offsetY + cover} 
                         L ${offsetX + rectW - cover} ${offsetY + cover} 
                         L ${offsetX + rectW - cover} ${offsetY + rectH - cover} 
                         L ${offsetX + cover} ${offsetY + rectH - cover} Z`;

    return (
      <svg width={svgW} height={svgH} className="mx-auto">
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        <path d={stirrupPath} fill="none" stroke={stirrupColor} strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Top Rebars */}
        {Array.from({ length: top.count }).map((_, i) => {
          const x = offsetX + cover + (i * (rectW - 2 * cover)) / (top.count - 1 || 1);
          return (
            <g key={`top-${i}`}>
              <circle cx={x} cy={offsetY + cover} r={top.diameter * scale / 2} fill={topBarColor} />
              {i === 0 && <text x={x} y={offsetY + cover - 10} textAnchor="middle" fill={topBarColor} fontSize="8">HA{top.diameter}</text>}
            </g>
          );
        })}

        {/* Side Rebars */}
        {sideBars && Array.from({ length: sideBars.count }).map((_, i) => {
          const y = offsetY + cover + (i + 1) * (rectH - 2 * cover) / (sideBars.count + 1);
          return (
            <React.Fragment key={`side-${i}`}>
              <circle cx={offsetX + cover} cy={y} r={sideBars.diameter * scale / 2} fill={sideBarColor} />
              <circle cx={offsetX + rectW - cover} cy={y} r={sideBars.diameter * scale / 2} fill={sideBarColor} />
              {i === 0 && <text x={offsetX + cover - 15} y={y + 3} textAnchor="end" fill={sideBarColor} fontSize="8">HA{sideBars.diameter}</text>}
            </React.Fragment>
          );
        })}

        {/* Bottom Rebars */}
        {Array.from({ length: bottom.count }).map((_, i) => {
          const x = offsetX + cover + (i * (rectW - 2 * cover)) / (bottom.count - 1 || 1);
          return (
            <g key={`bot-${i}`}>
              <circle cx={x} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
              {i === 0 && <text x={x} y={offsetY + rectH - cover + 15} textAnchor="middle" fill={bottomBarColor} fontSize="8">HA{bottom.diameter}</text>}
            </g>
          );
        })}

        <text x={offsetX + rectW / 2} y={offsetY - 15} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold">{width} mm</text>
        <text x={offsetX - 15} y={offsetY + rectH / 2} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold" transform={`rotate(-90, ${offsetX - 15}, ${offsetY + rectH / 2})`}>{height} mm</text>
        
        <text x={offsetX + rectW + 10} y={offsetY + cover} fill={topBarColor} fontSize="10" fontWeight="bold">{t.top}: {top.count}HA{top.diameter}</text>
        {sideBars && <text x={offsetX + rectW + 10} y={offsetY + rectH / 2} fill={sideBarColor} fontSize="10" fontWeight="bold">{t.sideLabel}: {sideBars.count * 2}HA{sideBars.diameter}</text>}
        <text x={offsetX + rectW + 10} y={offsetY + rectH - cover} fill={bottomBarColor} fontSize="10" fontWeight="bold">{t.bot}: {bottom.count}HA{bottom.diameter}</text>
        <text x={offsetX + rectW / 2} y={offsetY + rectH + 25} textAnchor="middle" fill={stirrupColor} fontSize="10">{t.stirrups}: HA{stirrups.diameter} @ {stirrups.spacing}mm</text>
      </svg>
    );
  };

  const renderBeamLongitudinal = () => {
    const viewW = 400;
    const lScale = viewW / length;
    const hScale = 150 / height; // Fixed height for visibility
    const drawH = height * hScale;
    const drawW = viewW;
    const lOffsetX = 50;
    const lOffsetY = 50;
    const cover = 30 * hScale;

    // Support visualization
    const supportW = 30;
    const supportH = 40;

    return (
      <svg width={viewW + 100} height={drawH + 120} className="mx-auto">
        {/* Supports */}
        {result.loads.ultimateMoment && (
          <>
            <rect 
              x={lOffsetX - supportW} 
              y={lOffsetY - 20} 
              width={supportW} 
              height={drawH + 40} 
              fill={concreteColor} 
              opacity="0.3" 
            />
            {result.reinforcement.stirrups.distribution?.length === 3 && (
              <rect 
                x={lOffsetX + drawW} 
                y={lOffsetY + drawH} 
                width={supportW} 
                height={supportH} 
                fill={concreteColor} 
                opacity="0.3" 
              />
            )}
          </>
        )}

        {/* Concrete Outline */}
        <rect x={lOffsetX} y={lOffsetY} width={drawW} height={drawH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Top Bars with Curtailment (Simplified) */}
        {/* For simple beam, top bars might be curtailed. For cantilever, they are main. */}
        <line x1={lOffsetX + cover} y1={lOffsetY + cover} x2={lOffsetX + drawW - cover} y2={lOffsetY + cover} stroke={topBarColor} strokeWidth={result.reinforcement.top.count > 0 ? 3 : 1} />
        
        {/* Bottom Bars with Curtailment (Simplified 0.15L rule) */}
        <line x1={lOffsetX + cover} y1={lOffsetY + drawH - cover} x2={lOffsetX + drawW - cover} y2={lOffsetY + drawH - cover} stroke={bottomBarColor} strokeWidth={result.reinforcement.bottom.count > 0 ? 3 : 1} />
        
        {/* Curtailment Markers */}
        {!result.reinforcement.stirrups.distribution?.length || result.reinforcement.stirrups.distribution.length === 3 ? (
          <>
            <line x1={lOffsetX + drawW * 0.15} y1={lOffsetY + drawH - cover - 5} x2={lOffsetX + drawW * 0.15} y2={lOffsetY + drawH - cover + 5} stroke={bottomBarColor} strokeWidth="1" />
            <line x1={lOffsetX + drawW * 0.85} y1={lOffsetY + drawH - cover - 5} x2={lOffsetX + drawW * 0.85} y2={lOffsetY + drawH - cover + 5} stroke={bottomBarColor} strokeWidth="1" />
            <text x={lOffsetX + drawW * 0.15} y={lOffsetY + drawH - cover + 15} textAnchor="middle" fill={bottomBarColor} fontSize="8">0.15L</text>
          </>
        ) : null}

        {/* Side Bars */}
        {sideBars && <line x1={lOffsetX + cover} y1={lOffsetY + drawH/2} x2={lOffsetX + drawW - cover} y2={lOffsetY + drawH/2} stroke={sideBarColor} strokeWidth="1" strokeDasharray="5 2" />}

        {/* Stirrups based on distribution */}
        {result.reinforcement.stirrups.distribution?.map((zone, zIdx) => {
          const zoneStart = result.reinforcement.stirrups.distribution!.slice(0, zIdx).reduce((acc, z) => acc + z.length, 0);
          const stirrupCount = Math.floor(zone.length / zone.spacing);
          return Array.from({ length: stirrupCount }).map((_, i) => {
            const x = lOffsetX + (zoneStart + i * zone.spacing) * lScale;
            if (x > lOffsetX + drawW) return null;
            return (
              <line 
                key={`stirrup-${zIdx}-${i}`} 
                x1={x} y1={lOffsetY + cover} 
                x2={x} y2={lOffsetY + drawH - cover} 
                stroke={stirrupColor} 
                strokeWidth="1" 
                opacity={0.4 + (0.6 * (100 / zone.spacing))} 
              />
            );
          });
        })}

        <text x={lOffsetX + drawW / 2} y={lOffsetY - 15} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold">L = {length} mm</text>
        <text x={lOffsetX + drawW / 2} y={lOffsetY + drawH + 25} textAnchor="middle" fill={stirrupColor} fontSize="10">
          {t.stirrups}: {result.reinforcement.stirrups.distribution?.map(z => `${z.spacing}mm`).join(' | ')}
        </text>
        <text x={lOffsetX + drawW / 2} y={lOffsetY + drawH + 40} textAnchor="middle" fill={concreteColor} fontSize="8" opacity="0.5">
          Reinforcement curtailment based on EC2/BAEL standard rules
        </text>
      </svg>
    );
  };

  const renderColumnLongitudinal = () => {
    const viewW = 150;
    const viewH = 400;
    const lScale = viewH / 3000; // Assuming 3m height
    const wScale = 100 / width;
    const drawW = width * wScale;
    const drawH = viewH;
    const lOffsetX = 100;
    const lOffsetY = 50;
    const cover = 30 * wScale;

    const tieSpacing = stirrups.spacing;
    const tieCount = Math.floor(3000 / tieSpacing);

    return (
      <svg width={viewW + 150} height={viewH + 100} className="mx-auto">
        {/* Concrete Outline */}
        <rect x={lOffsetX} y={lOffsetY} width={drawW} height={drawH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Main Bars */}
        <line x1={lOffsetX + cover} y1={lOffsetY} x2={lOffsetX + cover} y2={lOffsetY + drawH} stroke={bottomBarColor} strokeWidth="3" />
        <line x1={lOffsetX + drawW - cover} y1={lOffsetY} x2={lOffsetX + drawW - cover} y2={lOffsetY + drawH} stroke={bottomBarColor} strokeWidth="3" />

        {/* Ties */}
        {Array.from({ length: tieCount + 1 }).map((_, i) => {
          const y = lOffsetY + i * (tieSpacing * (viewH / 3000));
          if (y > lOffsetY + drawH) return null;
          return (
            <line key={`tie-${i}`} x1={lOffsetX} y1={y} x2={lOffsetX + drawW} y2={y} stroke={stirrupColor} strokeWidth="1" opacity="0.6" />
          );
        })}

        <text x={lOffsetX + drawW / 2} y={lOffsetY - 15} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold">H = 3000 mm</text>
        <text x={lOffsetX + drawW / 2} y={lOffsetY + drawH + 25} textAnchor="middle" fill={stirrupColor} fontSize="10">{t.ties}: HA{stirrups.diameter} @ {stirrups.spacing}mm</text>
      </svg>
    );
  };

  const renderFootingSide = () => {
    const rectW = width * scale;
    const rectH = result.dimensions.length! * scale; // thickness
    const cover = 50 * scale;
    const colW = 300 * scale;

    return (
      <svg width={svgW} height={svgH} className="mx-auto">
        {/* Footing Outline */}
        <rect x={offsetX} y={offsetY + 50} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Column Starter */}
        <rect x={offsetX + (rectW - colW)/2} y={offsetY} width={colW} height={50} fill="none" stroke={concreteColor} strokeWidth="1" opacity="0.5" />
        <line x1={offsetX + (rectW - colW)/2 + 10} y1={offsetY} x2={offsetX + (rectW - colW)/2 + 10} y2={offsetY + 50 + rectH - cover} stroke={bottomBarColor} strokeWidth="2" />
        <line x1={offsetX + (rectW + colW)/2 - 10} y1={offsetY} x2={offsetX + (rectW + colW)/2 - 10} y2={offsetY + 50 + rectH - cover} stroke={bottomBarColor} strokeWidth="2" />

        {/* Bottom Mesh */}
        <line x1={offsetX + cover} y1={offsetY + 50 + rectH - cover} x2={offsetX + rectW - cover} y2={offsetY + 50 + rectH - cover} stroke={bottomBarColor} strokeWidth="2" />
        
        <text x={offsetX + rectW / 2} y={offsetY + 50 + rectH + 25} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold">{t.thickness}: {result.dimensions.length} mm</text>
      </svg>
    );
  };

  const renderColumnSection = () => {
    const rectW = width * scale;
    const rectH = height * scale;
    const cover = 30 * scale;

    return (
      <svg width={svgW} height={svgH} className="mx-auto">
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        <rect x={offsetX + cover} y={offsetY + cover} width={rectW - 2 * cover} height={rectH - 2 * cover} fill="none" stroke={stirrupColor} strokeWidth="1" strokeDasharray="4 2" />

        {/* Corner Rebars */}
        <g>
          <circle cx={offsetX + cover} cy={offsetY + cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
          <text x={offsetX + cover - 5} y={offsetY + cover - 5} textAnchor="end" fill={bottomBarColor} fontSize="8">HA{bottom.diameter}</text>
        </g>
        <circle cx={offsetX + rectW - cover} cy={offsetY + cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
        <circle cx={offsetX + cover} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
        <circle cx={offsetX + rectW - cover} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />

        {/* Side Rebars */}
        {bottom.count > 4 && Array.from({ length: Math.floor((bottom.count - 4) / 2) }).map((_, i) => (
           <React.Fragment key={i}>
             <circle cx={offsetX + cover + (i + 1) * (rectW - 2 * cover) / (Math.floor((bottom.count - 4) / 2) + 1)} cy={offsetY + cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
             <circle cx={offsetX + cover + (i + 1) * (rectW - 2 * cover) / (Math.floor((bottom.count - 4) / 2) + 1)} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
           </React.Fragment>
        ))}

        <text x={offsetX + rectW / 2} y={offsetY - 15} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold">{width} mm</text>
        <text x={offsetX + rectW / 2} y={offsetY + rectH + 25} textAnchor="middle" fill={bottomBarColor} fontSize="10" fontWeight="bold">Main: {bottom.count}HA{bottom.diameter}</text>
      </svg>
    );
  };

  const renderFootingSection = () => {
    const rectW = width * scale;
    const rectH = height * scale;
    const cover = 50 * scale;

    return (
      <svg width={svgW} height={svgH} className="mx-auto">
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        {Array.from({ length: bottom.count }).map((_, i) => {
          const x = offsetX + cover + (i * (rectW - 2 * cover)) / (bottom.count - 1 || 1);
          return <circle key={`foot-${i}`} cx={x} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />;
        })}
        <line x1={offsetX + cover} y1={offsetY + rectH - cover} x2={offsetX + rectW - cover} y2={offsetY + rectH - cover} stroke={bottomBarColor} strokeWidth="1" />
        
        {/* Cross bars */}
        {Array.from({ length: bottom.count }).map((_, i) => {
          const y = offsetY + cover + (i * (rectH - 2 * cover)) / (bottom.count - 1 || 1);
          return <line key={`cross-${i}`} x1={offsetX + cover} y1={y} x2={offsetX + rectW - cover} y2={y} stroke={bottomBarColor} strokeWidth="0.5" opacity="0.5" />;
        })}

        <text x={offsetX + rectW / 2} y={offsetY - 15} textAnchor="middle" fill={concreteColor} fontSize="12" fontWeight="bold">W: {width} mm</text>
        <text x={offsetX + rectW / 2} y={offsetY + rectH + 25} textAnchor="middle" fill={bottomBarColor} fontSize="10" fontWeight="bold">{t.mesh}: HA{bottom.diameter} @ {Math.round(width / bottom.count)}mm</text>
      </svg>
    );
  };

  const renderDiagrams = () => {
    if (!result.diagrams) return <div className="text-slate-500 text-xs">{t.noData}</div>;
    
    const viewW = 400;
    const viewH = 150;
    const dOffsetX = 50;
    const dOffsetY = 50;
    
    const { moment, shear } = result.diagrams;
    const maxM = Math.max(...moment.map(p => Math.abs(p.y)), 1);
    const maxV = Math.max(...shear.map(p => Math.abs(p.y)), 1);
    
    const mScale = (viewH / 2) / maxM;
    const vScale = (viewH / 2) / maxV;
    const xMultiplier = viewW / (result.dimensions.length! / 1000);

    const momentPath = moment.map((p, i) => `${i === 0 ? 'M' : 'L'} ${dOffsetX + p.x * xMultiplier} ${dOffsetY + viewH/2 + p.y * mScale}`).join(' ');
    const shearPath = shear.map((p, i) => `${i === 0 ? 'M' : 'L'} ${dOffsetX + p.x * xMultiplier} ${dOffsetY + viewH/2 - p.y * vScale}`).join(' ');

    return (
      <div className="space-y-8 py-4">
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">{t.moment}</p>
          <svg width={viewW + 100} height={viewH + 100}>
            <line x1={dOffsetX} y1={dOffsetY + viewH/2} x2={dOffsetX + viewW} y2={dOffsetY + viewH/2} stroke={concreteColor} strokeWidth="1" opacity="0.3" />
            <path d={momentPath} fill="none" stroke="#f97316" strokeWidth="2" />
            <text x={dOffsetX + viewW/2} y={dOffsetY + viewH + 20} textAnchor="middle" fill="#f97316" fontSize="10">{t.maxM}: {result.loads.ultimateMoment?.toFixed(1)} kNm</text>
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">{t.shear}</p>
          <svg width={viewW + 100} height={viewH + 100}>
            <line x1={dOffsetX} y1={dOffsetY + viewH/2} x2={dOffsetX + viewW} y2={dOffsetY + viewH/2} stroke={concreteColor} strokeWidth="1" opacity="0.3" />
            <path d={shearPath} fill="none" stroke="#10b981" strokeWidth="2" />
            <text x={dOffsetX + viewW/2} y={dOffsetY + viewH + 20} textAnchor="middle" fill="#10b981" fontSize="10">{t.maxV}: {result.loads.ultimateShear?.toFixed(1)} kN</text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-400 text-xs uppercase tracking-widest font-mono">{t.detailing}</h3>
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('section')}
            className={`px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'section' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {type === ElementType.FOOTING ? t.plan : t.section}
          </button>
          <button 
            onClick={() => setViewMode('longitudinal')}
            className={`px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'longitudinal' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {type === ElementType.FOOTING ? t.side : t.longitudinal}
          </button>
          {type === ElementType.BEAM && (
            <button 
              onClick={() => setViewMode('diagrams')}
              className={`px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'diagrams' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t.diagrams}
            </button>
          )}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className={`flex items-center justify-center min-h-[400px] bg-slate-950/50 rounded-xl border border-slate-800/50 p-4 relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20 no-print">
          <button onClick={zoomIn} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors shadow-lg" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={zoomOut} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors shadow-lg" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={resetView} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-colors shadow-lg" title="Reset View">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] text-slate-500 font-mono z-20 pointer-events-none">
          <Move className="w-3 h-3" />
          <span>{t.drag}</span>
        </div>

        <motion.div
          animate={{ x: offset.x, y: offset.y, scale: zoom }}
          transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', damping: 20, stiffness: 100 }}
          className="w-full h-full flex items-center justify-center origin-center"
        >
          {type === ElementType.BEAM && (
            viewMode === 'section' ? renderBeamSection() : 
            viewMode === 'longitudinal' ? renderBeamLongitudinal() : 
            renderDiagrams()
          )}
          {type === ElementType.COLUMN && (viewMode === 'section' ? renderColumnSection() : renderColumnLongitudinal())}
          {type === ElementType.FOOTING && (viewMode === 'section' ? renderFootingSection() : renderFootingSide())}
        </motion.div>
      </div>
    </div>
  );
};
