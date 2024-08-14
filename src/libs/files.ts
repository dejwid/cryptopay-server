export function nameFromPath(path:string): string {
  return path.split('/').pop() || '';
}