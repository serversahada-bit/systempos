import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_ids, status } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Order IDs wajib diisi.' }, { status: 400 });
    }
    
    if (!status) {
      return NextResponse.json({ success: false, message: 'Status wajib diisi.' }, { status: 400 });
    }

    // Cari API Key Scalev yang aktif
    const scalevSetting = await prisma.scalev.findFirst({
      where: { status: 'active' },
      orderBy: { id: 'desc' }
    });

    if (!scalevSetting || !scalevSetting.api_key) {
      return NextResponse.json({ success: false, message: 'API Key Scalev belum dikonfigurasi atau tidak aktif.' }, { status: 400 });
    }

    const apiKey = scalevSetting.api_key;
    const baseUrl = scalevSetting.url || 'https://api.scalev.id/v3';
    
    // Sesuaikan payload sesuai dengan dokumentasi Scalev API: https://dev.scalev.com/reference/changeorderstatus
    const payload = {
      ids: order_ids,
      status: status
    };

    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/orders/change-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        message: data.message || `Gagal mengubah status di Scalev (HTTP ${response.status})`,
        details: data
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status pesanan berhasil diubah di Scalev.',
      data: data
    });

  } catch (error: any) {
    console.error('[API /scalev/change-status POST]', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
