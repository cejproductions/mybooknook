const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export type Kind = 'book' | 'vinyl';
export type Item = { id: string; kind: Kind; title: string; creator: string; identifier: string | null; cover_url: string | null; year: number | null; description: string };
export type Entry = { id: string; item: Item; status: string; visibility: 'private' | 'public'; rating: number | null; review: string; added_at: string };
export type User = { id: string; username: string; bio: string };
export type NewItem = Omit<Item, 'id'>;
export async function request<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch { throw new Error('Cannot reach the API. Check that FastAPI is running.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
