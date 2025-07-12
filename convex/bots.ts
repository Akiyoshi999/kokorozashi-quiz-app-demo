import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Bot用の日本語名前リスト - リアルな名前でデモを盛り上げる
const BOT_NAMES = [
  "田中太郎", "佐藤花子", "鈴木一郎", "高橋美咲",
  "伊藤健太", "渡辺由美", "山本大輔", "中村さくら", "小林翔太"
];

// デモモード用にBotプレイヤーを9名追加する関数
export const addDemoBots = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game || !game.isDemo) {
      throw new Error("デモモードのゲームでのみ使用可能です");
    }

    // 既存のBotをチェック（重複防止）
    const existingBots = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("isBot"), true))
      .collect();

    if (existingBots.length > 0) {
      return { message: "Botは既に追加済みです" };
    }

    // 9名のBotプレイヤーを作成
    const botIds = [];
    for (let i = 0; i < 9; i++) {
      const botId = await ctx.db.insert("players", {
        gameId,
        name: BOT_NAMES[i],
        score: 0,
        isBot: true,
        isAdmin: false,
        joinedAt: Date.now(),
      });
      botIds.push(botId);
    }

    return { success: true, botCount: botIds.length };
  },
});

// Botが自動的にランダム回答する関数
export const botAnswerQuestion = mutation({
  args: {
    gameId: v.id("games"),
    questionIndex: v.number(),
  },
  handler: async (ctx, { gameId, questionIndex }) => {
    // そのゲームのBotプレイヤーを取得
    const bots = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("isBot"), true))
      .collect();

    const responses = [];

    // 各Botにランダム回答させる
    for (const bot of bots) {
      // 既に回答済みかチェック
      const existingResponse = await ctx.db
        .query("responses")
        .withIndex("by_player_question", (q) => 
          q.eq("playerId", bot._id).eq("questionIndex", questionIndex)
        )
        .first();

      if (!existingResponse) {
        // 0-3のランダムな選択肢を選ぶ
        const randomChoice = Math.floor(Math.random() * 4);
        
        // 回答タイミングもランダム（3-15秒後）
        const randomDelay = Math.floor(Math.random() * 12) + 3;
        const answeredAt = Date.now() + (randomDelay * 1000);

        await ctx.db.insert("responses", {
          gameId,
          playerId: bot._id,
          questionIndex,
          choiceIndex: randomChoice,
          answeredAt,
        });

        responses.push({
          botName: bot.name,
          choice: randomChoice,
          delay: randomDelay,
        });
      }
    }

    return { responses };
  },
});