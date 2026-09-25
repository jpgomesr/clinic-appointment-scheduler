const STORAGE_KEY = "token";

export function getToken(): string | null {
   try {
      return localStorage.getItem(STORAGE_KEY);
   } catch {
      return null;
   }
}

export function setToken(token: string) {
   try {
      localStorage.setItem(STORAGE_KEY, token);
   } catch {
      // localStorage indisponível (ex.: modo privado do Safari) — sessão não persiste no reload
   }
}

export function clearToken() {
   try {
      localStorage.removeItem(STORAGE_KEY);
   } catch {
      // ver comentário em setToken
   }
}
