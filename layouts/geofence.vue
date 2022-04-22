<template>
  <div class="wrapper geofence">
    <nav class="navbar header" role="navigation" aria-label="main navigation">
      <div class="container">
        <div class="navbar-brand">
          <nuxt-link to="/" active-class="" class="navbar-item">
            <Logo />
          </nuxt-link>
        </div>
      </div>
    </nav>
    <section class="main-content section">
      <div class="container">
        <nuxt />
      </div>
    </section>
    <Footer />
  </div>
</template>

<script>
/* eslint-disable no-console */
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

export default {
  components: {
    Logo,
    Footer
  }
}
</script>
