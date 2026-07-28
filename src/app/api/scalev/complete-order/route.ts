import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, customer_name, customer_phone, address, location_id, payment_method } = body;

    if (!order_id || !customer_name || !customer_phone || !address || !location_id || !payment_method) {
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi (termasuk Kecamatan dan Metode Pembayaran).' }, { status: 400 });
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
    const baseUrl = (scalevSetting.url || 'https://api.scalev.id/v3').replace(/\/+$/, '');
    
    // 1. Update Pesanan (Isi Alamat)
    const updatePayload = {
      customer_name: customer_name,
      customer_phone: customer_phone,
      address: address,
      location_id: location_id,
      payment_method: payment_method
    };

    const updateResponse = await fetch(`${baseUrl}/orders/${order_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(updatePayload)
    });

    const updateData = await updateResponse.json().catch(() => ({}));
    console.log('[API /scalev/complete-order] PATCH /orders response:', updateResponse.status, updateData);

    if (!updateResponse.ok) {
      const errorMsg = updateData.message || JSON.stringify(updateData) || `Gagal melengkapi data pesanan di Scalev (HTTP ${updateResponse.status})`;
      return NextResponse.json({ 
        success: false, 
        message: `Error Scalev: ${errorMsg}`,
        details: updateData
      }, { status: updateResponse.status });
    }

    // CATATAN: API Scalev v3 tidak mengizinkan perubahan status dari "draft" (Created) langsung 
    // ke "pending" menggunakan endpoint /change-status. 
    // Oleh karena itu, kita memasukkannya ke antrean sinkronisasi massal sesuai permintaan pengguna.
    try {
      await prisma.scalev_sync_queue.upsert({
        where: { scalev_order_id: order_id },
        update: { target_status: 'pending' },
        create: {
          scalev_order_id: order_id,
          target_status: 'pending',
        }
      });
      console.log(`[API /scalev/complete-order] Berhasil menambahkan antrean sinkronisasi untuk order_id: ${order_id}`);
    } catch (dbError: any) {
      console.error(`[API /scalev/complete-order] Gagal menyimpan antrean sinkronisasi:`, dbError.message);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data pesanan berhasil dilengkapi! Namun karena batasan API Scalev, order "Created" tidak bisa diubah otomatis ke "Pending". Silakan buka dashboard Scalev dan klik Simpan pada pesanan tersebut untuk merubahnya ke Pending.',
      details: updateData 
    });

  } catch (error: any) {
    console.error('[API /scalev/complete-order POST]', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
