
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFinances = async (transactions: Transaction[]) => {
  const summary = transactions.map(t => `${t.date.split('T')[0]} ${t.memberName} ${t.type === 'EXPENSE' ? '支出' : '收入'} ${t.amount}元 [${t.category}]: ${t.description}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `这是我家庭最近的记账数据：\n${summary}\n\n请根据这些数据提供专业的家庭理财建议、消费习惯分析以及改进建议。请用亲切友好的口吻回答。`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "暂时无法生成分析建议。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI分析目前不可用，请稍后再试。";
  }
};
