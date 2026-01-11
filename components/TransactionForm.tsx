
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction, Category, FamilyMember } from '../types';

interface Props {
  initialData?: Transaction;
  categories: Category[];
  members: FamilyMember[];
  onAddCategory: (cat: Category) => void;
  onAdd: (transaction: Transaction) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<Props> = ({ initialData, categories, members, onAddCategory, onAdd, onClose }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [description, setDescription] = useState('');
  const [memberId, setMemberId] = useState(members[0]?.id || '');

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✨');

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setDescription(initialData.description);
      setMemberId(initialData.memberId);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const member = members.find(m => m.id === memberId);

    const transactionData: Transaction = {
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      amount: Number(amount),
      type,
      category,
      description,
      date: initialData ? initialData.date : new Date().toISOString(),
      memberId,
      memberName: member?.name || '未知',
    };

    onAdd(transactionData);
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCatName.trim(),
      icon: newCatIcon || '✨',
      color: 'bg-blue-500'
    };
    onAddCategory(newCat);
    setCategory(newCat.name);
    setIsAddingCategory(false);
    setNewCatName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {initialData ? '修改账目' : '记一笔'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <i className="fa-solid fa-xmark text-slate-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 shadow-sm text-red-500' : 'text-slate-500'}`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 shadow-sm text-green-500' : 'text-slate-500'}`}
            >
              收入
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">¥</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-2xl font-bold focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                分类
                <button 
                  type="button" 
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  + 自定义
                </button>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">成员</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">备注</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="想说点什么..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98] ${initialData ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
          >
            {initialData ? '更新账目' : '保存账目'}
          </button>
        </form>
      </div>

      {/* Sub-modal for adding category */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold">新增分类</h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">图标 (Emoji)</label>
              <input 
                type="text" 
                value={newCatIcon} 
                onChange={e => setNewCatIcon(e.target.value)} 
                className="w-full p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-center text-xl"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">分类名称</label>
              <input 
                type="text" 
                placeholder="如: 宠物" 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full p-2 bg-slate-100 dark:bg-slate-900 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAddingCategory(false)}
                className="flex-1 py-2 text-slate-500 font-medium"
              >
                取消
              </button>
              <button 
                onClick={handleCreateCategory}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
