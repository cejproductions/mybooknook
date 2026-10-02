const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type Kind = 'book' | 'vinyl';

export type Visibility = 'private' | 'friends' | 'public';

export type CollectionStatus = 'owned' | 'wishlist';

export type ReadingStatus = 'unread' | 'in_progress' | 'finished';

export type Profile = {
  display_name: string;
  bio: string;
  profile_photo_url: string | null;
  profile_visibility: Visibility;
  books_visibility: Visibility;
  vinyl_visibility: Visibility;
};

export type User = {
  id: string;
  username: string;
  email: string;
  profile: Profile;
};

export type Item = {
  id: string;
  kind: Kind;
  title: string;
  creator: string;
  identifier: string | null;
  cover_url: string | null;
  year: number | null;
  description: string;
  edition: string | null;
  publisher_label: string | null;
  catalog_number: string | null;
  special_edition: boolean;
};

export type NewItem = Omit<Item, 'id'>;

export type Entry = {
  id: string;
  item: Item;
  status: CollectionStatus;
  visibility: Visibility;
  reading_status: ReadingStatus | null;
  personal_notes: string;
  acquired_at: string | null;
  added_at: string;
  updated_at: string;
};

export type PublicEntry = {
  id: string;
  item: Item;
  status: CollectionStatus;
  visibility: Visibility;
  reading_status: ReadingStatus | null;
  added_at: string;
  updated_at: string;
};

export type Rating = {
  id: string;
  user_id: string;
  item_id: string;
  stars: number;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  item_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ProfilePatch = {
  display_name?: string;
  bio?: string;
  profile_visibility?: Visibility;
  books_visibility?: Visibility;
  vinyl_visibility?: Visibility;
};

export function mediaUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${BASE}${value.startsWith('/') ? value : `/${value}`}`;
}


function formatApiError(detail: unknown, status: number): string {
  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (
          typeof entry === 'object' &&
          entry !== null &&
          'msg' in entry &&
          typeof entry.msg === 'string'
        ) {
          return entry.msg;
        }

        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  return `Request failed (${status})`;
}

export async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Cannot reach the API. Check that FastAPI is running.',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      formatApiError(error?.detail, response.status),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}