import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument, SEEDED_USERS } from '@/lib/storage';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || SEEDED_USERS[0].id;

    const result = getDocumentById(id, userId);
    if (!result) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!result.permission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this document' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      document: result.doc,
      permission: result.permission,
    });
  } catch (err) {
    console.error('Error fetching document:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const userId = req.headers.get('x-user-id') || SEEDED_USERS[0].id;
    const body = await req.json();

    const result = updateDocument(id, userId, {
      title: body.title,
      content: body.content,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json(result.doc);
  } catch (err) {
    console.error('Error updating document:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const userId = req.headers.get('x-user-id') || SEEDED_USERS[0].id;

    const result = deleteDocument(id, userId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
