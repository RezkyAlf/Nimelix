// Process-local cache: also works on runtimes without Next's persistent fetch cache.
// Failed requests are removed so retries can recover immediately.
export function createRequestCache(maxEntries = 128) {
 const entries = new Map<string, {expires: number; promise: Promise<unknown>}>();
 return function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = entries.get(key);
  if (existing && existing.expires > now) {
   entries.delete(key);
   entries.set(key, existing);
   return existing.promise as Promise<T>;
  }
  entries.delete(key);
  for (const [oldKey, entry] of entries) if (entry.expires <= now) entries.delete(oldKey);
  while (entries.size >= maxEntries) entries.delete(entries.keys().next().value!);
  const entry = {expires: Infinity, promise: Promise.resolve() as Promise<unknown>};
  entry.promise = Promise.resolve().then(load).then(value => {
   entry.expires = Date.now() + ttlMs;
   return value;
  }).catch(error => {
   if (entries.get(key) === entry) entries.delete(key);
   throw error;
  });
  entries.set(key, entry);
  return entry.promise as Promise<T>;
 };
}
