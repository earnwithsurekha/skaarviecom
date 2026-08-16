export async function POST(request, { params }) {
  try {
    const { username } = params;
    const body = await request.json();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/store/visit/${username}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Store visit API error:', error);
    return Response.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
