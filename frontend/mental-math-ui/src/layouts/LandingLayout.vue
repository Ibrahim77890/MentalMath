<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar class="justify-end">
        <q-btn class="nav-btn" flat round dense label="Dashboard" @click="go('/dashboard')" />
        <q-btn class="nav-btn" flat round dense label="Start" @click="go('/landing')" />
        <q-btn class="nav-btn" flat round dense label="Admin" @click="go('/admin')" />
      </q-toolbar>
    </q-header>

    <!-- <q-drawer v-model="drawer" show-if-above side="left" bordered>
      <q-list padding>
        <q-item clickable v-ripple @click="go('/')">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Home</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="go('/dashboard')">
          <q-item-section avatar>
            <q-icon name="bar_chart" />
          </q-item-section>
          <q-item-section>Analytics</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="go('/landing')">
          <q-item-section avatar>
            <q-icon name="school" />
          </q-item-section>
          <q-item-section>Start Practicing</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable v-ripple @click="go('/about')">
          <q-item-section avatar><q-icon name="info" /></q-item-section>
          <q-item-section>About</q-item-section>
        </q-item>
      </q-list>
    </q-drawer> -->

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="text-center">
      <div class="q-pa-sm">
        <div>© 2025 MentalMath</div>
        <div class="text-caption">Built for learning, confidence & speed — web + mobile + desktop</div>
      </div>
    </q-footer>
  </q-layout>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const drawer = ref(true);
const router = useRouter();

function go(path: string) {
  // router.push(path);
}
</script>

<style scoped>
/* small layout styling adjustments */
.q-toolbar-title {
  cursor: pointer;
}
</style>
