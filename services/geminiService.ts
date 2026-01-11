
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const analyzeFinances = async (transactions: Transaction[]) => {
  // 直接从环境变量获取，系统会自动注入有效的 API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "⚠️ AI 服务未配置。请确保已在管理后台正确设置了 API_KEY 环境变量。";
  }

  // 每次请求时创建实例，确保使用最新的环境配置
  const ai = new GoogleGenAI({ apiKey });
  
  const summary = transactions.map(t => 
    `${t.date.split('T')[0]} ${t.memberName} ${t.type === 'EXPENSE' ? '支出' : '收入'} ${t.amount}元 [${t.category}]: ${t.description}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个专业的家庭理财管家。这是我家的账目数据：\n${summary}\n\n请分析支出结构，指出潜在的浪费，并给出省钱建议。请用亲切的口吻，多用 Emoji，300字以内。`,
    });
    
    return response.text || "AI 正在思考，请稍后再试。";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error?.message?.includes('403')) return "错误 403：API Key 无效或地区受限。";
    if (error?.message?.includes('429')) return "错误 429：请求太频繁，请稍后再试。";
    return `分析失败：${error?.message || '网络连接超时'}`;
  }
};
