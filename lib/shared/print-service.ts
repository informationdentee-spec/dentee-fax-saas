import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * 印刷リクエストインターフェース
 */
export interface PrintRequest {
  documentType: string; // "図面", "資料", "契約書"など
  content: string | Buffer; // 印刷するコンテンツ（Base64画像、PDF、HTMLなど）
  printer?: string; // プリンター名（指定しない場合はデフォルト）
  metadata?: Record<string, any>; // メタデータ
  receivedFaxId?: number; // 受信FAX ID（関連付け用）
}

/**
 * 印刷ジョブのステータス
 */
export type PrintJobStatus = 'pending' | 'printing' | 'completed' | 'failed';

/**
 * 印刷ジョブの結果
 */
export interface PrintJobResult {
  jobId: number;
  status: PrintJobStatus;
  errorMessage?: string;
}

/**
 * 印刷サービス
 * 実際の印刷処理はOSの印刷コマンドまたは印刷APIを使用
 */
export class PrintService {
  /**
   * ドキュメントを印刷
   */
  static async printDocument(request: PrintRequest): Promise<PrintJobResult> {
    try {
      // 1. 印刷ジョブを作成
      const job = await prisma.printJob.create({
        data: {
          received_fax_id: request.receivedFaxId || null,
          document_type: request.documentType,
          printer_name: request.printer || null,
          status: 'pending',
        },
      });

      // 2. 実際の印刷処理（非同期で実行）
      // TODO: 実際の印刷処理を実装
      // - Windows: PowerShellのStart-Processコマンドまたは印刷API
      // - macOS/Linux: lp/lprコマンドまたはCUPS API
      this.executePrint(job.id, request).catch((error) => {
        logger.error(`Print job ${job.id} failed:`, error);
        prisma.printJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error_message: error.message,
          },
        });
      });

      return {
        jobId: job.id,
        status: 'pending',
      };
    } catch (error: any) {
      logger.error('Failed to create print job:', error);
      throw error;
    }
  }

  /**
   * 実際の印刷処理を実行（非同期）
   */
  private static async executePrint(
    jobId: number,
    request: PrintRequest
  ): Promise<void> {
    try {
      // ジョブステータスを「印刷中」に更新
      await prisma.printJob.update({
        where: { id: jobId },
        data: { status: 'printing' },
      });

      // コンテンツを一時ファイルに保存
      const tempFilePath = await this.saveToTempFile(request.content);

      // OSの印刷コマンドを実行
      await this.executePrintCommand(tempFilePath, request.printer);

      // ジョブステータスを「完了」に更新
      await prisma.printJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });

      logger.info(`Print job ${jobId} completed`);
    } catch (error: any) {
      await prisma.printJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error_message: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * コンテンツを一時ファイルに保存
   */
  private static async saveToTempFile(
    content: string | Buffer
  ): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(
      tempDir,
      `print_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`
    );

    if (typeof content === 'string') {
      // Base64文字列の場合はデコード
      if (content.startsWith('data:')) {
        const base64Data = content.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(tempFilePath, buffer);
      } else {
        fs.writeFileSync(tempFilePath, content, 'utf8');
      }
    } else {
      fs.writeFileSync(tempFilePath, content);
    }

    return tempFilePath;
  }

  /**
   * OSの印刷コマンドを実行
   */
  private static async executePrintCommand(
    filePath: string,
    printer?: string
  ): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const platform = process.platform;
    let command: string;

    if (platform === 'win32') {
      // Windows: PowerShellのStart-Processコマンド
      const printerArg = printer ? `-PrinterName "${printer}"` : '';
      command = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print ${printerArg} -PassThru | Wait-Process"`;
    } else if (platform === 'darwin') {
      // macOS: lpコマンド
      const printerArg = printer ? `-d "${printer}"` : '';
      command = `lp ${printerArg} "${filePath}"`;
    } else {
      // Linux: lpコマンド（CUPS）
      const printerArg = printer ? `-d "${printer}"` : '';
      command = `lp ${printerArg} "${filePath}"`;
    }

    try {
      await execAsync(command);
      logger.info(`Print command executed: ${command}`);
    } catch (error: any) {
      logger.error(`Print command failed: ${command}`, error);
      throw new Error(`Failed to execute print command: ${error.message}`);
    }
  }

  /**
   * 印刷ジョブを取得
   */
  static async getPrintJob(jobId: number) {
    return await prisma.printJob.findUnique({
      where: { id: jobId },
      include: {
        received_fax: true,
      },
    });
  }

  /**
   * 印刷ジョブ一覧を取得
   */
  static async getPrintJobs(options?: {
    receivedFaxId?: number;
    status?: PrintJobStatus;
    limit?: number;
  }) {
    const where: any = {};

    if (options?.receivedFaxId) {
      where.received_fax_id = options.receivedFaxId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    return await prisma.printJob.findMany({
      where,
      include: {
        received_fax: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: options?.limit || 100,
    });
  }
}

/**
 * 簡易的な印刷関数（後方互換性のため）
 */
export async function printDocument(
  request: PrintRequest
): Promise<PrintJobResult> {
  return PrintService.printDocument(request);
}







