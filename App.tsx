
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Transaction, TransactionType, Category, Ledger, FamilyMember } from './types';
import { CATEGORIES as DEFAULT_CATEGORIES, FAMILY_MEMBERS as DEFAULT_MEMBERS, INITIAL_TRANSACTIONS } from './constants.tsx';
import { analyzeFinances } from './services/geminiService';
import TransactionForm from './components/TransactionForm';

const INITIAL_LEDGERS: Ledger[] = [
  {
    id: 'l1',
    name: '日常家庭账本',
    icon: '🏠',
    description: '记录家庭日常开销',
    members: DEFAULT_MEMBERS,
    categories: DEFAULT_CATEGORIES,
    transactions: INITIAL_TRANSACTIONS
  },
  {
    id: 'l2',
    name: '个人私房钱',
    icon: '🤫',
    description: '个人小金库记录',
    members: [DEFAULT_MEMBERS[0]],
    categories: DEFAULT_CATEGORIES,
    transactions: []
  }
];

const App: React.FC = () => {
  const [ledgers, setLedgers] = useState<Ledger[]>(INITIAL_LEDGERS);
  const [activeLedgerId, setActiveLedgerId] = useState<string>(INITIAL_LEDGERS[0].id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'ai'>('overview');
  const [aiReport, setAiReport] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New Ledger Form State
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerIcon, setNewLedgerIcon] = useState('📅');

  // Active Ledger Helpers
  const activeLedger = useMemo(() => 
    ledgers.find(l => l.id === activeLedgerId) || ledgers[0], 
    [ledgers, activeLedgerId]
  );

  const transactions = activeLedger.transactions;
  const categories = activeLedger.categories;
  const members = activeLedger.members;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Statistics
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === TransactionType.EXPENSE) acc.expense += t.amount;
        else acc.income += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const balance = totals.income - totals.expense;

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      
      const transactionDate = new Date(t.date).getTime();
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      
      const matchesStartDate = !start || transactionDate >= start;
      const matchesEndDate = !end || transactionDate <= end;
      
      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [transactions, searchTerm, filterCategory, startDate, endDate]);

  const updateActiveLedger = (updates: Partial<Ledger>) => {
    setLedgers(prev => prev.map(l => l.id === activeLedgerId ? { ...l, ...updates } : l));
  };

  const handleAddOrUpdate = (t: Transaction) => {
    let newTransactions;
    if (editingTransaction) {
      newTransactions = transactions.map(item => item.id === t.id ? t : item);
    } else {
      newTransactions = [t, ...transactions];
    }
    updateActiveLedger({ transactions: newTransactions });
    setEditingTransaction(undefined);
  };

  const handleAddCategory = (newCat: Category) => {
    updateActiveLedger({ categories: [...categories, newCat] });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这笔账目吗？')) {
      updateActiveLedger({ transactions: transactions.filter(t => t.id !== id) });
    }
  };

  const handleCreateLedger = () => {
    if (!newLedgerName.trim()) return;
    const newL: Ledger = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLedgerName.trim(),
      icon: newLedgerIcon,
      description: '新账本',
      members: [DEFAULT_MEMBERS[0]],
      categories: DEFAULT_CATEGORIES,
      transactions: []
    };
    setLedgers([...ledgers, newL]);
    setActiveLedgerId(newL.id);
    setIsLedgerModalOpen(false);
    setNewLedgerName('');
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('ai');
    const report = await analyzeFinances(transactions);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsLedgerModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-xl">{activeLedger.icon}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{activeLedger.name}</span>
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
            </button>
          </div>
          <div className="flex -space-x-2">
            {members.map(m => (
              <img key={m.id} src={m.avatar} alt={m.name} title={m.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover" />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30">
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1 text-sm">{activeLedger.name} 结余</p>
            <h2 className="text-5xl font-black mb-8">
              <span className="text-3xl opacity-80 mr-1">¥</span>
              {balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-blue-50 text-xs mb-1 opacity-80">总收入</p>
                <p className="text-xl font-bold">¥ {totals.income.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-blue-50 text-xs mb-1 opacity-80">总支出</p>
                <p className="text-xl font-bold">¥ {totals.expense.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </section>

        <nav className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl">
          {(['overview', 'history', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              {tab === 'overview' ? '看板' : tab === 'history' ? '明细' : 'AI分析'}
            </button>
          ))}
        </nav>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border dark:border-slate-800">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <i className="fa-solid fa-chart-pie text-blue-500"></i>
                支出构成
              </h3>
              {chartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <i className="fa-solid fa-receipt text-3xl mb-2"></i>
                  <p>该账本尚无支出数据</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">关键词搜索</label>
                    <div className="relative">
                      <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input 
                        type="text" placeholder="搜索备注或分类..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">分类筛选</label>
                    <select 
                      value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                    >
                      <option value="All">所有分类</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">开始日期</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">结束日期</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                
                {(searchTerm || filterCategory !== 'All' || startDate || endDate) && (
                  <button 
                    onClick={() => {setSearchTerm(''); setFilterCategory('All'); setStartDate(''); setEndDate('');}}
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-2"
                  >
                    <i className="fa-solid fa-rotate-left"></i> 重置所有筛选
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border dark:border-slate-800 shadow-sm">
                <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">账目列表</h4>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500">{filteredTransactions.length} 条记录</span>
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                    <div key={t.id} className="group p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-green-50 text-green-500 dark:bg-green-500/10'}`}>
                          {categories.find(c => c.name === t.category)?.icon || '✨'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{t.category}</p>
                          <p className="text-xs text-slate-400">{t.memberName} · {new Date(t.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-bold text-lg ${t.type === TransactionType.EXPENSE ? 'text-red-500' : 'text-green-500'}`}>
                            {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-400 max-w-[120px] truncate">{t.description}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {setEditingTransaction(t); setIsFormOpen(true);}} className="p-2 text-blue-500 hover:scale-110 active:scale-95"><i className="fa-solid fa-pen"></i></button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:scale-110 active:scale-95"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-solid fa-calendar-xmark text-2xl text-slate-300"></i>
                      </div>
                      <p className="text-slate-400">在此时间范围内没有找到账目</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 min-h-[400px] shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-robot text-purple-500"></i>
                </div>
                AI 分析报告 - {activeLedger.name}
              </h3>
              {isAnalyzing ? (
                <div className="space-y-4">
                   <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 animate-pulse"></div>
                   <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 animate-pulse"></div>
                   <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6 animate-pulse"></div>
                   <div className="pt-8 text-center text-slate-400 animate-bounce">深度分析中，请稍候...</div>
                </div>
              ) : 
                aiReport ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border dark:border-slate-700">
                      {aiReport}
                    </div>
                    <button 
                      onClick={handleAiAnalysis} 
                      className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-bold hover:underline"
                    >
                      <i className="fa-solid fa-rotate-right"></i> 重新分析
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <i className="fa-solid fa-wand-magic-sparkles text-5xl text-purple-200 mb-6"></i>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">让 AI 深度解析您的账本数据，发现消费盲点并提供储蓄建议。</p>
                    <button 
                      onClick={handleAiAnalysis} 
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      立即开始 AI 诊断
                    </button>
                  </div>
                )
              }
            </div>
          )}
        </div>
      </main>

      {/* Floating Buttons */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 pointer-events-none">
        <button onClick={() => {setEditingTransaction(undefined); setIsFormOpen(true);}} className="pointer-events-auto w-20 h-20 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 shadow-blue-500/40">
          <i className="fa-solid fa-plus text-3xl"></i>
        </button>
      </div>

      {/* Ledger Switcher Modal */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">切换账本</h2>
              <button onClick={() => setIsLedgerModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {ledgers.map(l => (
                <button 
                  key={l.id}
                  onClick={() => { setActiveLedgerId(l.id); setIsLedgerModalOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${l.id === activeLedgerId ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <span className="text-3xl">{l.icon}</span>
                  <div className="text-left">
                    <p className="font-bold">{l.name}</p>
                    <p className="text-xs text-slate-400">{l.transactions.length} 笔交易</p>
                  </div>
                  {l.id === activeLedgerId && <i className="fa-solid fa-check ml-auto text-blue-500"></i>}
                </button>
              ))}
              
              <div className="pt-4 border-t dark:border-slate-700 mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">创建新账本</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="账本名称..."
                    value={newLedgerName}
                    onChange={(e) => setNewLedgerName(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button onClick={handleCreateLedger} className="bg-blue-600 text-white px-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">创建</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <TransactionForm
          initialData={editingTransaction}
          categories={categories}
          members={members}
          onAddCategory={handleAddCategory}
          onAdd={handleAddOrUpdate}
          onClose={() => { setIsFormOpen(false); setEditingTransaction(undefined); }}
        />
      )}
    </div>
  );
};

export default App;
