
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// 兼容 Cloudflare Pages 部署环境
// 在 Cloudflare 控制台 Settings -> Environment Variables 中设置 API_KEY
const getApiKey = () => {
  try {
    return process.env.API_KEY || (window as any)._env_?.API_KEY || '';
  } catch {
    return '';
  }
};

export const analyzeFinances = async (transactions: Transaction[]) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "未检测到 API Key。请在 Cloudflare Pages 后台设置名为 API_KEY 的环境变量，然后重新部署。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const summary = transactions.map(t => `${t.date.split('T')[0]} ${t.memberName} ${t.type === 'EXPENSE' ? '支出' : '收入'} ${t.amount}元 [${t.category}]: ${t.description}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `这是我家庭最近的记账数据：\n${summary}\n\n请根据这些数据提供专业的家庭理财建议、消费习惯分析以及改进建议。请用亲切友好的口吻回答，字数在300字以内。`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "暂时无法生成分析建议。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI分析请求失败，请检查 API Key 权限或网络连接。";
  }
};
