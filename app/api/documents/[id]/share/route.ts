import { NextRequest, NextResponse } from 'next/server';
import { shareDocument, SEEDED_USERS } from '@/lib/storage';
import { CollaboratorRole } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const userId = req.headers.get('x-user-id') || SEEDED_USERS[0].id;
    const body = await req.json();

    const { email, role } = body as { email: string; role: CollaboratorRole };

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role ("viewer" | "editor") are required' },
        { status: 400 }
      );
    }

    if (role !== 'viewer' && role !== 'editor') {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "viewer" or "editor"' },
        { status: 400 }
      );
    }

    const result = shareDocument(id, userId, email, role);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      message: `Document successfully shared with ${email} as ${role}`,
      document: result.doc,
    });
  } catch (err) {
    console.error('Error sharing document:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
