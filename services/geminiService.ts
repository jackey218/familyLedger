
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// 这个值会在 Cloudflare 构建时被 package.json 里的 sed 命令尝试替换
const API_KEY_VALUE = "YOUR_API_KEY_PLACEHOLDER";

const getApiKey = () => {
  // 1. 优先尝试物理替换后的值
  if (API_KEY_VALUE && API_KEY_VALUE !== "YOUR_API_KEY_PLACEHOLDER") {
    return API_KEY_VALUE;
  }
  
  // 2. 尝试从 Cloudflare 的 process.env 读取 (有些环境下可行)
  try {
    // @ts-ignore
    const envKey = typeof process !== 'undefined' ? process.env?.API_KEY : null;
    if (envKey) return envKey;
  } catch (e) {}

  return '';
};

export const analyzeFinances = async (transactions: Transaction[]) => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === "YOUR_API_KEY_PLACEHOLDER") {
    return "⚠️ 账本未关联 AI 服务。\n\n【排查步骤】：\n1. 检查 Cloudflare 环境变量中是否添加了 API_KEY。\n2. 确保 Build Command 是 npm run build。\n3. 如果依然报错，请手动在 Cloudflare 设置中检查变量名称大小写。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const summary = transactions.map(t => `${t.date.split('T')[0]} ${t.memberName} ${t.type === 'EXPENSE' ? '支出' : '收入'} ${t.amount}元 [${t.category}]: ${t.description}`).join('\n');

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
    return `分析失败：${error?.message || '未知错误'}`;
  }
};
