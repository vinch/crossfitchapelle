<script lang="ts">
  import { page } from "$app/stores";
  import { createClient } from "$lib/supabase/client";
  import { onMount } from "svelte";

  let { data, children } = $props<{ data: { session: any }; children: any }>();
  let supabase = createClient();
  let session = $state(data.session);
  let mobileMenuOpen = $state(false);

  onMount(() => {
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session = newSession;
    });
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

{#if !session && $page.url.pathname !== "/admin/login"}
  <!-- Redirection gérée par +layout.server.ts -->
{/if}

{#if session || $page.url.pathname === "/admin/login"}
  <div class="admin-layout">
    {#if session && $page.url.pathname !== "/admin/login"}
      <nav class="admin-nav">
        <div class="admin-nav-container">
          <a href="/" class="admin-logo">CrossFit Chapelle</a>
          <div class="admin-nav-links desktop-nav">
            <a href="/admin" class:active={$page.url.pathname === "/admin"}>
              Horaires
            </a>
            <a
              href="/admin/course-types"
              class:active={$page.url.pathname === "/admin/course-types"}
            >
              Types de cours
            </a>
          </div>
          <div class="admin-nav-right">
            <button
              class="admin-signout desktop-signout"
              onclick={handleSignOut}
            >
              Déconnexion
            </button>
            <button
              class="hamburger"
              onclick={toggleMobileMenu}
              aria-label="Menu"
            >
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </div>
        </div>
        {#if mobileMenuOpen}
          <div class="mobile-menu">
            <a
              href="/admin"
              class:active={$page.url.pathname === "/admin"}
              onclick={closeMobileMenu}
            >
              Horaires
            </a>
            <a
              href="/admin/course-types"
              class:active={$page.url.pathname === "/admin/course-types"}
              onclick={closeMobileMenu}
            >
              Types de cours
            </a>
            <button
              class="admin-signout mobile-signout"
              onclick={handleSignOut}
            >
              Déconnexion
            </button>
          </div>
        {/if}
      </nav>
    {/if}
    <main
      class="admin-main"
      class:has-padding={session && $page.url.pathname !== "/admin/login"}
    >
      {@render children()}
    </main>
  </div>
{/if}

<style>
  :global(body) {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    margin: 0;
  }

  .admin-layout {
    min-height: 100vh;
    background-color: #f5f5f5;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  .admin-nav {
    background-color: #000;
    color: #fff;
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .admin-nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
  }

  .admin-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffde01;
    text-decoration: none;
  }

  .admin-nav-links {
    display: flex;
    gap: 2rem;
    flex: 1;
    justify-content: center;
  }

  .admin-nav-links a {
    color: #fff;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }

  .admin-nav-links a:hover,
  .admin-nav-links a.active {
    background-color: rgba(255, 222, 1, 0.2);
    color: #ffde01;
  }

  .admin-nav-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .admin-signout {
    background: none;
    border: 1px solid #fff;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-size: 1rem;
  }

  .admin-signout:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: space-around;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10;
  }

  .hamburger-line {
    width: 100%;
    height: 2px;
    background-color: #fff;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    padding: 1rem 2rem;
    background-color: #000;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-menu a,
  .mobile-menu button {
    color: #fff;
    text-decoration: none;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    text-align: left;
    cursor: pointer;
    font-size: 1rem;
    font-family: inherit;
  }

  .mobile-menu a:last-child,
  .mobile-menu button:last-child {
    border-bottom: none;
  }

  .mobile-menu a:hover,
  .mobile-menu a.active {
    color: #ffde01;
  }

  .mobile-signout {
    margin-top: 0.5rem;
  }

  .admin-main {
    max-width: 1200px;
    margin: 0 auto;
  }

  .admin-main.has-padding {
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .admin-main.has-padding {
      padding: 1rem;
    }
  }

  @media (max-width: 768px) {
    .desktop-nav,
    .desktop-signout {
      display: none;
    }

    .hamburger {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }

    .admin-nav-container {
      padding: 0 1rem;
    }
  }
</style>
