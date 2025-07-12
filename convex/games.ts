import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 新しいゲームを作成する関数
export const createGame = mutation({
  args: { isDemo: v.boolean() },
  handler: async (ctx, { isDemo }) => {
    const gameId = await ctx.db.insert("games", {
      status: "waiting",
      currentQuestionIndex: 0,
      isDemo,
      createdAt: Date.now(),
    });
    return gameId;
  },
});

// プレイヤーをゲームに参加させる関数
export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    playerName: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, { gameId, playerName, isAdmin = false }) => {
    // ゲームが存在し、まだ待機中かチェック
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "waiting") {
      throw new Error("ゲームに参加できません");
    }

    // 同名プレイヤーが既に参加していないかチェック
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("name"), playerName))
      .first();

    if (existingPlayer) {
      throw new Error("同じ名前のプレイヤーが既に参加しています");
    }

    // プレイヤーを追加
    const playerId = await ctx.db.insert("players", {
      gameId,
      name: playerName,
      score: 0,
      isBot: false,
      isAdmin,
      joinedAt: Date.now(),
    });

    return playerId;
  },
});

// ゲームの現在状態を取得する関数
export const getGameState = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    // 参加プレイヤー一覧を取得
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    return {
      game,
      players,
    };
  },
});

// ゲームを開始する関数（管理者またはデモモード用）
export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "waiting") {
      throw new Error("ゲームを開始できません");
    }

    // ゲームを開始状態に変更
    await ctx.db.patch(gameId, {
      status: "running",
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
    });

    return { success: true };
  },
});