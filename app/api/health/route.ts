import { NextResponse } from "next/server";
import { getCatalog, getStoredEtag } from "@/lib/kv";

export const runtime = "edge";

/**
 * GET /api/health
 * 健康检查端点（生产可用）。
 *
 * - 检查服务可达性（路由可响应）
 * - 轻量验证 KV 连接（通过读取已有/可能不存在的 ETag 键）
 * - 可选：检测目录是否已同步（仅指示状态，不作为硬性失败条件）
 *
 * 约定：
 * - 仅在 KV 无法连接或配置缺失时返回 503（不健康）
 * - 目录未同步时返回 200，但在 details 中标记 catalog 状态为 "empty"
 */
export async function GET() {
  const now = new Date().toISOString();

  // 检查 KV 连接与配置
  let kvOk = false;
  let kvError: string | null = null;
  try {
    // 如果环境变量缺失或 KV 不可达，这里会抛出异常
    await getStoredEtag();
    kvOk = true;
  } catch (err) {
    kvOk = false;
    kvError = err instanceof Error ? err.message : "Unknown KV error";
  }

  // 目录是否已同步（非硬性）
  let catalogReady = false;
  try {
    const catalog = await getCatalog();
    catalogReady = !!catalog;
  } catch {
    // 忽略 catalog 检查错误，避免将其作为健康检查的失败条件
    catalogReady = false;
  }

  const body = {
    ok: kvOk,
    timestamp: now,
    details: {
      kv: kvOk ? "connected" : "unavailable",
      catalog: catalogReady ? "ready" : "empty",
      // 仅在不健康时附加错误信息，避免泄漏敏感细节
      error: kvOk ? undefined : kvError,
    },
  } as const;

  const status = kvOk ? 200 : 503; // KV 失败才视为不健康
  return NextResponse.json(body, { status });
}