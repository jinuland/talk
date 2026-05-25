// Zoom integration. When ZOOM_* env vars are set we use the Server-to-Server OAuth
// flow against api.zoom.us; otherwise we return a deterministic mock meeting URL.

export type ZoomMeetingInput = {
  topic: string;
  startTimeIso: string;
  durationMinutes: number;
  hostEmail?: string;
};

export type ZoomMeeting = {
  joinUrl: string;
  startUrl: string;
  mock: boolean;
};

export const zoomEnabled =
  !!process.env.ZOOM_ACCOUNT_ID &&
  !!process.env.ZOOM_CLIENT_ID &&
  !!process.env.ZOOM_CLIENT_SECRET;

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");
  const resp = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    }
  );
  if (!resp.ok) throw new Error(`Zoom token failed: ${resp.status}`);
  const data = (await resp.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    exp: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function createZoomMeeting(input: ZoomMeetingInput): Promise<ZoomMeeting> {
  if (!zoomEnabled) {
    const id = Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000);
    return {
      joinUrl: `https://zoom.us/j/${id}?pwd=mock`,
      startUrl: `https://zoom.us/s/${id}?zak=mock`,
      mock: true,
    };
  }
  const token = await getAccessToken();
  const resp = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(input.hostEmail ?? "me")}/meetings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: input.topic,
        type: 2,
        start_time: input.startTimeIso,
        duration: input.durationMinutes,
        timezone: "Asia/Seoul",
        settings: { join_before_host: false, waiting_room: true },
      }),
    }
  );
  if (!resp.ok) throw new Error(`Zoom create failed: ${resp.status}`);
  const data = (await resp.json()) as { join_url: string; start_url: string };
  return { joinUrl: data.join_url, startUrl: data.start_url, mock: false };
}
