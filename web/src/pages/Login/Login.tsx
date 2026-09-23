import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../services/api";
import "./Login.css";

export function Login() {
   const { login } = useAuth();
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);

   async function handleSubmit(event: FormEvent) {
      event.preventDefault();
      setError(null);
      setSubmitting(true);

      try {
         await login({ email, password });
         navigate("/");
      } catch (err) {
         setError(err instanceof ApiError ? err.message : "Erro inesperado");
      } finally {
         setSubmitting(false);
      }
   }

   return (
      <section className="auth-form">
         <h1>Entrar</h1>

         <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
               id="email"
               type="email"
               autoComplete="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
            />

            <label htmlFor="password">Senha</label>
            <input
               id="password"
               type="password"
               autoComplete="current-password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={submitting}>
               {submitting ? "Entrando..." : "Entrar"}
            </button>
         </form>

         <p>
            Não tem uma conta? <Link to="/signup">Cadastre-se</Link>
         </p>
      </section>
   );
}
