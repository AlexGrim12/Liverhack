// Acepta "https://github.com/usuario/repo", "github.com/usuario/repo" o "usuario/repo".
export function parseRepo(entrada: string): { owner: string; repo: string } | null {
  const m = /^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?(?:[\/?#].*)?$/.exec(entrada.trim());
  return m ? { owner: m[1], repo: m[2] } : null;
}
