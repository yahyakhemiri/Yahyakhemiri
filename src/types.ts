export enum ElementType {
  BEAM = 'BEAM',
  COLUMN = 'COLUMN',
  FOOTING = 'FOOTING'
}

export interface RebarConfig {
  diameter: number;
  count: number;
  area: number; // cm2
}

export interface StirrupZone {
  spacing: number;
  length: number; // mm
}

export type Language = 'en' | 'ar';

export interface OptimizationMetrics {
  asMin: number; // cm2
  asMax: number; // cm2
  asCalculated: number; // cm2
  steelRatio: number; // %
  constructabilityScore: number; // 1-10
  spacing: number; // mm
  clearSpacing: number; // mm
  recommendation: string;
}

export interface CalculationResult {
  dimensions: {
    width: number; // mm
    height: number; // mm
    length?: number; // mm
  };
  reinforcement: {
    bottom: RebarConfig;
    top: RebarConfig;
    sideBars?: RebarConfig;
    stirrups: {
      diameter: number;
      spacing: number; // mm
      distribution?: StirrupZone[];
    };
  };
  loads: {
    ultimateMoment?: number; // kNm
    ultimateShear?: number; // kN
    axialLoad?: number; // kN
    deadLoad?: number; // kN/m
    utilization: number; // 0 to 1
    deformation?: number; // mm
  };
  diagrams?: {
    moment: { x: number; y: number }[];
    shear: { x: number; y: number }[];
  };
  optimization?: OptimizationMetrics;
}

export interface BeamInputs {
  span: number; // m
  tributaryWidth: number; // m
  slabSurface?: number; // m2
  slabThickness: number; // mm
  slabType: 'solid' | 'hollow' | 'precast';
  isCantilever: boolean;
  liveLoadType: 'residential' | 'office' | 'storage' | 'roof';
  concreteGrade: string; // e.g., C25/30
}

export interface ColumnInputs {
  tributaryArea: number; // m2
  numberOfFloors: number;
  slabThickness: number; // mm
  liveLoadType: 'residential' | 'office' | 'storage' | 'roof';
  concreteGrade: string;
  beamWidth?: number; // mm
}

export interface FootingInputs {
  axialLoad: number; // kN
  soilBearingCapacity: number; // MPa
  concreteGrade: string;
}
