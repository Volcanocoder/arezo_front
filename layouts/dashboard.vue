<template>
    <div class="dashboard-layout">
  
      <DashboardSidebar />
  
      <main class="dashboard-main">
        <slot />
      </main>
  
    </div>
  </template>
  
  <style scoped>
  .dashboard-layout {
    min-height: 100vh;
  
    display: flex;
  
    background: #f8f8fc;
  }
  
  .dashboard-main {
    flex: 1;
    min-width: 0;
  }
  
  @media (max-width: 850px) {
    .dashboard-layout {
      flex-direction: row;
    }
  }
  </style>