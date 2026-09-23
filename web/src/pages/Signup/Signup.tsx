import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../services/api";
import "../Login/Login.css";

export function Signup() {
   const { signup } = useAuth();
   const navigate = useNavigate();

   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);

   async function handleSubmit(event: FormEvent) {
      event.preventDefault();
      setError(null);
      setSubmitting(true);

      try {
         await signup({ name, email, password, confirmPassword });
         navigate("/");
      } catch (err) {
         setError(err instanceof ApiError ? err.message : "Erro inesperado");
      } finally {
         setSubmitting(false);
      }
   }

   return (
      <section className="auth-form">
         <h1>Criar conta</h1>

         <form onSubmit={handleSubmit}>
            <label htmlFor="name">Nome</label>
            <input
               id="name"
               type="text"
               autoComplete="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
            />

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
               autoComplete="new-password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
            />

            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
               id="confirmPassword"
               type="password"
               autoComplete="new-password"
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={submitting}>
               {submitting ? "Criando..." : "Criar conta"}
            </button>
         </form>

         <p>
            Já tem uma conta? <Link to="/login">Entrar</Link>
         </p>
      </section>
   );
}
