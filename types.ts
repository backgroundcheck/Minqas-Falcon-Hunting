
export type Language = 'en' | 'ar';

export interface BirdSpecies {
  id: string;
  name: { en: string; ar: string };
  scientificName: string;
  maxAltitude: number;
  typicalSpeed: number;
  status: { en: string; ar: string };
  description: { en: string; ar: string };
  image: string;
}

export interface TrackingPoint {
  timestamp: string;
  lat: number;
  lng: number;
  altitude: number;
  heartRate: number;
  temperature: number;
}

export interface PredictionPoint {
  lat: number;
  lng: number;
  altitude: number;
  timestamp: string;
}

export interface RiskFactor {
  factor: string;
  severity: number; // 1-10
}

export interface AnalysisResult {
  behaviorSummary: string;
  climateImpact: string;
  environmentalRisk: string; // The descriptive text
  environmentalRiskScore: number; // 0-100 overall score
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
}
