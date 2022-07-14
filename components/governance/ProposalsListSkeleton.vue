<template>
  <div>
    <div v-for="index in size" :key="index" class="proposals-box">
      <div class="columns is-gapless">
        <div class="column is-8-tablet is-9-desktop">
          <div class="proposals-box--title">
            <b-skeleton height="28" width="210"></b-skeleton>
          </div>
          <div class="proposals-box--info">
            <div class="proposals-box--id"><b-skeleton height="28" width="30"></b-skeleton></div>
            <b-skeleton height="28" width="70"></b-skeleton>
            <div class="date">
              <b-skeleton height="21" width="130"></b-skeleton>
            </div>
            <div class="date">
              <b-skeleton height="21" width="130"></b-skeleton>
            </div>
            <div class="date">
              <b-skeleton height="21" width="130"></b-skeleton>
            </div>
          </div>
        </div>
        <div class="column is-4-tablet is-3-desktop">
          <div class="results">
            <div class="result">
              <span class="has-text-primary"><b-icon icon="check" /> {{ $t('for') }}</span>
              <b-skeleton height="15" width="50"></b-skeleton>
            </div>
            <div class="result is-danger">
              <span class="has-text-danger"><b-icon icon="close" /> {{ $t('against') }}</span>
              <b-skeleton height="15" width="50"></b-skeleton>
            </div>
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
      default: 5
    }
  }
}
</script>
