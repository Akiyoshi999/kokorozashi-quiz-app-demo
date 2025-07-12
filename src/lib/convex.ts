// Convexクライアント設定 - フロントエンドからConvexにアクセスするための設定
import { ConvexReactClient } from "convex/react";

// ConvexのURL（環境変数から取得、開発時はローカル）
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3210";

// Convexクライアントのインスタンスを作成
export const convex = new ConvexReactClient(convexUrl);