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
      detailing: 'التفاصيل الإنشائية',
      section: 'مقطع عرضي',
      plan: 'مسقط أفقي',
      longitudinal: 'مقطع طولي',
      side: 'مقطع جانبي',
      diagrams: 'مخططات القوى',
      drag: 'اسحب للتحريك • مرر للتكبير',
      top: 'تسليح علوي',
      bot: 'تسليح سفلي',
      sideLabel: 'تسليح جانبي',
      stirrups: 'كانات (Stirrups)',
      ties: 'أساور (Ties)',
      mesh: 'شبكة تسليح',
      thickness: 'السماكة',
      moment: 'مخطط عزم الانحناء (M_u)',
      shear: 'مخطط قوى القص (V_u)',
      maxM: 'أقصى عزم',
      maxV: 'أقصى قوة قص',
      noData: 'لا توجد بيانات متاحة'
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
  const dimensionColor = "#475569";

  // Dimension Helper
  const renderDimension = (x1: number, y1: number, x2: number, y2: number, text: string, orientation: 'h' | 'v' = 'h', offset: number = 20) => {
    const tickSize = 4;
    const isH = orientation === 'h';
    
    // Main line
    const lx1 = isH ? x1 : x1 - offset;
    const ly1 = isH ? y1 - offset : y1;
    const lx2 = isH ? x2 : x2 - offset;
    const ly2 = isH ? y2 - offset : y2;

    return (
      <g className="dimension-line" opacity="0.6">
        {/* Extension lines */}
        <line x1={x1} y1={y1} x2={lx1} y2={ly1} stroke={dimensionColor} strokeWidth="0.5" />
        <line x1={x2} y1={y2} x2={lx2} y2={ly2} stroke={dimensionColor} strokeWidth="0.5" />
        
        {/* Main dimension line */}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={dimensionColor} strokeWidth="1" />
        
        {/* Ticks */}
        <line x1={lx1 - tickSize} y1={ly1 + tickSize} x2={lx1 + tickSize} y2={ly1 - tickSize} stroke={dimensionColor} strokeWidth="1" />
        <line x1={lx2 - tickSize} y1={ly2 + tickSize} x2={lx2 + tickSize} y2={ly2 - tickSize} stroke={dimensionColor} strokeWidth="1" />
        
        {/* Text */}
        <text 
          x={(lx1 + lx2) / 2} 
          y={isH ? ly1 - 5 : (ly1 + ly2) / 2} 
          textAnchor="middle" 
          fill={dimensionColor} 
          fontSize="9" 
          fontWeight="medium"
          transform={!isH ? `rotate(-90, ${(lx1 + lx2) / 2}, ${(ly1 + ly2) / 2})` : ''}
          dy={!isH ? -5 : 0}
        >
          {text}
        </text>
      </g>
    );
  };

  // Scaling factor for SVG
  const maxDim = Math.max(width, height);
  const scale = 250 / maxDim;
  const svgW = width * scale + 150;
  const svgH = height * scale + 150;
  const offsetX = 75;
  const offsetY = 75;

  const renderBeamSection = () => {
    const rectW = width * scale;
    const rectH = height * scale;
    const cover = 30 * scale;

    const stirrupPath = `M ${offsetX + cover} ${offsetY + cover} 
                         L ${offsetX + rectW - cover} ${offsetY + cover} 
                         L ${offsetX + rectW - cover} ${offsetY + rectH - cover} 
                         L ${offsetX + cover} ${offsetY + rectH - cover} Z`;

    return (
      <svg width={svgW} height={svgH} className="mx-auto overflow-visible">
        <defs>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={concreteColor} strokeWidth="0.5" opacity="0.1" />
          </pattern>
        </defs>

        {/* Concrete Hatching */}
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="url(#hatch)" />
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Stirrup */}
        <path d={stirrupPath} fill="none" stroke={stirrupColor} strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Dimensions */}
        {renderDimension(offsetX, offsetY, offsetX + rectW, offsetY, `${width} mm`, 'h', 30)}
        {renderDimension(offsetX, offsetY, offsetX, offsetY + rectH, `${height} mm`, 'v', 30)}

        {/* Top Rebars */}
        {Array.from({ length: top.count }).map((_, i) => {
          const x = offsetX + cover + (i * (rectW - 2 * cover)) / (top.count - 1 || 1);
          return (
            <g key={`top-${i}`}>
              <circle cx={x} cy={offsetY + cover} r={top.diameter * scale / 2} fill={topBarColor} className="shadow-lg" />
              {i === 0 && (
                <g>
                  <line x1={x} y1={offsetY + cover} x2={x - 20} y2={offsetY + cover - 30} stroke={topBarColor} strokeWidth="0.5" opacity="0.5" />
                  <text x={x - 22} y={offsetY + cover - 32} textAnchor="end" fill={topBarColor} fontSize="9" fontWeight="bold">{top.count}HA{top.diameter}</text>
                </g>
              )}
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
              {i === 0 && (
                <g>
                   <line x1={offsetX + cover} y1={y} x2={offsetX + cover - 20} y2={y} stroke={sideBarColor} strokeWidth="0.5" opacity="0.5" />
                   <text x={offsetX + cover - 22} y={y + 3} textAnchor="end" fill={sideBarColor} fontSize="8" fontWeight="bold">{sideBars.count * 2}HA{sideBars.diameter}</text>
                </g>
              )}
            </React.Fragment>
          );
        })}

        {/* Bottom Rebars */}
        {Array.from({ length: bottom.count }).map((_, i) => {
          const x = offsetX + cover + (i * (rectW - 2 * cover)) / (bottom.count - 1 || 1);
          return (
            <g key={`bot-${i}`}>
              <circle cx={x} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
              {i === 0 && (
                <g>
                  <line x1={x} y1={offsetY + rectH - cover} x2={x - 20} y2={offsetY + rectH - cover + 30} stroke={bottomBarColor} strokeWidth="0.5" opacity="0.5" />
                  <text x={x - 22} y={offsetY + rectH - cover + 35} textAnchor="end" fill={bottomBarColor} fontSize="9" fontWeight="bold">{bottom.count}HA{bottom.diameter}</text>
                </g>
              )}
            </g>
          );
        })}

        <text x={offsetX + rectW + 10} y={offsetY + rectH + 25} textAnchor="start" fill={stirrupColor} fontSize="9" fontStyle="italic">
          {t.stirrups}: HA{stirrups.diameter} @ {stirrups.spacing}mm
        </text>
      </svg>
    );
  };

  const renderBeamLongitudinal = () => {
    const viewW = 400;
    const lScale = viewW / length;
    const hScale = 150 / height; // Fixed height for visibility
    const drawH = height * hScale;
    const drawW = viewW;
    const lOffsetX = 75;
    const lOffsetY = 75;
    const cover = 30 * hScale;

    // Support visualization
    const supportW = 30;
    const supportH = 40;

    return (
      <svg width={viewW + 150} height={drawH + 150} className="mx-auto overflow-visible">
        {/* Concrete Hatching */}
        <rect x={lOffsetX} y={lOffsetY} width={drawW} height={drawH} fill="url(#hatch)" />
        
        {/* Supports */}
        {result.loads.ultimateMoment && (
          <>
            <rect 
              x={lOffsetX - supportW} 
              y={lOffsetY - 20} 
              width={supportW} 
              height={drawH + 40} 
              fill={concreteColor} 
              opacity="0.2" 
            />
            <rect 
              x={lOffsetX + drawW} 
              y={lOffsetY - 20} 
              width={supportW} 
              height={drawH + 40} 
              fill={concreteColor} 
              opacity="0.2" 
            />
          </>
        )}

        {/* Concrete Outline */}
        <rect x={lOffsetX} y={lOffsetY} width={drawW} height={drawH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Dimensions */}
        {renderDimension(lOffsetX, lOffsetY, lOffsetX + drawW, lOffsetY, `L = ${length} mm`, 'h', 30)}

        {/* Top Bars */}
        <line x1={lOffsetX + cover} y1={lOffsetY + cover} x2={lOffsetX + drawW - cover} y2={lOffsetY + cover} stroke={topBarColor} strokeWidth={result.reinforcement.top.count > 0 ? 3 : 1} />
        
        {/* Bottom Bars */}
        <line x1={lOffsetX + cover} y1={lOffsetY + drawH - cover} x2={lOffsetX + drawW - cover} y2={lOffsetY + drawH - cover} stroke={bottomBarColor} strokeWidth={result.reinforcement.bottom.count > 0 ? 3 : 1} />
        
        {/* Curtailment Markers */}
        {!result.reinforcement.stirrups.distribution?.length || result.reinforcement.stirrups.distribution.length === 3 ? (
          <>
            <line x1={lOffsetX + drawW * 0.15} y1={lOffsetY + drawH - cover - 5} x2={lOffsetX + drawW * 0.15} y2={lOffsetY + drawH - cover + 5} stroke={bottomBarColor} strokeWidth="1" />
            <line x1={lOffsetX + drawW * 0.85} y1={lOffsetY + drawH - cover - 5} x2={lOffsetX + drawW * 0.85} y2={lOffsetY + drawH - cover + 5} stroke={bottomBarColor} strokeWidth="1" />
            <text x={lOffsetX + drawW * 0.15} y={lOffsetY + drawH - cover + 15} textAnchor="middle" fill={bottomBarColor} fontSize="8" fontWeight="bold">0.15L</text>
            <text x={lOffsetX + drawW * 0.85} y={lOffsetY + drawH - cover + 15} textAnchor="middle" fill={bottomBarColor} fontSize="8" fontWeight="bold">0.15L</text>
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
                opacity={0.3 + (0.7 * (100 / zone.spacing))} 
              />
            );
          });
        })}

        <text x={lOffsetX + drawW / 2} y={lOffsetY + drawH + 45} textAnchor="middle" fill={stirrupColor} fontSize="9" fontStyle="italic">
          {t.stirrups}: {result.reinforcement.stirrups.distribution?.map(z => `${z.spacing}mm`).join(' | ')}
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
    const lOffsetY = 75;
    const cover = 30 * wScale;

    const tieSpacing = stirrups.spacing;
    const tieCount = Math.floor(3000 / tieSpacing);

    return (
      <svg width={viewW + 150} height={viewH + 150} className="mx-auto overflow-visible">
        {/* Concrete Hatching */}
        <rect x={lOffsetX} y={lOffsetY} width={drawW} height={drawH} fill="url(#hatch)" />
        <rect x={lOffsetX} y={lOffsetY} width={drawW} height={drawH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Dimensions */}
        {renderDimension(lOffsetX, lOffsetY, lOffsetX, lOffsetY + drawH, `H = 3000 mm`, 'v', 40)}

        {/* Main Bars */}
        <line x1={lOffsetX + cover} y1={lOffsetY} x2={lOffsetX + cover} y2={lOffsetY + drawH} stroke={bottomBarColor} strokeWidth="3" />
        <line x1={lOffsetX + drawW - cover} y1={lOffsetY} x2={lOffsetX + drawW - cover} y2={lOffsetY + drawH} stroke={bottomBarColor} strokeWidth="3" />

        {/* Ties */}
        {Array.from({ length: tieCount + 1 }).map((_, i) => {
          const y = lOffsetY + i * (tieSpacing * (viewH / 3000));
          if (y > lOffsetY + drawH) return null;
          return (
            <line key={`tie-${i}`} x1={lOffsetX} y1={y} x2={lOffsetX + drawW} y2={y} stroke={stirrupColor} strokeWidth="1" opacity="0.4" />
          );
        })}

        <text x={lOffsetX + drawW / 2} y={lOffsetY + drawH + 35} textAnchor="middle" fill={stirrupColor} fontSize="9" fontStyle="italic">{t.ties}: HA{stirrups.diameter} @ {stirrups.spacing}mm</text>
      </svg>
    );
  };

  const renderFootingSide = () => {
    const rectW = width * scale;
    const rectH = result.dimensions.length! * scale; // thickness
    const cover = 50 * scale;
    const colW = 300 * scale;

    return (
      <svg width={svgW} height={svgH} className="mx-auto overflow-visible">
        {/* Concrete Hatching */}
        <rect x={offsetX} y={offsetY + 50} width={rectW} height={rectH} fill="url(#hatch)" />
        <rect x={offsetX} y={offsetY + 50} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Dimensions */}
        {renderDimension(offsetX, offsetY + 50, offsetX, offsetY + 50 + rectH, `${result.dimensions.length} mm`, 'v', 40)}
        {renderDimension(offsetX, offsetY + 50 + rectH, offsetX + rectW, offsetY + 50 + rectH, `${width} mm`, 'h', -40)}

        {/* Column Starter */}
        <rect x={offsetX + (rectW - colW)/2} y={offsetY} width={colW} height={50} fill="none" stroke={concreteColor} strokeWidth="1" opacity="0.3" />
        <line x1={offsetX + (rectW - colW)/2 + 10} y1={offsetY} x2={offsetX + (rectW - colW)/2 + 10} y2={offsetY + 50 + rectH - cover} stroke={bottomBarColor} strokeWidth="2" />
        <line x1={offsetX + (rectW + colW)/2 - 10} y1={offsetY} x2={offsetX + (rectW + colW)/2 - 10} y2={offsetY + 50 + rectH - cover} stroke={bottomBarColor} strokeWidth="2" />

        {/* Bottom Mesh */}
        <line x1={offsetX + cover} y1={offsetY + 50 + rectH - cover} x2={offsetX + rectW - cover} y2={offsetY + 50 + rectH - cover} stroke={bottomBarColor} strokeWidth="2" />
      </svg>
    );
  };

  const renderColumnSection = () => {
    const rectW = width * scale;
    const rectH = height * scale;
    const cover = 30 * scale;

    return (
      <svg width={svgW} height={svgH} className="mx-auto overflow-visible">
        {/* Concrete Hatching */}
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="url(#hatch)" />
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        <rect x={offsetX + cover} y={offsetY + cover} width={rectW - 2 * cover} height={rectH - 2 * cover} fill="none" stroke={stirrupColor} strokeWidth="1" strokeDasharray="4 2" />

        {/* Dimensions */}
        {renderDimension(offsetX, offsetY, offsetX + rectW, offsetY, `${width} mm`, 'h', 30)}
        {renderDimension(offsetX, offsetY, offsetX, offsetY + rectH, `${height} mm`, 'v', 30)}

        {/* Corner Rebars */}
        <g>
          <circle cx={offsetX + cover} cy={offsetY + cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />
          <text x={offsetX + cover - 5} y={offsetY + cover - 5} textAnchor="end" fill={bottomBarColor} fontSize="8" fontWeight="bold">HA{bottom.diameter}</text>
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

        <text x={offsetX + rectW / 2} y={offsetY + rectH + 35} textAnchor="middle" fill={bottomBarColor} fontSize="9" fontWeight="bold">Main: {bottom.count}HA{bottom.diameter}</text>
      </svg>
    );
  };

  const renderFootingSection = () => {
    const rectW = width * scale;
    const rectH = height * scale;
    const cover = 50 * scale;

    return (
      <svg width={svgW} height={svgH} className="mx-auto overflow-visible">
        {/* Concrete Hatching */}
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="url(#hatch)" />
        <rect x={offsetX} y={offsetY} width={rectW} height={rectH} fill="none" stroke={concreteColor} strokeWidth="2" />
        
        {/* Dimensions */}
        {renderDimension(offsetX, offsetY, offsetX + rectW, offsetY, `${width} mm`, 'h', 30)}
        {renderDimension(offsetX, offsetY, offsetX, offsetY + rectH, `${height} mm`, 'v', 30)}

        {Array.from({ length: bottom.count }).map((_, i) => {
          const x = offsetX + cover + (i * (rectW - 2 * cover)) / (bottom.count - 1 || 1);
          return <circle key={`foot-${i}`} cx={x} cy={offsetY + rectH - cover} r={bottom.diameter * scale / 2} fill={bottomBarColor} />;
        })}
        <line x1={offsetX + cover} y1={offsetY + rectH - cover} x2={offsetX + rectW - cover} y2={offsetY + rectH - cover} stroke={bottomBarColor} strokeWidth="1" />
        
        {/* Cross bars */}
        {Array.from({ length: bottom.count }).map((_, i) => {
          const y = offsetY + cover + (i * (rectH - 2 * cover)) / (bottom.count - 1 || 1);
          return <line key={`cross-${i}`} x1={offsetX + cover} y1={y} x2={offsetX + rectW - cover} y2={y} stroke={bottomBarColor} strokeWidth="0.5" opacity="0.3" />;
        })}

        <text x={offsetX + rectW / 2} y={offsetY + rectH + 35} textAnchor="middle" fill={bottomBarColor} fontSize="9" fontWeight="bold">{t.mesh}: HA{bottom.diameter} @ {Math.round(width / bottom.count)}mm</text>
      </svg>
    );
  };

  const renderDiagrams = () => {
    if (!result.diagrams) return <div className="text-slate-500 text-xs">{t.noData}</div>;
    
    const viewW = 400;
    const viewH = 150;
    const dOffsetX = 60;
    const dOffsetY = 30;
    
    const { moment, shear } = result.diagrams;
    const maxM = Math.max(...moment.map(p => Math.abs(p.y)), 1);
    const maxV = Math.max(...shear.map(p => Math.abs(p.y)), 1);
    
    const mScale = (viewH / 2) / (maxM * 1.1);
    const vScale = (viewH / 2) / (maxV * 1.1);
    const xMultiplier = viewW / (result.dimensions.length! / 1000);

    const momentPath = moment.map((p, i) => `${i === 0 ? 'M' : 'L'} ${dOffsetX + p.x * xMultiplier} ${dOffsetY + viewH/2 + p.y * mScale}`).join(' ');
    const momentFill = `${momentPath} L ${dOffsetX + viewW} ${dOffsetY + viewH/2} L ${dOffsetX} ${dOffsetY + viewH/2} Z`;
    
    const shearPath = shear.map((p, i) => `${i === 0 ? 'M' : 'L'} ${dOffsetX + p.x * xMultiplier} ${dOffsetY + viewH/2 - p.y * vScale}`).join(' ');
    const shearFill = `${shearPath} L ${dOffsetX + viewW} ${dOffsetY + viewH/2} L ${dOffsetX} ${dOffsetY + viewH/2} Z`;

    return (
      <div className="space-y-12 py-4 w-full max-w-2xl mx-auto">
        {/* Moment Diagram */}
        <div className="relative group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              {t.moment}
            </p>
            <span className="text-[10px] font-mono text-orange-500/80 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
              {t.maxM}: {result.loads.ultimateMoment?.toFixed(1)} kNm
            </span>
          </div>
          <svg width="100%" viewBox={`0 0 ${viewW + 120} ${viewH + 80}`} className="overflow-visible">
            <defs>
              <linearGradient id="momentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={i} x1={dOffsetX} y1={dOffsetY + (i * viewH) / 4} x2={dOffsetX + viewW} y2={dOffsetY + (i * viewH) / 4} stroke={concreteColor} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />
            ))}
            {/* Axes */}
            <line x1={dOffsetX} y1={dOffsetY} x2={dOffsetX} y2={dOffsetY + viewH} stroke={concreteColor} strokeWidth="1.5" opacity="0.5" />
            <line x1={dOffsetX} y1={dOffsetY + viewH/2} x2={dOffsetX + viewW} y2={dOffsetY + viewH/2} stroke={concreteColor} strokeWidth="1.5" opacity="0.5" />
            
            {/* Diagram */}
            <path d={momentFill} fill="url(#momentGradient)" />
            <path d={momentPath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Labels */}
            <text x={dOffsetX - 10} y={dOffsetY + 5} textAnchor="end" fill={concreteColor} fontSize="8" opacity="0.6">+{maxM.toFixed(0)}</text>
            <text x={dOffsetX - 10} y={dOffsetY + viewH} textAnchor="end" fill={concreteColor} fontSize="8" opacity="0.6">-{maxM.toFixed(0)}</text>
            <text x={dOffsetX + viewW} y={dOffsetY + viewH/2 + 15} textAnchor="end" fill={concreteColor} fontSize="8" opacity="0.6">L = {result.dimensions.length!/1000}m</text>
          </svg>
        </div>

        {/* Shear Diagram */}
        <div className="relative group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              {t.shear}
            </p>
            <span className="text-[10px] font-mono text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {t.maxV}: {result.loads.ultimateShear?.toFixed(1)} kN
            </span>
          </div>
          <svg width="100%" viewBox={`0 0 ${viewW + 120} ${viewH + 80}`} className="overflow-visible">
            <defs>
              <linearGradient id="shearGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={i} x1={dOffsetX} y1={dOffsetY + (i * viewH) / 4} x2={dOffsetX + viewW} y2={dOffsetY + (i * viewH) / 4} stroke={concreteColor} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />
            ))}
            {/* Axes */}
            <line x1={dOffsetX} y1={dOffsetY} x2={dOffsetX} y2={dOffsetY + viewH} stroke={concreteColor} strokeWidth="1.5" opacity="0.5" />
            <line x1={dOffsetX} y1={dOffsetY + viewH/2} x2={dOffsetX + viewW} y2={dOffsetY + viewH/2} stroke={concreteColor} strokeWidth="1.5" opacity="0.5" />
            
            {/* Diagram */}
            <path d={shearFill} fill="url(#shearGradient)" />
            <path d={shearPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Labels */}
            <text x={dOffsetX - 10} y={dOffsetY + 5} textAnchor="end" fill={concreteColor} fontSize="8" opacity="0.6">+{maxV.toFixed(0)}</text>
            <text x={dOffsetX - 10} y={dOffsetY + viewH} textAnchor="end" fill={concreteColor} fontSize="8" opacity="0.6">-{maxV.toFixed(0)}</text>
            <text x={dOffsetX + viewW} y={dOffsetY + viewH/2 + 15} textAnchor="end" fill={concreteColor} fontSize="8" opacity="0.6">L = {result.dimensions.length!/1000}m</text>
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

        {/* Drawing Info Overlay */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-0.5 pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {viewMode === 'section' ? (type === ElementType.FOOTING ? t.plan : t.section) : 
             viewMode === 'longitudinal' ? (type === ElementType.FOOTING ? t.side : t.longitudinal) : 
             t.diagrams}
          </span>
          <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Scale 1:50 (A4) • {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
