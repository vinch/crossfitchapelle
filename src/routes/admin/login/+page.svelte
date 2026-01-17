<script lang="ts">
  import { createClient } from "$lib/supabase/client";
  import { goto } from "$app/navigation";

  let email = $state("");
  let loading = $state(false);
  let message = $state<{ type: "success" | "error"; text: string } | null>(
    null
  );
  let supabase = createClient();

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    message = null;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        },
      });

      if (error) {
        message = { type: "error", text: error.message };
      } else {
        message = {
          type: "success",
          text: "Un lien de connexion a été envoyé à votre adresse email.",
        };
        email = "";
      }
    } catch (err) {
      message = {
        type: "error",
        text: "Une erreur est survenue. Veuillez réessayer.",
      };
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>Connexion admin</h1>
    <p class="login-subtitle">
      Entrez votre adresse email pour recevoir un lien de connexion.
    </p>

    <form onsubmit={handleLogin}>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          disabled={loading}
          placeholder="votre@email.com"
        />
      </div>

      {#if message}
        <div class="message message-{message.type}">
          {message.text}
        </div>
      {/if}

      <button type="submit" disabled={loading} class="submit-button">
        {loading ? "Envoi..." : "Envoyer le lien de connexion"}
      </button>
    </form>

    <a href="/" class="back-link">← Retour au site</a>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
  }

  .login-card {
    background: white;
    padding: 3rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 100%;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 2rem;
  }

  .login-subtitle {
    color: #666;
    margin-bottom: 2rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #ffde01;
  }

  input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .message {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .message-success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .message-error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .submit-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #000;
    color: #ffde01;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #333;
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .back-link {
    display: block;
    text-align: center;
    margin-top: 1.5rem;
    color: #666;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .back-link:hover {
    color: #000;
  }
</style>
