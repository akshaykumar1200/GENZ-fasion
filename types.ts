
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

export interface WardrobeItem {
  id: string;
  imageUrl: string;
  category: 'Top' | 'Bottom' | 'Outerwear' | 'Shoes' | 'Accessory' | 'One-Piece';
  tags: string[];
  addedAt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  originalImage: string;
  recommendation: RecommendationResponse;
  vibe: StyleVibe;
}

export interface DayPlan {
  day: number;
  vibe: string;
  outfit: string;
  wardrobeItemId?: string; 
  doWear: string;
  dontWear: string;
  colorPalette: string[];
  isOccasion?: boolean;
  occasionType?: string;
}

export interface MonthlyPlan {
  month: string;
  year: number;
  plans: DayPlan[];
}

export interface TripDetails {
  destination: string;
  startDate: string;
  endDate: string;
  purpose: 'Vacation' | 'Business' | 'Adventure' | 'Party';
  vehicle: 'Plane' | 'Car' | 'Train' | 'Bike';
}

export interface PackingItem {
  item: string;
  category: 'Clothes' | 'Toiletries' | 'Tech' | 'Documents';
  isPacked: boolean;
  reason: string;
}

export interface TripPlan {
  weatherSummary: string;
  outfitStrategy: string;
  packingList: PackingItem[];
  shoppingList: string[];
}

export interface TrackingLog {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
}
