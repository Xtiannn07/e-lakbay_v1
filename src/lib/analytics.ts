import { supabase } from './supabaseClient';

const SESSION_STORAGE_KEY = 'elakbay-analytics-session-id';
const LANDING_STORAGE_KEY = 'elakbay-analytics-landing-path';
const ANON_FIRST_SEEN_KEY = 'elakbay-analytics-anon-first-seen';
const ANON_MIN_MS = 10_000;

type BaseAnalyticsPayload = {
  userId?: string | null;
  userRole?: string | null;
  pagePath?: string | null;
};

type SearchPayload = BaseAnalyticsPayload & {
  query: string;
  scope: 'products' | 'destinations' | 'global';
  resultCount?: number | null;
  filters?: Record<string, unknown>;
  destinationId?: string | null;
  productId?: string | null;
  ownerId?: string | null;
};

type FilterPayload = BaseAnalyticsPayload & {
  scope: 'products' | 'destinations' | 'global';
  filterName: string;
  filterValue?: string | number | boolean | null;
  filters?: Record<string, unknown>;
};

type ContentViewPayload = {
  contentType: 'destination' | 'product' | 'profile';
  contentId: string;
  ownerId?: string | null;
  userId?: string | null;
  userRole?: string | null;
  pagePath?: string | null;
};

let lastPageViewEventKey = '';
let lastSearchEventKey = '';
let lastFilterEventKey = '';
let lastContentEventKey = '';

function shouldTrackPageView(path: string, userId?: string | null) {
  const cleanPath = path.split('?')[0]?.split('#')[0] ?? path;

  if (cleanPath.startsWith('/dashboard') || cleanPath.startsWith('/admin')) {
    return false;
  }

  const profileMatch = cleanPath.match(/^\/profile\/([^/]+)$/);
  if (profileMatch && userId && profileMatch[1] === userId) {
    return false;
  }

  return true;
}

function isOwnerView(ownerId?: string | null, userId?: string | null) {
  return Boolean(ownerId && userId && ownerId === userId);
}

