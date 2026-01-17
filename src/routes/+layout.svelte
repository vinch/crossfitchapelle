<script lang="ts">
  let { children } = $props();
</script>

<svelte:head>
  <title>CrossFit Chapelle - Salle de sport à Chapelle-lez-Herlaimont</title>
  <meta
    name="description"
    content="CrossFit Chapelle - Salle de sport pour tous à partir de 6 ans. Activités physiques adaptées à votre niveau, votre âge et vos objectifs. Rejoignez-nous à Chapelle-lez-Herlaimont."
  />
  <meta
    name="keywords"
    content="CrossFit, salle de sport, fitness, Chapelle-lez-Herlaimont, musculation, entraînement, coaching sportif"
  />
  <meta name="author" content="CrossFit Chapelle" />
  <meta name="robots" content="index, follow" />
  <link
    rel="canonical"
    href="https://www.crossfit-chapelle-lez-herlaimont.com/"
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta
    property="og:url"
    content="https://www.crossfit-chapelle-lez-herlaimont.com/"
  />
  <meta
    property="og:title"
    content="CrossFit Chapelle - Salle de sport à Chapelle-lez-Herlaimont"
  />
  <meta
    property="og:description"
    content="CrossFit Chapelle - Salle de sport pour tous à partir de 6 ans. Activités physiques adaptées à votre niveau, votre âge et vos objectifs."
  />
  <meta
    property="og:image"
    content="https://www.crossfit-chapelle-lez-herlaimont.com/logo.png"
  />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta
    property="twitter:url"
    content="https://www.crossfit-chapelle-lez-herlaimont.com/"
  />
  <meta
    property="twitter:title"
    content="CrossFit Chapelle - Salle de sport à Chapelle-lez-Herlaimont"
  />
  <meta
    property="twitter:description"
    content="CrossFit Chapelle - Salle de sport pour tous à partir de 6 ans. Activités physiques adaptées à votre niveau, votre âge et vos objectifs."
  />
  <meta
    property="twitter:image"
    content="https://www.crossfit-chapelle-lez-herlaimont.com/logo.png"
  />

  <link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>

{@render children()}
