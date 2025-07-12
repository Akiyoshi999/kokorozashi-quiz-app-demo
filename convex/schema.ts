import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ゲームセッション管理 - 1つのクイズゲーム全体の状態を管理
  games: defineTable({
    status: v.union(v.literal("waiting"), v.literal("running"), v.literal("finished")), // 待機中/進行中/終了
    currentQuestionIndex: v.number(), // 現在の問題番号
    questionStartTime: v.optional(v.number()), // 問題開始時刻（同期用）
    isDemo: v.boolean(), // デモモードかどうか
    createdAt: v.number(), // ゲーム作成時刻
  }),

  // プレイヤー情報（実際のプレイヤーとBotの両方を格納）
  players: defineTable({
    gameId: v.id("games"), // どのゲームに参加しているか
    name: v.string(), // プレイヤー名
    score: v.number(), // 現在のスコア（正解数）
    isBot: v.boolean(), // Botかどうかの判定
    isAdmin: v.boolean(), // 管理者かどうか
    joinedAt: v.number(), // 参加時刻
  }).index("by_game", ["gameId"]), // ゲームIDで検索できるようにインデックス作成

  // 問題データ - 事前に登録された4択問題
  questions: defineTable({
    text: v.string(), // 問題文
    choices: v.array(v.string()), // 4つの選択肢の配列
    correctIndex: v.number(), // 正解の選択肢番号（0-3）
    order: v.number(), // 問題の順番
  }),

  // プレイヤーの回答記録 - リアルタイムで更新される回答情報
  responses: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(), // 何問目の回答か
    choiceIndex: v.number(), // 選択した答え（0-3）
    answeredAt: v.number(), // 回答した時刻
  }).index("by_game_question", ["gameId", "questionIndex"]) // ゲーム+問題で検索
    .index("by_player_question", ["playerId", "questionIndex"]), // プレイヤー+問題で検索

  // ゲーム履歴 - 終了したゲームの結果を保存
  gameHistory: defineTable({
    gameId: v.id("games"),
    playerName: v.string(),
    score: v.number(),
    rank: v.number(), // 最終順位
    completedAt: v.number(),
  }).index("by_game", ["gameId"]),
});