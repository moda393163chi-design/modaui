export type FlowStep = 
  | 'LANDING' 
  | 'CHOOSE_INDUSTRY' 
  | 'LOGIN' 
  | 'SELECT_MODE' 
  | 'SELECT_TEMPLATE' 
  | 'ONBOARDING' 
  | 'DASHBOARD'
  | 'CUSTOMER_STOREFRONT'
  | 'AI_TEAMS'
  | 'AI_RUNTIME'
  | 'KNOWLEDGE_BASE'
  | 'PLATFORM_ADMIN'
  | 'SYSTEM_BASE';

export interface Industry {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  desc: string;
}

export interface TeamMember {
  role: string;
  emoji: string;
  name: string;
  desc: string;
  status: 'offline' | 'recruiting' | 'active' | 'sleeping';
  tasks: string[];
}

export interface IndustryData {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  bgColor: string;
  team: TeamMember[];
}

export interface TemplateOption {
  id: string;
  name: string;
  industry: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
}

export interface OperatingStrategy {
  id: string;
  name: string;
  tag: string;
  desc: string;
  intensity: 'low' | 'medium' | 'high';
}

export interface TaskLog {
  id: string;
  timestamp: string;
  sender: string;
  emoji: string;
  message: string;
  type: 'info' | 'success' | 'alert';
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  emoji: string;
  message: string;
  timestamp: string;
  isUser: boolean;
  actionDetected?: {
    type: string;
    title: string;
    success: boolean;
    param1?: string;
    param2?: string;
  };
  generatedPoster?: {
    title: string;
    subtitle: string;
    theme: string;
    image: string;
    isDeployed: boolean;
  };
  generatedCopywriting?: {
    title: string;
    body: string;
    tags: string[];
    rating: number;
    emotionalScore: number;
    tone: 'classic' | 'hype' | 'intellectual';
  };
  generatedPrediction?: {
    name: string;
    price: number;
    markup: number;
    cost: number;
    predictedROI: number;
    isUploaded: boolean;
  };
  analyzedImage?: {
    name: string;
    detectedSPUs: string[];
    colorPalette: string[];
    suggestedPrice: number;
    textIdea: string;
    imageBase64: string;
  };
}
