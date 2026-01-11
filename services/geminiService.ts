
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

/**
 * 获取 API Key 的逻辑
 * 1. 尝试从 Cloudflare 构建时可能注入的地方读取
 * 2. 这里的 process.env.API_KEY 会在 Cloudflare 构建命令中被 sed 指令替换（见下文说明）
 */
const getApiKey = () => {
  // @ts-ignore
  return (typeof process !== 'undefined' && process.env?.API_KEY) || '';
};

export const analyzeFinances = async (transactions: Transaction[]) => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === "YOUR_API_KEY_PLACEHOLDER") {
    return "⚠️ 缺少 API Key！\n\n【配置方法】：\n1. 登录 Cloudflare 控制台\n2. 进入项目 Settings -> Environment variables\n3. 添加变量 API_KEY\n4. 在 Build Command 填写：sed -i \"s/YOUR_API_KEY_PLACEHOLDER/\"$API_KEY\"/g\" services/geminiService.ts\n5. 重新部署。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const summary = transactions.map(t => `${t.date.split('T')[0]} ${t.memberName} ${t.type === 'EXPENSE' ? '支出' : '收入'} ${t.amount}元 [${t.category}]: ${t.description}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个专业的家庭理财管家。这是我家的账单：\n${summary}\n\n请分析消费结构，指出不合理支出，并给出具体的省钱建议。请用活泼的口吻，多用 Emoji，300字以内。`,
    });
    return response.text || "AI 忙碌中，请稍后再试。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "分析失败：请检查 API Key 是否有效或网络是否畅通。";
  }
};
