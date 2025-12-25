
export enum BodyType {
  RECTANGLE = 'Rectangle',
  HOURGLASS = 'Hourglass',
  PEAR = 'Pear',
  INVERTED_TRIANGLE = 'Inverted Triangle',
  APPLE = 'Apple',
  ATHLETIC = 'Athletic',
  SLIM_PETITE = 'Slim / Petite',
  PLUS_CURVY = 'Plus / Curvy',
  TALL_LEAN = 'Tall & Lean',
  MUSCULAR = 'Muscular / Broad'
}

export enum StyleVibe {
  STREETWEAR = 'Streetwear',
  MINIMALIST = 'Minimalist',
  Y2K = 'Y2K / Retro',
  GORPCORE = 'Gorpcore',
  OLD_MONEY = 'Old Money',
  INDO_WESTERN = 'Indo-Western Fusion',
  FORMAL = 'Desi Formal / Sherwani-Core',
  DENIM_MAXIMALIST = 'Denim Maximalist',
  ATHLEISURE = 'Athleisure',
  GRUNGE = 'Desi Grunge',
  PREPPY = 'Academia / Preppy'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bodyType: BodyType;
  styleVibe: StyleVibe;
  signedUpAt: string;
}

export interface RecommendationResponse {
  complementaryColors: string[];
  outfitSuggestion: {
    top?: string;
    bottom?: string;
    outerwear?: string;
    shoes?: string;
    accessories: string[];
  };
  stylingTips: string[];
  vibeDescription: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  originalImage: string;
  recommendation: RecommendationResponse;
  vibe: StyleVibe;
}

export interface TrackingLog {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: 'SIGN_UP' | 'LOGIN' | 'IMAGE_UPLOAD' | 'RECOMMENDATION_GEN' | 'LOGOUT' | 'EXIT' | 'FEEDBACK' | 'STYLE_SAVED' | 'COLOR_CHANGED';
  details: string;
}