function getAnonFirstSeen(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(ANON_FIRST_SEEN_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureAnonFirstSeen() {
  if (typeof window === 'undefined') return;
  const existing = getAnonFirstSeen();
  if (existing) return;
  window.localStorage.setItem(ANON_FIRST_SEEN_KEY, String(Date.now()));
}

function shouldTrackAnonymous() {
  if (typeof window === 'undefined') return false;
  const firstSeen = getAnonFirstSeen();
  if (!firstSeen) {
    ensureAnonFirstSeen();
    return false;
  }
  return Date.now() - firstSeen >= ANON_MIN_MS;
}

function shouldTrackByRole(userId?: string | null, userRole?: string | null) {
  if (!userId) {
    const result = shouldTrackAnonymous();
    console.log('[Analytics] shouldTrackByRole - anonymous user, shouldTrackAnonymous:', result);
    return result;
  }

  const result = userRole === 'tourist';
  console.log('[Analytics] shouldTrackByRole - logged in user, role:', userRole, 'result:', result);
  return result;
}

function buildMetadata(userRole?: string | null, extra?: Record<string, unknown>) {
  return {
    user_role: userRole ?? null,
    ...(extra ?? {}),
  };
}

function isUuid(value?: string | null) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
}

function getLandingPath(currentPath: string): string {
  if (typeof window === 'undefined') return currentPath;
  const existing = window.localStorage.getItem(LANDING_STORAGE_KEY);
  if (existing) return existing;
  window.localStorage.setItem(LANDING_STORAGE_KEY, currentPath);
  return currentPath;
}

async function insertEvent(payload: Record<string, unknown>) {
  console.log('[Analytics] Inserting event:', payload);
  const { error } = await supabase.from('analytics_events').insert(payload);
  if (error) {
    console.error('[Analytics] Failed to insert analytics event:', error);
  } else {
    console.log('[Analytics] Event inserted successfully');
  }
}

export function initializeAnalyticsSession({
  userId,
  userRole,
}: {
  userId?: string | null;
  userRole?: string | null;
}) {
  if (userId) return;
  if (userRole && userRole !== 'tourist') return;
  ensureAnonFirstSeen();
}

export async function trackPageView({ userId, userRole, pagePath }: BaseAnalyticsPayload = {}) {
  const path = pagePath ?? (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/');
  if (!shouldTrackPageView(path, userId)) return;
  if (!shouldTrackByRole(userId, userRole)) return;
  const landingPath = getLandingPath(path);
  const eventKey = path;
  if (lastPageViewEventKey === eventKey) return;
  lastPageViewEventKey = eventKey;

  await insertEvent({
    session_id: getSessionId(),
    user_id: userId ?? null,
    event_name: 'page_view',
    page_path: path,
    landing_path: landingPath,
    metadata: buildMetadata(userRole),
  });
}

export async function trackSearchPerformed({
  query,
  scope,
  resultCount,
  userId,
  userRole,
  pagePath,
  filters,
  destinationId,
  productId,
  ownerId,
}: SearchPayload) {
  console.log('[Analytics] trackSearchPerformed called:', { query, scope, userId, userRole, destinationId, productId, ownerId });
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    console.log('[Analytics] Skipping: empty query');
    return;
  }
  if (!shouldTrackByRole(userId, userRole)) {
    console.log('[Analytics] Skipping: shouldTrackByRole returned false for role:', userRole);
    return;
  }
  const eventKey = `${scope}|${normalizedQuery.toLowerCase()}|${resultCount ?? ''}|${pagePath ?? ''}|${destinationId ?? ''}|${productId ?? ''}`;
  if (lastSearchEventKey === eventKey) {
    console.log('[Analytics] Skipping: duplicate event key');
    return;
  }
  lastSearchEventKey = eventKey;

  // Determine content_id and content_type for metadata constraint
  const contentId = destinationId ?? productId ?? null;
  const contentType = destinationId ? 'destination' : productId ? 'product' : null;

  await insertEvent({
    session_id: getSessionId(),
    user_id: userId ?? null,
    event_name: 'search_performed',
    page_path: pagePath ?? null,
    search_query: normalizedQuery,
    search_scope: scope,
    search_result_count: typeof resultCount === 'number' ? resultCount : null,
    filters: filters ?? {},
    metadata: buildMetadata(userRole, {
      owner_id: ownerId ?? null,
      content_id: contentId,
      content_type: contentType,
    }),
    destination_id: isUuid(destinationId) ? destinationId : null,
    product_id: isUuid(productId) ? productId : null,
  });
}

export async function trackFilterUsage({
  scope,
  filterName,
  filterValue,
  userId,
  userRole,
  pagePath,
  filters,
}: FilterPayload) {
  if (!shouldTrackByRole(userId, userRole)) return;
  const eventKey = `${scope}|${filterName}|${String(filterValue ?? '')}|${pagePath ?? ''}`;
  if (lastFilterEventKey === eventKey) return;
  lastFilterEventKey = eventKey;

  await insertEvent({
    session_id: getSessionId(),
    user_id: userId ?? null,
    event_name: 'filter_used',
    page_path: pagePath ?? null,
    search_scope: scope,
    filters: {
      filter_name: filterName,
      filter_value: filterValue ?? null,
      ...(filters ?? {}),
    },
    metadata: buildMetadata(userRole),
  });
}

export async function trackContentView({
  contentType,
  contentId,
  ownerId,
  userId,
  userRole,
  pagePath,
}: ContentViewPayload) {
  if (isOwnerView(ownerId, userId)) return;
  if (!shouldTrackByRole(userId, userRole)) return;
  const eventKey = `${contentType}|${contentId}|${userId ?? 'anon'}`;
  if (lastContentEventKey === eventKey) return;
  lastContentEventKey = eventKey;

  const normalizedContentId = isUuid(contentId) ? contentId : null;
  const destinationId = contentType === 'destination' ? normalizedContentId : null;
  const productId = contentType === 'product' ? normalizedContentId : null;

  await insertEvent({
    session_id: getSessionId(),
    user_id: userId ?? null,
    event_name: 'page_view',
    page_path: pagePath ?? `modal:${contentType}:${contentId}`,
    landing_path: pagePath ?? null,
    destination_id: destinationId,
    product_id: productId,
    metadata: buildMetadata(userRole, {
      content_type: contentType,
      content_id: contentId,
      owner_id: ownerId ?? null,
    }),
  });
}

export async function trackProfileView({
  profileId,
  userId,
  userRole,
}: { profileId: string; userId?: string | null; userRole?: string | null }) {
  if (isOwnerView(profileId, userId)) return;
  if (!shouldTrackByRole(userId, userRole)) return;
  const eventKey = `profile|${profileId}|${userId ?? 'anon'}`;
  if (lastContentEventKey === eventKey) return;
  lastContentEventKey = eventKey;

  await insertEvent({
    session_id: getSessionId(),
    user_id: userId ?? null,
    event_name: 'page_view',
    page_path: `/profile/${profileId}`,
    landing_path: `/profile/${profileId}`,
    metadata: buildMetadata(userRole, {
      content_type: 'profile',
      content_id: profileId,
      owner_id: profileId,
    }),
  });
}
