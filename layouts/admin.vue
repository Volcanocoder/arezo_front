<template>
    <div class="admin-layout">
      <AdminSidebar />
  
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </template>
  
  <style>
.admin-layout a { text-decoration: none; }
</style>

<style scoped>
  .admin-layout {
    min-height: 100vh;
    display: flex;
  
    background: #f8f8fc;
  }
  
  .admin-main {
    flex: 1;
    min-width: 0;
  }
  
  @media (max-width: 850px) {
    .admin-layout {
      flex-direction: row;
    }
  }
  </style>