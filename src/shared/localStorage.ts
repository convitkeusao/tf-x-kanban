export function readLocalData<T>(key: string, initialData: T): T {
  const stored = window.localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : initialData;
}

export function saveLocalData<T>(key: string, data: T): void {
  window.localStorage.setItem(key, JSON.stringify(data));
}
