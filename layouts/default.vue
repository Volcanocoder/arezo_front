<template>
    <div class="site-layout">
      <Header />
  
      <main class="site-main">
        <slot />
      </main>
  
      <Footer />
    </div>
  </template>
  
  <style scoped>
  .site-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .site-main {
    flex: 1;
  }
  </style>