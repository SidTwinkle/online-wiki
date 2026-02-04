<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* Layout transitions */
.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}

/* Loading states */
.loading-enter-active {
  transition: opacity 0.3s ease-in-out;
}

.loading-enter-from {
  opacity: 0;
}

/* Optimize font loading */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('Inter Regular'), local('Inter-Regular');
}

/* Critical CSS for above-the-fold content */
.critical-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* Reduce layout shift */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Optimize images */
img {
  content-visibility: auto;
}

/* Lazy loading placeholder */
.lazy {
  opacity: 0;
  transition: opacity 0.3s;
}

.lazy.loaded {
  opacity: 1;
}
</style>