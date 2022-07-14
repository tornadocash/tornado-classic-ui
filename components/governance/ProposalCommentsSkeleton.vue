<template>
  <div>
    <div v-for="index in size" :key="index" class="proposals-box">
      <div class="columns is-gapless">
        <div class="column is-8-tablet is-9-desktop">
          <div class="proposals-box--title">
            <b-skeleton height="21" width="210" />
          </div>
          <div class="proposals-box--info">
            <b-skeleton height="21" width="260" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    size: {
      type: Number,
      default: 3
    }
  }
}
</script>
