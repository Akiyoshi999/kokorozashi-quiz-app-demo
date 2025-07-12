import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// プレイヤーが回答を送信する関数（回答変更も可能）
export const submitResponse = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(),
    choiceIndex: v.number(),
  },
  handler: async (ctx, { gameId, playerId, questionIndex, choiceIndex }) => {
    // ゲームが進行中かチェック
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "running") {
      throw new Error("回答を受け付けていません");
    }

    // 現在の問題かチェック
    if (game.currentQuestionIndex !== questionIndex) {
      throw new Error("この問題の回答時間は終了しました");
    }

    // 既存の回答があるかチェック
    const existingResponse = await ctx.db
      .query("responses")
      .withIndex("by_player_question", (q) => 
        q.eq("playerId", playerId).eq("questionIndex", questionIndex)
      )
      .first();

    if (existingResponse) {
      // 既存回答を更新（回答変更）
      await ctx.db.patch(existingResponse._id, {
        choiceIndex,
        answeredAt: Date.now(),
      });
    } else {
      // 新規回答を作成
      await ctx.db.insert("responses", {
        gameId,
        playerId,
        questionIndex,
        choiceIndex,
        answeredAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// 特定の問題の投票率を取得する関数（アニメーション表示用）
export const getQuestionResults = query({
  args: {
    gameId: v.id("games"),
    questionIndex: v.number(),
  },
  handler: async (ctx, { gameId, questionIndex }) => {
    // この問題に対するすべての回答を取得
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_game_question", (q) => 
        q.eq("gameId", gameId).eq("questionIndex", questionIndex)
      )
      .collect();

    // 選択肢ごとの投票数を集計
    const voteCounts = [0, 0, 0, 0]; // 4択分の配列
    responses.forEach(response => {
      if (response.choiceIndex >= 0 && response.choiceIndex < 4) {
        voteCounts[response.choiceIndex]++;
      }
    });

    const totalVotes = responses.length;
    
    // パーセンテージを計算
    const percentages = voteCounts.map(count => 
      totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
    );

    return {
      voteCounts,
      percentages,
      totalVotes,
    };
  },
});

// 問題の正解を表示するための情報を取得
export const getQuestionAnswer = query({
  args: { questionIndex: v.number() },
  handler: async (ctx, { questionIndex }) => {
    const question = await ctx.db
      .query("questions")
      .filter((q) => q.eq(q.field("order"), questionIndex))
      .first();

    if (!question) {
      throw new Error("問題が見つかりません");
    }

    return {
      questionText: question.text,
      choices: question.choices,
      correctIndex: question.correctIndex,
      correctAnswer: question.choices[question.correctIndex],
    };
  },
});