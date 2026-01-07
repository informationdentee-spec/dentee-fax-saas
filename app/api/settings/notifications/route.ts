import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // 設定レコードが存在しない場合は作成し、存在すれば更新
    // (通常はSeedで作成しますが、念のためupsert的な動きをさせます)
    const firstSetting = await prisma.settings.findFirst();
    
    let updated;
    if (firstSetting) {
      updated = await prisma.settings.update({
        where: { id: firstSetting.id },
        data: {
          fax_success: body.fax_success,
          fax_failure: body.fax_failure,
          system_updates: body.system_updates,
        },
      });
    } else {
      updated = await prisma.settings.create({
        data: {
          fax_success: body.fax_success,
          fax_failure: body.fax_failure,
          system_updates: body.system_updates,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}