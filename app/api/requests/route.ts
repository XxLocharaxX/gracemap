import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, type, title, authorName, description, location, contact } = body;

    if (!token || !location || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Turnstile Verification
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (secretKey) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}`,
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: 'Bot protection failed' }, { status: 403 });
      }
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('help_requests')
      .insert([
        {
          type,
          title,
          author_name: authorName,
          description,
          lng: location[0],
          lat: location[1],
          contact_type: contact.type,
          contact_value: contact.value,
          is_verified: false,
          user_id: body.userId || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message, hint: error.hint }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
