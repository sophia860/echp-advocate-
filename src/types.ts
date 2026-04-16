export type CaseStage = 
  | 'Pre-request' 
  | 'Request Submitted' 
  | 'Assessment' 
  | 'Draft Plan' 
  | 'Finalized' 
  | 'Review/Appeals' 
  | 'Tribunal Prep';

export interface CaseDoc {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'reviewed' | 'pending' | 'flagged';
  analysis?: string;
  flagsCount?: number;
}

export interface Communication {
  id: string;
  title: string;
  to: string;
  status: 'draft' | 'sent' | 'received';
  date: string;
  content: string;
  isAiGenerated: boolean;
}

export interface Case {
  childName: string;
  age: number;
  laName: string;
  currentStage: CaseStage;
  nextDeadline: string;
  deadlineLabel: string;
  docs: CaseDoc[];
  comms: Communication[];
}
