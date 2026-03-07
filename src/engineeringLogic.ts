import { BeamInputs, CalculationResult, ColumnInputs, FootingInputs, RebarConfig } from './types';

// Constants for Eurocode 2 / BAEL
const GAMMA_C = 1.5; // Concrete safety factor
const GAMMA_S = 1.15; // Steel safety factor
const F_YK = 500; // Steel yield strength (MPa)
const F_YD = F_YK / GAMMA_S; // Design steel strength

const LIVE_LOADS: Record<string, number> = {
  residential: 1.5, // kN/m2
  office: 2.5,
  storage: 5.0,
  roof: 1.0,
};

const CONCRETE_GRADES: Record<string, number> = {
  'C20/25': 20,
  'C25/30': 25,
  'C30/37': 30,
  'C35/45': 35,
};

const REBAR_DIAMETERS = [8, 10, 12, 14, 16, 20, 25, 32];

function getRebarArea(diameter: number): number {
  return (Math.PI * Math.pow(diameter / 10, 2)) / 4; // cm2
}

function selectRebars(requiredArea: number): RebarConfig {
  // Try to find a combination with count <= 4 first
  for (const d of REBAR_DIAMETERS.filter(d => d >= 12)) {
    for (const count of [2, 3, 4]) {
      const area = getRebarArea(d) * count;
      if (area >= requiredArea) {
        return { diameter: d, count, area };
      }
    }
  }
  // If not possible with <= 4, allow up to 6
  for (const d of REBAR_DIAMETERS.filter(d => d >= 12)) {
    for (const count of [5, 6]) {
      const area = getRebarArea(d) * count;
      if (area >= requiredArea) {
        return { diameter: d, count, area };
      }
    }
  }
  return { diameter: 32, count: 6, area: getRebarArea(32) * 6 };
}

const SLAB_DENSITIES: Record<string, number> = {
  solid: 25, // kN/m3
  hollow: 15, // kN/m3 (Simplified)
  precast: 20, // kN/m3
};

export function calculateBeam(inputs: BeamInputs): CalculationResult {
  const { span, tributaryWidth, slabSurface, slabThickness, slabType, isCantilever, liveLoadType, concreteGrade } = inputs;
  
  // Use slabSurface to override tributaryWidth if provided
  const effectiveTributaryWidth = slabSurface ? (slabSurface / span) : tributaryWidth;
  
  // 1. Loads
  const density = SLAB_DENSITIES[slabType] || 25;
  const g_slab = (slabThickness / 1000) * density; // kN/m2
  const q_live = LIVE_LOADS[liveLoadType];
  
  // Predimensioning Beam (EC2/BAEL)
  // Simple: L/15 <= h <= L/10. Cantilever: L/10
  const h_ratio = isCantilever ? 10 : 12; // Using 12 as a safe middle ground
  let h = Math.ceil((span * 1000) / h_ratio / 50) * 50; 
  h = Math.max(h, 200); // Minimum height 20cm
  
  let b = Math.ceil((h * 0.4) / 50) * 50; 
  b = Math.max(b, 200); // Minimum width 20cm
  
  const g_beam = (b / 1000) * (h / 1000) * 25;
  const g_total = (g_slab * effectiveTributaryWidth) + g_beam;
  const q_total = q_live * effectiveTributaryWidth;
  
  const p_u = 1.35 * g_total + 1.5 * q_total; // ULS Load (kN/m)
  
  // Moment and Shear
  let M_u: number;
  let V_u: number;
  
  if (isCantilever) {
    M_u = (p_u * Math.pow(span, 2)) / 2;
    V_u = p_u * span;
  } else {
    M_u = (p_u * Math.pow(span, 2)) / 8;
    V_u = (p_u * span) / 2;
  }
  
  // 2. Reinforcement (ULS)
  const f_ck = CONCRETE_GRADES[concreteGrade] || 25;
  const f_cd = f_ck / GAMMA_C;
  const d_eff = h - 40; // 40mm cover
  
  // Dimensionless moment mu
  const mu = (M_u * 1e6) / (b * Math.pow(d_eff, 2) * f_cd);
  
  // Lever arm z
  const alpha = 1.25 * (1 - Math.sqrt(1 - 2 * mu));
  const z = d_eff * (1 - 0.4 * alpha);
  
  const A_s_req = (M_u * 1e6) / (z * F_YD); // mm2
  const A_s_cm2 = A_s_req / 100;
  
  let bottomBars: RebarConfig;
  let topBars: RebarConfig;
  
  if (isCantilever) {
    // For cantilever, main reinforcement is at the top (tension zone)
    topBars = selectRebars(A_s_cm2);
    // Bottom bars are nominal/compression, but EC2 requires min reinforcement
    bottomBars = selectRebars(Math.max(A_s_cm2 * 0.25, 0.0013 * b * d_eff / 100)); 
  } else {
    // For simple beam, main reinforcement is at the bottom
    bottomBars = selectRebars(A_s_cm2);
    topBars = selectRebars(Math.max(A_s_cm2 * 0.2, 0.0013 * b * d_eff / 100));
  }
  
  // Side bars if h > 600mm
  let sideBars: RebarConfig | undefined = undefined;
  if (h > 600) {
    sideBars = { diameter: 12, count: 2, area: getRebarArea(12) * 2 };
  }
  
  // 3. Stirrups Distribution
  const max_spacing = Math.min(0.75 * d_eff, 400);
  const s_t_calc = (0.9 * d_eff * F_YD * getRebarArea(8) * 2 * 100) / (V_u * 1000);
  const s_t = Math.max(100, Math.min(max_spacing, Math.floor(s_t_calc / 10) * 10));
  
  let distribution: { spacing: number; length: number }[] = [];
  const totalLengthMm = span * 1000;
  
  if (isCantilever) {
    distribution = [
      { spacing: s_t, length: totalLengthMm * 0.3 },
      { spacing: Math.min(max_spacing, s_t * 1.5), length: totalLengthMm * 0.7 }
    ];
  } else {
    distribution = [
      { spacing: s_t, length: totalLengthMm * 0.25 },
      { spacing: Math.min(max_spacing, s_t * 1.5), length: totalLengthMm * 0.5 },
      { spacing: s_t, length: totalLengthMm * 0.25 }
    ];
  }
  
  // 4. Deformation (Simplified SLS)
  const p_s = g_total + q_live * effectiveTributaryWidth; // SLS Load (kN/m)
  const E_concrete = 30000; // MPa
  const I_gross = (b * Math.pow(h, 3)) / 12; // mm4
  const L_mm = span * 1000;
  let deformation = isCantilever 
    ? (p_s * Math.pow(L_mm, 4)) / (8 * E_concrete * I_gross * 1000)
    : (5 * p_s * Math.pow(L_mm, 4)) / (384 * E_concrete * I_gross * 1000);

  // 5. Diagram Data
  const points = 20;
  const momentDiagram = [];
  const shearDiagram = [];
  for (let i = 0; i <= points; i++) {
    const x = (span * i) / points;
    let mx, vx;
    if (isCantilever) {
      mx = -(p_u * Math.pow(span - x, 2)) / 2;
      vx = p_u * (span - x);
    } else {
      mx = (p_u * x / 2) * (span - x);
      vx = p_u * (span / 2 - x);
    }
    momentDiagram.push({ x, y: mx });
    shearDiagram.push({ x, y: vx });
  }

  // Calculate actual capacity M_Rd
  const tensionBars = isCantilever ? topBars : bottomBars;
  const M_Rd = (tensionBars.area * 100 * F_YD * z) / 1e6; // kNm
  const utilization = Math.min(0.98, Math.max(M_u / M_Rd, V_u / 500)); // simplified shear check

  return {
    dimensions: { width: b, height: h, length: totalLengthMm },
    reinforcement: {
      bottom: bottomBars,
      top: topBars,
      sideBars: sideBars,
      stirrups: { diameter: 8, spacing: s_t, distribution }
    },
    loads: { 
      ultimateMoment: M_u, 
      ultimateShear: V_u, 
      deadLoad: g_total, 
      utilization,
      deformation
    },
    diagrams: {
      moment: momentDiagram,
      shear: shearDiagram
    }
  };
}

