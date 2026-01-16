
import { BirdSpecies, Language } from './types';

export const PAKISTAN_SPECIES: BirdSpecies[] = [
  {
    id: 'siberian-crane-001',
    name: { en: 'Siberian Crane', ar: 'الكركي السيبيري' },
    scientificName: 'Grus leucogeranus',
    maxAltitude: 10000,
    typicalSpeed: 80,
    status: { en: 'Migrating from Siberia', ar: 'مهاجر من سيبيريا' },
    description: { 
      en: 'A critically endangered species migrating from the Siberian tundra to the wetlands of South Asia.',
      ar: 'نوع مهدد بالانقراض بشدة يهاجر من التندرا السيبيرية إلى الأراضي الرطبة في جنوب آسيا.'
    },
    image: 'https://images.unsplash.com/photo-1520114004381-68937397e5d8?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'steppe-eagle-002',
    name: { en: 'Steppe Eagle', ar: 'عقاب السهوب' },
    scientificName: 'Aquila nipalensis',
    maxAltitude: 6000,
    typicalSpeed: 60,
    status: { en: 'Wintering', ar: 'يشتو' },
    description: {
      en: 'A powerful raptor that breeds in the Siberian steppes and winters across Pakistan and India.',
      ar: 'جوارح قوية تتكاثر في سهوب سيبيريا وتشتو في باكستان والهند.'
    },
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'saker-001',
    name: { en: 'Saker Falcon', ar: 'صقر الغزال' },
    scientificName: 'Falco cherrug',
    maxAltitude: 5000,
    typicalSpeed: 150,
    status: { en: 'Migrating', ar: 'مهاجر' },
    description: { 
      en: 'A high-speed hunter migrating through Balochistan. Highly prized in traditional falconry (Miqnas).',
      ar: 'صياد عالي السرعة يهاجر عبر بلوشستان. يحظى بتقدير كبير في الصيد التقليدي (المقناص).'
    },
    image: 'https://images.unsplash.com/photo-1506190503911-eb67652e258b?auto=format&fit=crop&q=80&w=600'
  }
];

export const UI_STRINGS: Record<Language, any> = {
  en: {
    title: 'Miqnas Siberia-Indus Link',
    db: 'High-Altitude Tracking DB',
    telemetry: 'Satellite Telemetry Active',
    tracking: 'Tracking',
    analyze: 'Analyze Behavior',
    predict: 'Predict Path (1h)',
    togglePrediction: 'Show Predicted Path',
    maxAlt: 'Max Altitude',
    speed: 'Air Speed',
    temp: 'Thermal Temp',
    heartRate: 'Heart Rate',
    brain: 'Gemini Intelligence Analysis',
    behavior: 'Flight Behavior',
    envRisk: 'Regional Environmental Risk',
    recs: 'Conservation & Tracking Notes',
    stats: 'Regional Statistics',
    samples: 'Telemetry Blocks',
    gforce: 'Vertical Velocity',
    o2: 'Thermal Efficiency',
    lastUpdate: 'Satellite Sync Active',
    origin: 'SIBERIAN FLYWAY',
    extreme: 'HIGH ALTITUDE FLIGHT',
    chatTitle: 'Tactical Assistant',
    chatPlaceholder: 'Ask about migration or locations...',
    voiceTitle: 'Live Comms',
    voiceStart: 'Establish Live Link',
    voiceStop: 'Terminate Link',
    sources: 'Verified Sources',
    liveTelemetry: 'Live Biometric Feed'
  },
  ar: {
    title: 'رابط مقناص سيبيريا-السند',
    db: 'قاعدة بيانات التتبع',
    telemetry: 'القياسات القمرية نشطة',
    tracking: 'تتبع',
    analyze: 'تحليل السلوك',
    predict: 'توقع المسار (1س)',
    togglePrediction: 'إظهار المسار المتوقع',
    maxAlt: 'أقصى ارتفاع',
    speed: 'سرعة الهواء',
    temp: 'الحرارة الحرارية',
    heartRate: 'معدل نبضات القلب',
    brain: 'تحليل ذكاء جمناي',
    behavior: 'سلوك الطيران',
    envRisk: 'المخاطر البيئية الإقليمية',
    recs: 'ملاحظات الحفظ والتتبع',
    stats: 'الإحصاءات الإقليمية',
    samples: 'كتل البيانات',
    gforce: 'السرعة الرأسية',
    o2: 'الكفاءة الحرارية',
    lastUpdate: 'مزامنة القمر الصناعي نشطة',
    origin: 'مسار سيبيريا',
    extreme: 'طيران عالي الارتفاع',
    chatTitle: 'المساعد التكتيكي',
    chatPlaceholder: 'اسأل عن الهجرة أو المواقع...',
    voiceTitle: 'اتصالات حية',
    voiceStart: 'إنشاء رابط حي',
    voiceStop: 'إنهاء الرابط',
    sources: 'مصادر موثقة',
    liveTelemetry: 'تغذية القياس الحيوي'
  }
};

export const MOCK_TRACKING_DATA = (speciesId: string) => {
  const isHighAlt = speciesId.includes('crane') || speciesId.includes('eagle');
  const baseAlt = isHighAlt ? 4000 : 2000;
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: `${i}:00`,
    lat: 25 + Math.sin(i / 8) * 3,
    lng: 65 + Math.cos(i / 8) * 4,
    altitude: baseAlt + Math.random() * (isHighAlt ? 4000 : 1000),
    heartRate: isHighAlt ? 140 + Math.random() * 60 : 180 + Math.random() * 80,
    temperature: 15 + Math.random() * 25
  }));
};
