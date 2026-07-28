import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Ambil antrean dari database
    const queues = await prisma.scalev_sync_queue.findMany({
      take: 50, // Batasi 50 agar tidak timeout
      orderBy: { created_at: 'asc' }
    });

    if (queues.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada antrean sinkronisasi.' });
    }

    // Cari API Key Scalev yang aktif
    const scalevSetting = await prisma.scalev.findFirst({
      where: { status: 'active' },
      orderBy: { id: 'desc' }
    });

    if (!scalevSetting || !scalevSetting.api_key) {
      return NextResponse.json({ success: false, message: 'API Key Scalev belum dikonfigurasi.' }, { status: 400 });
    }

    const apiKey = scalevSetting.api_key;
    
    // Kelompokkan ID berdasarkan target_status
    const idsByStatus: Record<string, string[]> = {};
    for (const q of queues) {
      if (!idsByStatus[q.target_status]) {
        idsByStatus[q.target_status] = [];
      }
      idsByStatus[q.target_status].push(q.scalev_order_id);
    }

    const results = [];
    const successfulIds: string[] = [];

    // 2. Eksekusi API secara massal (bulk) per status
    for (const status in idsByStatus) {
      const ids = idsByStatus[status];
      
      const payload = {
        ids: ids,
        status: status
      };

      // Menggunakan endpoint v3 sesuai permintaan pengguna (https://dev.scalev.com/reference/changeorderstatus)
      const baseUrl = scalevSetting.url || 'https://api.scalev.id/v3';
      const url = `${baseUrl.replace(/\/+$/, '')}/orders/change-status`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      results.push({
        status: status,
        ids: ids,
        api_status: response.status,
        api_response: responseData
      });

      // Anggap sukses kalau HTTP 200 (walaupun Scalev mungkin me-return data kosong)
      if (response.ok) {
        successfulIds.push(...ids);
      }
    }

    // 3. Hapus antrean yang berhasil diproses dari DB
    if (successfulIds.length > 0) {
      await prisma.scalev_sync_queue.deleteMany({
        where: {
          scalev_order_id: { in: successfulIds }
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed_count: queues.length,
      successful_ids: successfulIds,
      details: results 
    });

  } catch (error: any) {
    console.error('[API /cron/sync-status]', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
