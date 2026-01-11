
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Transaction, TransactionType } from './types';
import { CATEGORIES, FAMILY_MEMBERS, INITIAL_TRANSACTIONS } from './constants.tsx';
import { analyzeFinances } from './services/geminiService';
import TransactionForm from './components/TransactionForm';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'ai'>('overview');
  const [aiReport, setAiReport] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMember, setFilterMember] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Statistics (Calculated from all transactions)
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

  // Filtered Transactions for History Tab
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesMember = filterMember === 'All' || t.memberId === filterMember;
      
      const tDate = new Date(t.date).getTime();
      const matchesStart = !dateRange.start || tDate >= new Date(dateRange.start).getTime();
      const matchesEnd = !dateRange.end || tDate <= new Date(dateRange.end).setHours(23, 59, 59, 999);
      
      return matchesSearch && matchesCategory && matchesMember && matchesStart && matchesEnd;
    });
  }, [transactions, searchTerm, filterCategory, filterMember, dateRange]);

  const handleAddOrUpdate = (t: Transaction) => {
    if (editingTransaction) {
      setTransactions(transactions.map(item => item.id === t.id ? t : item));
    } else {
      setTransactions([t, ...transactions]);
    }
    setEditingTransaction(undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这笔账目吗？')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const openEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('ai');
    const report = await analyzeFinances(transactions);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterMember('All');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-wallet text-xl"></i>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              FamilyLedger
            </h1>
          </div>
          <div className="flex -space-x-2">
            {FAMILY_MEMBERS.map(m => (
              <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover" />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Summary Card */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30">
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1 text-sm">当前总结余</p>
            <h2 className="text-5xl font-black mb-8">
              <span className="text-3xl opacity-80 mr-1">¥</span>
              {balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1 text-blue-50 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  总收入
                </div>
                <p className="text-xl font-bold">¥ {totals.income.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1 text-blue-50 text-xs">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  总支出
                </div>
                <p className="text-xl font-bold">¥ {totals.expense.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        </section>

        {/* Tab Navigation */}
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

        {/* Dynamic Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-chart-pie text-blue-500"></i>
                  支出构成
                </h3>
                {chartData.length > 0 ? (
                  <>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444'][index % 6]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                       {chartData.map((item) => (
                         <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                           <span className="text-slate-500">{item.name}</span>
                           <span className="font-semibold">¥{item.value}</span>
                         </div>
                       ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <i className="fa-solid fa-chart-line text-3xl mb-2"></i>
                    <p>暂无支出数据</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border dark:border-slate-800 space-y-4">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" 
                    placeholder="搜索备注或分类..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">所有分类</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>

                  <select 
                    value={filterMember}
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">所有成员</option>
                    {FAMILY_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>

                  <input 
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />

                  <input 
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {(searchTerm || filterCategory !== 'All' || filterMember !== 'All' || dateRange.start || dateRange.end) && (
                  <button 
                    onClick={resetFilters}
                    className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"
                  >
                    <i className="fa-solid fa-rotate-left"></i> 重置筛选
                  </button>
                )}
              </div>

              {/* Transactions List */}
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border dark:border-slate-800">
                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold">账目记录</h3>
                  <span className="text-xs text-slate-400">已过滤 {filteredTransactions.length} 笔</span>
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                    <div key={t.id} className="group p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-green-50 text-green-500 dark:bg-green-500/10'}`}>
                          {CATEGORIES.find(c => c.name === t.category)?.icon || '✨'}
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
                          <p className="text-xs text-slate-400 truncate max-w-[120px]">{t.description || '无备注'}</p>
                        </div>
                        <div className="flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEdit(t)}
                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 flex items-center justify-center hover:scale-110 active:scale-90"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 flex items-center justify-center hover:scale-110 active:scale-90"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center">
                      <i className="fa-solid fa-filter-circle-xmark text-4xl text-slate-200 mb-4"></i>
                      <p className="text-slate-400">没有匹配的账目</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800 min-h-[400px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">AI 财务管家</h3>
                  <p className="text-sm text-slate-500">基于 Gemini 的智能支出分析</p>
                </div>
              </div>
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 animate-pulse">正在深度分析家庭财务状况...</p>
                </div>
              ) : aiReport ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                    {aiReport}
                  </div>
                  <button 
                    onClick={handleAiAnalysis}
                    className="mt-8 text-blue-600 font-semibold text-sm flex items-center gap-2 hover:underline"
                  >
                    <i className="fa-solid fa-rotate-right"></i>
                    重新生成分析
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-6">点击按钮，获取专业的家庭财务建议</p>
                  <button 
                    onClick={handleAiAnalysis}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
                  >
                    开始分析
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
           <button
             onClick={handleAiAnalysis}
             className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-2xl border dark:border-slate-700 flex items-center justify-center text-purple-600 transition-all hover:scale-110 active:scale-95"
             title="AI分析"
           >
             <i className="fa-solid fa-robot text-xl"></i>
           </button>

           <button
            onClick={() => { setEditingTransaction(undefined); setIsFormOpen(true); }}
            className="w-20 h-20 bg-blue-600 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 hover:rotate-90"
          >
            <i className="fa-solid fa-plus text-3xl"></i>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-2xl border dark:border-slate-700 flex items-center justify-center text-blue-600 transition-all hover:scale-110 active:scale-95"
            title="明细"
          >
            <i className="fa-solid fa-list text-xl"></i>
          </button>
        </div>
      </div>

      {/* Transaction Modal */}
      {isFormOpen && (
        <TransactionForm
          initialData={editingTransaction}
          onAdd={handleAddOrUpdate}
          onClose={() => { setIsFormOpen(false); setEditingTransaction(undefined); }}
        />
      )}
    </div>
  );
};

export default App;
