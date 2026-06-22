export type CaseStatus = 'Open' | 'Pending' | 'Closed' | 'Appealed';
export type CaseType = 'Grievance' | 'Disciplinary' | 'Arbitration' | 'Unfair Labor Practice';

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  filingDate: string;
  hearingDate?: string;
  employee: string;
  union?: string;
  department: string;
  assignedTo: string;
  description: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  caseNumber: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  unionMember: boolean;
}
