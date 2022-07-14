<template>
  <div class="proposal">
    <div class="columns">
      <div class="column is-7-tablet is-8-desktop">
        <h1 class="title"><b-skeleton height="24" width="200"></b-skeleton></h1>
        <div class="description">
          <b-skeleton width="60%"></b-skeleton>
          <b-skeleton width="60%"></b-skeleton>
          <b-skeleton width="60%"></b-skeleton>
          <b-skeleton width="60%"></b-skeleton>
          <b-skeleton width="60%"></b-skeleton>
        </div>
        <ProposalCommentsSkeleton />
      </div>
      <div class="column is-5-tablet is-4-desktop">
        <div class="proposal-block">
          <div class="title">{{ $t('castYourVote') }}</div>
          <div class="buttons buttons__halfwidth">
            <b-skeleton height="2.857em"></b-skeleton>
            <b-skeleton height="2.857em"></b-skeleton>
          </div>
          <div><b-skeleton height="21"></b-skeleton></div>
        </div>
        <div class="proposal-block">
          <div class="title">{{ $t('currentResults') }}</div>
          <div class="label">
            <b-skeleton width="26" height="21"></b-skeleton>
            <span class="percent"><b-skeleton width="90" height="21"></b-skeleton></span>
          </div>
          <b-progress :value="0" type="is-primary"></b-progress>
          <div class="label">
            <b-skeleton width="58" height="21"></b-skeleton>
            <span class="percent"><b-skeleton width="90" height="21"></b-skeleton></span>
          </div>
          <b-progress :value="0" type="is-danger"></b-progress>
          <div class="label">
            <b-skeleton width="50" height="21"></b-skeleton>
            <span class="percent"><b-skeleton width="90" height="21"></b-skeleton></span>
          </div>
          <b-progress :value="0" type="is-danger"></b-progress>
        </div>
        <div class="proposal-block">
          <div class="title">{{ $t('information') }}</div>
          <div class="columns is-multiline is-small">
            <div class="column is-full-small">
              <strong>{{ $t('proposalAddress') }}</strong>
              <div class="value">
                <b-skeleton height="21"></b-skeleton>
              </div>
            </div>
            <div class="column is-half-small">
              <strong>{{ $t('id') }}</strong>
              <div class="value">
                <b-skeleton width="20" height="21"></b-skeleton>
              </div>
            </div>
            <div class="column is-half-small">
              <strong>{{ $t('status') }}</strong>
              <div class="value">
                <b-skeleton width="70" height="21"></b-skeleton>
              </div>
            </div>
            <div class="column is-half-small">
              <strong>{{ $t('startDate') }}</strong>
              <div class="value">
                <b-skeleton width="70" height="21"></b-skeleton>
              </div>
            </div>
            <div class="column is-half-small">
              <strong>{{ $t('endDate') }}</strong>
              <div class="value">
                <b-skeleton width="70" height="21"></b-skeleton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProposalCommentsSkeleton from './ProposalCommentsSkeleton.vue'

export default {
  components: {
    ProposalCommentsSkeleton
  }
}
</script>
