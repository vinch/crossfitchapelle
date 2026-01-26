<script lang="ts">
  interface Props {
    variant?: "full" | "simple";
    isScrolled?: boolean;
    activeSection?: string;
    mobileMenuOpen?: boolean;
    menuItems?: Array<{ id: string; label: string }>;
    onLogoClick?: () => void;
    onLinkClick?: (sectionId: string, e: MouseEvent) => void;
    onToggleMobileMenu?: () => void;
  }

  let {
    variant = "full",
    isScrolled = false,
    activeSection = "",
    mobileMenuOpen = false,
    menuItems = [],
    onLogoClick,
    onLinkClick,
    onToggleMobileMenu,
  }: Props = $props();

  const defaultMenuItems = [
    { id: "accueil", label: "Accueil" },
    { id: "a-propos", label: "À propos" },
    { id: "abonnements", label: "Abonnements" },
    { id: "horaires", label: "Horaires" },
    { id: "contact", label: "Contact" },
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  function handleLogoClick() {
    if (onLogoClick) {
      onLogoClick();
    }
  }

  function handleLinkClick(sectionId: string, e: MouseEvent) {
    if (onLinkClick) {
      onLinkClick(sectionId, e);
    }
  }
</script>

<header class="header" class:scrolled={isScrolled}>
  <div class="header-container">
    <div class="logo-container">
      {#if variant === "full" && onLogoClick}
        <button class="logo-button" onclick={handleLogoClick} type="button">
          <img src="/logo.png" alt="Logo CrossFit Chapelle" class="logo" />
        </button>
      {:else}
        <a href="/" class="logo-button">
          <img src="/logo.png" alt="Logo CrossFit Chapelle" class="logo" />
        </a>
      {/if}
    </div>
    {#if variant === "full"}
      <nav class="nav desktop-nav">
        <ul class="nav-list">
          {#each items as item}
            <li class="nav-item">
              <a
                href="#{item.id}"
                class="nav-link"
                class:active={activeSection === item.id}
                onclick={(e) => handleLinkClick(item.id, e)}
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>
      <button
        class="hamburger"
        onclick={onToggleMobileMenu}
        aria-label="Menu"
        aria-expanded={mobileMenuOpen}
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    {:else}
      <nav class="nav">
        <a href="/" class="nav-link back-link">
          <span class="back-arrow">←</span>
          <span class="back-text-full">Retour au site</span>
          <span class="back-text-short">Retour</span>
        </a>
      </nav>
    {/if}
  </div>
  {#if variant === "full" && mobileMenuOpen}
    <nav class="mobile-nav">
      <ul class="mobile-nav-list">
        {#each items as item}
          <li class="mobile-nav-item">
            <a
              href="#{item.id}"
              class="mobile-nav-link"
              class:active={activeSection === item.id}
              onclick={(e) => handleLinkClick(item.id, e)}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    height: 120px;
    transition: height 0.3s ease;
    --header-height: 120px;
  }

  .header.scrolled {
    height: 80px;
    --header-height: 80px;
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    height: 120px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: height 0.3s ease;
  }

  .header.scrolled .header-container {
    height: 80px;
  }

  .logo-container {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .logo-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
    text-decoration: none;
  }

  .logo-button:hover {
    opacity: 0.8;
  }

  .logo {
    height: auto;
    max-height: 86px;
    width: auto;
    max-width: 450px;
    display: block;
    object-fit: contain;
    transition: max-height 0.3s ease;
  }

  .header.scrolled .logo {
    max-height: 60px;
  }

  .nav {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .nav-list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem;
  }

  .nav-item {
    margin: 0;
  }

  .nav-link {
    font-size: 1rem;
    color: #fff;
    padding: 0.5rem 1rem;
    transition:
      color 0.3s ease,
      text-decoration 0.3s ease;
    text-decoration: none;
    position: relative;
    display: inline-block;
  }

  .nav-link:hover {
    color: #ffde01;
  }

  .nav-link.active {
    color: #ffde01;
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-underline-offset: 8px;
  }

  .back-link {
    font-size: 1rem;
    color: #fff;
    padding: 0.5rem 1rem;
    transition: color 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .back-link:hover {
    color: #ffde01;
  }

  .back-arrow {
    font-size: 1.2rem;
    line-height: 1;
  }

  .back-text-short {
    display: none;
  }

  /* Menu hamburger */
  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    z-index: 1001;
  }

  .hamburger-line {
    width: 25px;
    height: 3px;
    background-color: #fff;
    transition: all 0.3s ease;
    border-radius: 2px;
    transform-origin: center;
  }

  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }

  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }

  /* Menu mobile */
  .mobile-nav {
    display: none;
    position: fixed;
    top: 120px;
    left: 0;
    right: 0;
    background-color: #000;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-nav-list {
    list-style: none;
    margin: 0;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
  }

  .mobile-nav-item {
    margin: 0;
  }

  .mobile-nav-link {
    display: block;
    font-size: 1rem;
    color: #fff;
    padding: 1rem 2rem;
    text-decoration: none;
    transition: background-color 0.3s ease;
  }

  .mobile-nav-link:hover,
  .mobile-nav-link.active {
    background-color: #333;
    color: #ffde01;
  }

  /* Responsive */
  @media (max-width: 1264px) {
    .header {
      height: 80px;
      --header-height: 80px;
    }

    .header.scrolled {
      height: 80px;
      --header-height: 80px;
    }

    .header-container {
      height: 80px;
    }

    .logo {
      height: 60px;
    }

    .nav-list {
      gap: 1rem;
    }
  }

  @media (max-width: 1024px) {
    .nav-list {
      gap: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .header-container {
      padding: 0 1rem;
    }

    .desktop-nav {
      display: none;
    }

    .hamburger {
      display: flex;
    }

    .mobile-nav {
      display: block;
      top: 80px;
    }

    .back-text-full {
      display: none;
    }

    .back-text-short {
      display: inline;
    }
  }
</style>
