
import { Category, FamilyMember, Transaction, TransactionType } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: '餐饮', icon: '🍔', color: 'bg-orange-500' },
  { id: '2', name: '购物', icon: '🛍️', color: 'bg-pink-500' },
  { id: '3', name: '交通', icon: '🚗', color: 'bg-blue-500' },
  { id: '4', name: '住房', icon: '🏠', color: 'bg-indigo-500' },
  { id: '5', name: '娱乐', icon: '🎮', color: 'bg-purple-500' },
  { id: '6', name: '医疗', icon: '🏥', color: 'bg-red-500' },
  { id: '7', name: '教育', icon: '📚', color: 'bg-teal-500' },
  { id: '8', name: '工资', icon: '💰', color: 'bg-green-500' },
  { id: '9', name: '奖金', icon: '🏆', color: 'bg-yellow-500' },
  { id: '10', name: '其他', icon: '✨', color: 'bg-gray-500' },
];

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: '我', role: 'Admin', avatar: 'https://picsum.photos/seed/user1/100/100' },
  { id: 'm2', name: '另一半', role: 'Member', avatar: 'https://picsum.photos/seed/user2/100/100' },
  { id: 'm3', name: '孩子', role: 'Member', avatar: 'https://picsum.photos/seed/user3/100/100' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 50, category: '餐饮', type: TransactionType.EXPENSE, description: '早餐', date: new Date().toISOString(), memberId: 'm1', memberName: '我' },
  { id: 't2', amount: 12000, category: '工资', type: TransactionType.INCOME, description: '月度工资', date: new Date().toISOString(), memberId: 'm1', memberName: '我' },
  { id: 't3', amount: 3500, category: '住房', type: TransactionType.EXPENSE, description: '房租', date: new Date().toISOString(), memberId: 'm2', memberName: '另一半' },
];
