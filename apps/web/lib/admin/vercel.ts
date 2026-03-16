const VERCEL_BASE = 'https://api.vercel.com';

function vercelHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN ?? ''}`,
    'Content-Type': 'application/json',
  };
}

export interface VercelDeployment {
  uid: string;
  name: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  target: string | null;
  createdAt: number;
  url: string;
  meta?: { githubCommitMessage?: string; githubCommitRef?: string };
}

export async function getRecentDeployments(): Promise<VercelDeployment[]> {
  if (!process.env.VERCEL_API_TOKEN) return [];
  try {
    const params = new URLSearchParams({ limit: '10' });
    if (process.env.VERCEL_PROJECT_ID) params.set('projectId', process.env.VERCEL_PROJECT_ID);
    const res = await fetch(`${VERCEL_BASE}/v6/deployments?${params}`, {
      headers: vercelHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.deployments ?? [];
  } catch {
    return [];
  }
}
