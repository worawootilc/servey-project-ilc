export type QuestionType =
  | 'image-choice'
  | 'menu-combo'
  | 'single-choice'
  | 'multi-choice'
  | 'rating'
  | 'scale-10'
  | 'short-text'
  | 'long-text';

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

export interface SurveyQuestion {
  id: string;
  sectionId: string;
  type: QuestionType;
  title: string;
  helperText?: string;
  required: boolean;
  active: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  maxRating?: number;
}

export interface SurveySection {
  id: string;
  numberLabel: string;
  title: string;
  subtitle: string;
}

export interface RosterMember {
  id: string;
  order: number;
  fullName: string;
  role: 'คณาจารย์ / บุคลากร' | 'วิทยากร';
}

export interface SurveySchema {
  id: string;
  title: string;
  subtitle: string;
  budgetLimitBaht: number;
  estimatedMinutes: number;
  updatedAt: string;
  googleSheetUrl?: string;
  appsScriptUrl?: string;
  roster: RosterMember[];
  sections: SurveySection[];
  questions: SurveyQuestion[];
}

export interface MenuComboSelection {
  foodId: string | null;
  foodName: string | null;
  foodPrice: number;
  drinkId: string | null;
  drinkName: string | null;
  drinkTemp: 'ICE' | 'HOT' | null;
  drinkBasePrice: number;
  drinkAddons: string[];
  drinkAddonsPrice: number;
  totalPrice: number;
}

export type AnswerValue = string | string[] | number | MenuComboSelection;

export interface SheetSyncResult {
  attempted: boolean;
  synced: boolean;
  message: string;
}

export interface SurveyResponseRecord {
  id: string;
  submittedAt: string;
  respondentId?: string;
  respondentName: string;
  answers: Record<string, AnswerValue>;
  sheetSync?: SheetSyncResult;
}