export function calculateColumn(inputs: ColumnInputs): CalculationResult {
  const { tributaryArea, numberOfFloors, slabThickness, liveLoadType, concreteGrade, beamWidth } = inputs;
  
  const g_slab = (slabThickness / 1000) * 25;
  const q_live = LIVE_LOADS[liveLoadType];
  
  const loadPerFloor = tributaryArea * (g_slab + q_live);
  const totalServiceLoad = loadPerFloor * numberOfFloors;
  const N_u = 1.35 * (totalServiceLoad * 0.8) + 1.5 * (totalServiceLoad * 0.2); // ULS estimate
  
  const f_ck = CONCRETE_GRADES[concreteGrade] || 25;
  const f_cd = f_ck / GAMMA_C;
  
  // Predimensioning Column (Buckling λ consideration)
  const requiredArea = (N_u * 1000) / (0.6 * f_cd); 
  
  let side = Math.ceil(Math.sqrt(requiredArea) / 50) * 50;
  side = Math.max(side, 200); // Minimum width 20cm
  
  // If beam width is provided, ensure column side is at least as wide as the beam
  if (beamWidth) {
    side = Math.max(side, beamWidth);
  }
  
  const A_s_min_1 = (0.1 * N_u * 1000) / F_YD;
  const A_s_min_2 = 0.002 * (side * side);
  const A_s_req = Math.max(A_s_min_1, A_s_min_2, 0.01 * (side * side)); 
  
  const bars = selectRebars(A_s_req / 100);
  
  // Calculate actual capacity N_Rd
  const N_Rd = (0.8 * ((side * side * f_cd) + (bars.area * 100 * F_YD))) / 1000; // kN
  const utilization = Math.min(0.98, N_u / N_Rd);
  
  return {
    dimensions: { width: side, height: side },
    reinforcement: {
      bottom: bars,
      top: bars,
      stirrups: { diameter: 8, spacing: Math.min(side, 300) }
    },
    loads: { axialLoad: N_u, utilization, deformation: 0 }
  };
}

export function calculateFooting(inputs: FootingInputs): CalculationResult {
  const { axialLoad, soilBearingCapacity, concreteGrade } = inputs;
  
  const N_ser = axialLoad / 1.4;
  const requiredSurface = (N_ser / 1000) / soilBearingCapacity; // m2
  
  let side = Math.ceil(Math.sqrt(requiredSurface) * 1000 / 100) * 100;
  side = Math.max(side, 600);
  
  const thickness = Math.ceil((side - 300) / 4 / 50) * 50 + 150; 
  const d_eff = thickness - 50; 
  
  const col_side = 300; 
  const A_s_req = (axialLoad * 1000 * (side - col_side)) / (8 * d_eff * F_YD); // mm2
  
  const bars = selectRebars(A_s_req / 100);

  // Utilization based on soil bearing
  const actualPressure = (N_ser / 1000) / (Math.pow(side / 1000, 2));
  const utilization = Math.min(0.98, actualPressure / soilBearingCapacity);

  return {
    dimensions: { width: side, height: side, length: thickness },
    reinforcement: {
      bottom: bars,
      top: { diameter: 0, count: 0, area: 0 },
      stirrups: { diameter: 0, spacing: 0 }
    },
    loads: { axialLoad, utilization, deformation: 0 }
  };
}
