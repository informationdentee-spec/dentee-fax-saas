import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * FAX送受信イベントのタイプ
 */
export type FaxEventType =
  | 'sent'
  | 'received'
  | 'failed'
  | 'retried'
  | 'cancelled'
  | 'scheduled'
  | 'rescheduled';

/**
 * FAX送受信イベントのステータス
 */
export type FaxEventStatus = 'success' | 'failed' | 'pending' | 'cancelled';

/**
 * FAX監査ログイベントインターフェース
 */
export interface FaxAuditEvent {
  type: FaxEventType;
  faxId?: number;
  receivedFaxId?: number;
  userId?: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  errorMessage?: string;
}

/**
 * FAX監査ログを記録
 * 既存のlogger.tsを拡張し、データベースにも記録する
 */
export async function logFaxEvent(event: FaxAuditEvent): Promise<void> {
  try {
    // 1. ファイルログに記録（既存logger使用）
    const logMessage = `FAX ${event.type}${event.faxId ? ` (Fax ID: ${event.faxId})` : ''}${event.receivedFaxId ? ` (ReceivedFax ID: ${event.receivedFaxId})` : ''}`;
    
    if (event.type === 'failed' || event.errorMessage) {
      logger.error(logMessage, undefined, {
        ...event.metadata,
        errorMessage: event.errorMessage,
      });
    } else {
      logger.info(logMessage, {
        ...event.metadata,
      });
    }

    // 2. データベースに記録（FaxAuditLogテーブル）
    if (event.faxId) {
      const status: FaxEventStatus =
        event.type === 'sent'
          ? 'success'
          : event.type === 'failed'
          ? 'failed'
          : event.type === 'cancelled'
          ? 'cancelled'
          : 'pending';

      await prisma.faxAuditLog.create({
        data: {
          fax_id: event.faxId,
          action: event.type,
          status: status,
          error_message: event.errorMessage || null,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          ip_address: event.ipAddress || null,
          user_id: event.userId || null,
        },
      });
    }

    // 3. 受信FAXの場合は受信ログも記録（オプション）
    // 受信FAXの監査ログは別途実装する可能性があるため、ここでは記録しない
  } catch (error) {
    // ログ記録の失敗はシステム全体に影響を与えないようにする
    console.error('Failed to log fax event:', error);
  }
}

/**
 * FAX送信成功を記録
 */
export async function logFaxSent(
  faxId: number,
  options?: {
    userId?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }
): Promise<void> {
  await logFaxEvent({
    type: 'sent',
    faxId,
    userId: options?.userId,
    metadata: options?.metadata,
    ipAddress: options?.ipAddress,
  });
}

/**
 * FAX送信失敗を記録
 */
export async function logFaxFailed(
  faxId: number,
  errorMessage: string,
  options?: {
    userId?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }
): Promise<void> {
  await logFaxEvent({
    type: 'failed',
    faxId,
    errorMessage,
    userId: options?.userId,
    metadata: options?.metadata,
    ipAddress: options?.ipAddress,
  });
}

/**
 * FAX再送を記録
 */
export async function logFaxRetried(
  faxId: number,
  retryCount: number,
  options?: {
    userId?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }
): Promise<void> {
  await logFaxEvent({
    type: 'retried',
    faxId,
    metadata: {
      retryCount,
      ...options?.metadata,
    },
    userId: options?.userId,
    ipAddress: options?.ipAddress,
  });
}

/**
 * FAX予約送信を記録
 */
export async function logFaxScheduled(
  faxId: number,
  scheduledAt: Date,
  options?: {
    userId?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }
): Promise<void> {
  await logFaxEvent({
    type: 'scheduled',
    faxId,
    metadata: {
      scheduledAt: scheduledAt.toISOString(),
      ...options?.metadata,
    },
    userId: options?.userId,
    ipAddress: options?.ipAddress,
  });
}

/**
 * FAX受信を記録（簡易版、受信FAX専用の監査ログテーブルが追加された場合は拡張）
 */
export async function logFaxReceived(
  receivedFaxId: number,
  options?: {
    metadata?: Record<string, any>;
  }
): Promise<void> {
  logger.info(`FAX received (ReceivedFax ID: ${receivedFaxId})`, {
    ...options?.metadata,
  });
  // 受信FAXの監査ログは別途実装する可能性があるため、ここではファイルログのみ記録
}

/**
 * 監査ログを取得
 */
export async function getAuditLogs(options?: {
  faxId?: number;
  userId?: number;
  action?: FaxEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (options?.faxId) {
    where.fax_id = options.faxId;
  }

  if (options?.userId) {
    where.user_id = options.userId;
  }

  if (options?.action) {
    where.action = options.action;
  }

  if (options?.startDate || options?.endDate) {
    where.created_at = {};
    if (options.startDate) {
      where.created_at.gte = options.startDate;
    }
    if (options.endDate) {
      where.created_at.lte = options.endDate;
    }
  }

  return await prisma.faxAuditLog.findMany({
    where,
    include: {
      fax: {
        include: {
          user: true,
          company: true,
          property: true,
        },
      },
      user: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: options?.limit || 100,
  });
}







