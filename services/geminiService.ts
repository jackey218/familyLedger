
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// 这个值会在 Cloudflare 构建时被 package.json 里的 sed 命令替换
const API_KEY_VALUE = "YOUR_API_KEY_PLACEHOLDER";

const getApiKey = () => {
  // 优先尝试直接读取替换后的值，如果没有替换成功，尝试读取 process.env（本地环境）
  if (API_KEY_VALUE && API_KEY_VALUE !== "YOUR_API_KEY_PLACEHOLDER") {
    return API_KEY_VALUE;
  }
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  } catch {
    return '';
  }
};

export const analyzeFinances = async (transactions: Transaction[]) => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === "YOUR_API_KEY_PLACEHOLDER") {
    return "⚠️ 账本未关联 AI 服务。\n\n【小白配置指南】：\n1. 在 Cloudflare Pages 变量设置中添加 API_KEY。\n2. 确保 Build Command 设置为 npm run build。\n3. 重新部署以激活 AI 助手。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const summary = transactions.map(t => `${t.date.split('T')[0]} ${t.memberName} ${t.type === 'EXPENSE' ? '支出' : '收入'} ${t.amount}元 [${t.category}]: ${t.description}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个专业的家庭理财管家。这是我家的账目数据：\n${summary}\n\n请分析支出结构，指出潜在的浪费，并给出省钱建议。请用亲切的口吻，多用 Emoji，300字以内。`,
    });
    return response.text || "AI 正在思考，请稍后再试。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "分析请求失败。请检查 API Key 权限或网络连接。";
  }
};
