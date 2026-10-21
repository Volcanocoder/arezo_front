<script setup lang="ts">
const wishCategories = await useWishCategories()
const categories = computed(() => wishCategories.value.map(c => ({
  title: c.name,
  description: c.description,
  icon: c.icon,
  color: c.color
})))
</script>

<template>
  <section class="categories">
    <div class="container">

      <div class="section-header">
        <span class="section-badge">
          چه آرزویی را می‌خواهی پیدا کنی؟
        </span>

        <h2>
          دسته‌بندی آرزوها
        </h2>

        <p>
          از بین دسته‌بندی‌های مختلف، آرزویی را پیدا کن که می‌توانی برای واقعی شدنش قدم برداری.
        </p>
      </div>

      <div class="categories-grid">
        <NuxtLink
          v-for="category in categories"
          :key="category.title"
          :to="{ path: '/wishes', query: { category: category.title } }"
          class="category-card"
        >
          <div
            class="category-icon"
            :style="{ backgroundColor: category.color }"
          >
            {{ category.icon }}
          </div>

          <div class="category-content">
            <h3>
              {{ category.title }}
            </h3>

            <p>
              {{ category.description }}
            </p>
          </div>

          <span class="arrow">
            ←
          </span>
        </NuxtLink>
      </div>

    </div>
  </section>
</template>

<style scoped>
.categories {
  padding: 120px 20px;
  background: #f8f8fc;
}

.container {
  width: min(1150px, 100%);
  margin: 0 auto;
}

.section-header {
  max-width: 650px;
  margin: 0 auto 50px;
  text-align: center;
}

.section-badge {
  display: inline-flex;
  align-items: center;

  padding: 8px 15px;
  border-radius: 999px;

  background: #eceaff;
  color: var(--color-primary);

  font-size: 12px;
  font-weight: 700;
}

.section-header h2 {
  margin: 16px 0 10px;

  font-size: clamp(32px, 4vw, 46px);
  font-weight: 800;
  line-height: 1.4;
}

.section-header p {
  margin: 0;

  color: var(--color-muted);
  font-size: 15px;
  line-height: 2;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.category-card {
  display: flex;
  align-items: center;

  gap: 15px;
  padding: 20px;

  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 20px;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(40, 40, 80, 0.07);
}

.category-icon {
  width: 58px;
  height: 58px;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 17px;

  font-size: 26px;
}

.category-content {
  flex: 1;
  min-width: 0;
}

.category-content h3 {
  margin: 0 0 5px;

  font-size: 16px;
  font-weight: 800;
}

.category-content p {
  margin: 0;

  color: var(--color-muted);

  font-size: 11px;
  line-height: 1.8;
}

.arrow {
  color: var(--color-primary);
  font-size: 20px;
  opacity: 0.8;
}

@media (max-width: 900px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .categories {
    padding: 80px 20px;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>