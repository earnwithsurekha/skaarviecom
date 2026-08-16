export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/track/referral-click`,
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
    console.error('Track referral click API error:', error);
    return Response.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
