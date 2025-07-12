import { mutation, query } from "./_generated/server";

// サンプル問題データの配列 - デモ用の問題を定義
const SAMPLE_QUESTIONS = [
  {
    text: "日本の首都はどこですか？",
    choices: ["大阪", "京都", "東京", "名古屋"],
    correctIndex: 2,
    order: 0,
  },
  {
    text: "1 + 1 = ?",
    choices: ["1", "2", "3", "4"],
    correctIndex: 1,
    order: 1,
  },
  {
    text: "猫の鳴き声は？",
    choices: ["ワンワン", "ニャーニャー", "モーモー", "コケコッコー"],
    correctIndex: 1,
    order: 2,
  },
  {
    text: "地球で一番大きな動物は？",
    choices: ["象", "キリン", "シロナガスクジラ", "恐竜"],
    correctIndex: 2,
    order: 3,
  },
  {
    text: "虹は何色？",
    choices: ["5色", "6色", "7色", "8色"],
    correctIndex: 2,
    order: 4,
  },
];

// 問題データを初期化する関数（管理者が使用）
export const initializeQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    // 既存の問題をすべて削除
    const existingQuestions = await ctx.db.query("questions").collect();
    for (const question of existingQuestions) {
      await ctx.db.delete(question._id);
    }

    // サンプル問題を挿入
    for (const question of SAMPLE_QUESTIONS) {
      await ctx.db.insert("questions", question);
    }

    return { success: true, count: SAMPLE_QUESTIONS.length };
  },
});

// すべての問題を取得する関数
export const getAllQuestions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("questions").order("order").collect();
  },
});