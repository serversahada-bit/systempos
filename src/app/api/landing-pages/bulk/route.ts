import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs tidak valid atau kosong' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action harus diisi (delete, publish, draft)' }, { status: 400 });
    }

    const numericIds = ids.map((id: string) => parseInt(id, 10));

    if (action === 'delete') {
      await prisma.landing_pages.deleteMany({
        where: {
          id: {
            in: numericIds,
          },
        },
      });
      return NextResponse.json({ message: 'Landing pages berhasil dihapus' }, { status: 200 });
    } else if (action === 'publish' || action === 'draft') {
      const status = action === 'publish' ? 'Published' : 'Draft';
      await prisma.landing_pages.updateMany({
        where: {
          id: {
            in: numericIds,
          },
        },
        data: {
          status: status,
        },
      });
      return NextResponse.json({ message: `Landing pages berhasil diubah status menjadi ${status}` }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Action tidak didukung' }, { status: 400 });
    }
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error on bulk action:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan bulk action', details },
      { status: 500 }
    );
  }
}
