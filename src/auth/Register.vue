<template>
  <div class="row align-items-center h-100 mt-5">
    <div v-if="!displayForm" class="mx-auto">
      <span class="spinner-border " />
    </div>
    <div v-else class="mx-auto card " style="width: 22rem;">
      <b-overlay rounded :show="busy" opacity="0.1">
        <div class="card-body">
          <form @submit.prevent="register">
            <div class="d-flex mb-2">
              <Logo class="mx-auto" />
            </div>
            <b-form-group label="Email">
              <b-form-input v-model="email" name="email" type="text" :state="valid" />
            </b-form-group>
            <b-form-group label="Name">
              <b-form-input v-model="name" name="name" type="text" :state="valid" />
            </b-form-group>
            <b-form-group label="Password">
              <b-form-input v-model="password" name="password" type="password" :state="valid" />
            </b-form-group>
            <b-alert :show="error != null" variant="danger">
              <template v-if="error != null">
                Could not Register. ({{ error.message }})
              </template>
            </b-alert>
            <button class="btn btn-primary btn-block" :disabled="busy" @click="register">
              <span v-show="false" class="spinner-border spinner-border-sm" /> Register
            </button>
          </form>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { config } from '@/shared/config'
  import Logo from '@/app/Logo.vue'

  export default Vue.extend({
    components: {
      Logo,
    },
    data() {
      return {
        name: '',
        email: '',
        password: '',
        busy: false,
        error: null,
        displayForm: true,
      }
    },
    computed: {
      valid(): false | null {
        return this.error == null ? null : false
      },
      config: () => config
    },
    methods: {
      register() {
        this.error = null
        this.busy = true
        this.$auth.registerUser(this.name, this.email, this.password)
          .then(() => {
            alert('Registed successfully')
          })
          .catch(err => {
            this.error = err
          })
          .finally(() => {
            this.busy = false
          })
      }
    }
  })
</script>
