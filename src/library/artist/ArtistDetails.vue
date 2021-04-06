<template>
  <ContentLoader v-slot :loading="item == null">
    <div class="row">
      <div class="col col-xl-8">
        <h1>{{ item.name }}</h1>
        <p>{{ item.description }}</p>
      </div>
    </div>
    <h3 class="pt-5">
      Albums
    </h3>
    <AlbumList :items="item.albums" />

  </ContentLoader>
</template>
<script lang="ts">
  import Vue from 'vue'
  import AlbumList from '@/library/album/AlbumList.vue'
  import ArtistList from '@/library/artist/ArtistList.vue'

  export default Vue.extend({
    components: {
      AlbumList,
      ArtistList,
    },
    props: {
      id: { type: String, required: true }
    },
    data() {
      return {
        item: null as any,
      }
    },
    watch: {
      id: {
        immediate: true,
        async handler(value: string) {
          this.item = null
          this.item = await this.$api.getArtistDetails(value)
        }
      }
    }
  })
</script>
