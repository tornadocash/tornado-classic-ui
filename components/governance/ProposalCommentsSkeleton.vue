<template>
  <div>
    <div v-for="index in size" :key="index" class="proposals-box">
      <div class="columns is-gapless">
        <div class="column">
          <div class="proposals-box--title">
            <div class="proposals-box--skeleton">
              <b-skeleton height="30" width="110" />
            </div>
            <div class="proposals-box--skeleton">
              <b-skeleton height="30" width="110" />
            </div>

            <div class="proposals-box--skeleton is-percentage">
              <b-skeleton height="30" width="36" />
            </div>
          </div>
          <div class="proposals-box--comment">
            <div class="proposals-box--skeleton">
              <b-skeleton height="21" width="21" />
            </div>
            <div class="proposals-box--skeleton">
              <b-skeleton height="21" width="260" />
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
      default: 3
    }
  }
}
</script>

<style lang="scss" scoped>
$margin: 0.714rem;

.proposals-box {
  &--title {
    width: 100%;
    margin: 0;
    display: inline-block;
  }

  &--skeleton {
    display: inline-block;

    &.is-percentage {
      float: right;
    }
  }

  &--comment {
    margin-top: 1.5rem;
  }
}
</style>
