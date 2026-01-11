
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
  date: string;
  memberId: string;
  memberName: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'Admin' | 'Member';
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
