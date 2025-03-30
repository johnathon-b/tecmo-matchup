<template>
  <div>
    <div class="star-field">
      <!-- We'll generate multiple star elements here or with a loop -->
      <div class="star" v-for="n in 30" :key="n"></div>
    </div>
    <NuxtPage />
  </div>
</template>