import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsForUser, createDocument, SEEDED_USERS } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || SEEDED_USERS[0].id;
    const documents = getDocumentsForUser(userId);
    return NextResponse.json(documents);
  } catch (err) {
    console.error('Error fetching documents:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get('x-user-id') || body.ownerId || SEEDED_USERS[0].id;

    const newDoc = createDocument({
      title: body.title,
      content: body.content,
      ownerId: userId,
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (err) {
    console.error('Error creating document:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
