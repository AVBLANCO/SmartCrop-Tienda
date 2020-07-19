import Vue from 'vue'

import {
  getMatchedComponentsInstances,
  promisify,
  globalHandleError
} from './utils'

import NuxtLoading from './components/nuxt-loading.vue'
import NuxtBuildIndicator from './components/nuxt-build-indicator'

import '..\\node_modules\\bulma\\bulma.sass'

import '..\\node_modules\\font-awesome\\css\\font-awesome.css'

import _6f6c098b from '..\\layouts\\default.vue'

const layouts = { "_default": _6f6c098b }

export default {
  head: {"title":"Responsive ecommerce template built with Vue.js and Nuxt.js","meta":[{"charset":"utf-8"},{"name":"viewport","content":"width=device-width, initial-scale=1"},{"hid":"description","name":"description","content":"Responsive ecommerce template built with Vue.js and Nuxt.js"},{"http-equiv":"x-ua-compatible","content":"ie=edge"},{"name":"msapplication-TileColor","content":"#ffffff"},{"name":"msapplication-TileImage","content":"\u002Fms-icon-144x144.png"},{"name":"theme-color","content":"#ffffff"},{"property":"og:type","content":"website"},{"property":"og:url","content":"https:\u002F\u002Fexample.com\u002Fpage.html"},{"property":"og:title","content":"Content Title"},{"property":"og:image","content":"https:\u002F\u002Fexample.com\u002Fimage.jpg"},{"property":"og:description","content":"Description Here"},{"property":"og:site_name","content":"Site Name"},{"property":"og:locale","content":"en_US"},{"property":"twitter:card","content":"summary"},{"property":"twitter:site","content":"@site_account"},{"property":"twitter:creator","content":"@individual_account"},{"property":"twitter:url","content":"https:\u002F\u002Fexample.com\u002Fpage.html"},{"property":"twitter:title","content":"Content Title"},{"property":"twitter:description","content":"Content description less than 200 characters"},{"property":"twitter:image","content":"https:\u002F\u002Fexample.com\u002Fimage.jpg"}],"link":[{"rel":"icon","type":"image\u002Fx-icon","href":"\u002Ffavicon.ico"},{"rel":"icon","type":"image\u002Fpng","sizes":"192x192","href":"\u002Fandroid-icon-192x192.png"},{"rel":"icon","type":"image\u002Fpng","sizes":"96x96","href":"\u002Ffavicon-96x96.png"},{"rel":"icon","type":"image\u002Fpng","sizes":"16x16","href":"\u002Ffavicon-16x16.png"},{"rel":"apple-touch-icon","sizes":"57x57","href":"\u002Fapple-icon-57x57.png"},{"rel":"apple-touch-icon","sizes":"60x60","href":"\u002Fapple-icon-60x60.png"},{"rel":"apple-touch-icon","sizes":"72x72","href":"\u002Fapple-icon-72x72.png"},{"rel":"apple-touch-icon","sizes":"76x76","href":"\u002Fapple-icon-76x76.png"},{"rel":"apple-touch-icon","sizes":"114x114","href":"\u002Fapple-icon-114x114.png"},{"rel":"apple-touch-icon","sizes":"120x120","href":"\u002Fapple-icon-120x120.png"},{"rel":"apple-touch-icon","sizes":"144x144","href":"\u002Fapple-icon-144x144.png"},{"rel":"apple-touch-icon","sizes":"152x152","href":"\u002Fapple-icon-152x152.png"},{"rel":"apple-touch-icon","sizes":"180x180","href":"\u002Fapple-icon-180x180.png"},{"rel":"stylesheet","href":"https:\u002F\u002Ffonts.googleapis.com\u002Fcss?family=Roboto:300,400,500,700|Material+Icons"}],"style":[],"script":[]},

  render (h, props) {
    const loadingEl = h('NuxtLoading', { ref: 'loading' })

    const layoutEl = h(this.layout || 'nuxt')
    const templateEl = h('div', {
      domProps: {
        id: '__layout'
      },
      key: this.layoutName
    }, [layoutEl])

    const transitionEl = h('transition', {
      props: {
        name: 'layout',
        mode: 'out-in'
      },
      on: {
        beforeEnter (el) {
          // Ensure to trigger scroll event after calling scrollBehavior
          window.$nuxt.$nextTick(() => {
            window.$nuxt.$emit('triggerScroll')
          })
        }
      }
    }, [templateEl])

    return h('div', {
      domProps: {
        id: '__nuxt'
      }
    }, [
      loadingEl,
      h(NuxtBuildIndicator),
      transitionEl
    ])
  },

  data: () => ({
    isOnline: true,

    layout: null,
    layoutName: ''
  }),

  beforeCreate () {
    Vue.util.defineReactive(this, 'nuxt', this.$options.nuxt)
  },
  created () {
    // Add this.$nuxt in child instances
    Vue.prototype.$nuxt = this
    // add to window so we can listen when ready
    if (process.client) {
      window.$nuxt = this

      this.refreshOnlineStatus()
      // Setup the listeners
      window.addEventListener('online', this.refreshOnlineStatus)
      window.addEventListener('offline', this.refreshOnlineStatus)
    }
    // Add $nuxt.error()
    this.error = this.nuxt.error
    // Add $nuxt.context
    this.context = this.$options.context
  },

  mounted () {
    this.$loading = this.$refs.loading
  },
  watch: {
    'nuxt.err': 'errorChanged'
  },

  computed: {
    isOffline () {
      return !this.isOnline
    }
  },

  methods: {
    refreshOnlineStatus () {
      if (process.client) {
        if (typeof window.navigator.onLine === 'undefined') {
          // If the browser doesn't support connection status reports
          // assume that we are online because most apps' only react
          // when they now that the connection has been interrupted
          this.isOnline = true
        } else {
          this.isOnline = window.navigator.onLine
        }
      }
    },

    async refresh () {
      const pages = getMatchedComponentsInstances(this.$route)

      if (!pages.length) {
        return
      }
      this.$loading.start()

      const promises = pages.map((page) => {
        const p = []

        if (page.$options.fetch) {
          p.push(promisify(page.$options.fetch, this.context))
        }

        if (page.$options.asyncData) {
          p.push(
            promisify(page.$options.asyncData, this.context)
              .then((newData) => {
                for (const key in newData) {
                  Vue.set(page.$data, key, newData[key])
                }
              })
          )
        }

        return Promise.all(p)
      })
      try {
        await Promise.all(promises)
      } catch (error) {
        this.$loading.fail()
        globalHandleError(error)
        this.error(error)
      }
      this.$loading.finish()
    },

    errorChanged () {
      if (this.nuxt.err && this.$loading) {
        if (this.$loading.fail) {
          this.$loading.fail()
        }
        if (this.$loading.finish) {
          this.$loading.finish()
        }
      }
    },

    setLayout (layout) {
      if(layout && typeof layout !== 'string') {
        throw new Error('[nuxt] Avoid using non-string value as layout property.')
      }

      if (!layout || !layouts['_' + layout]) {
        layout = 'default'
      }
      this.layoutName = layout
      this.layout = layouts['_' + layout]
      return this.layout
    },
    loadLayout (layout) {
      if (!layout || !layouts['_' + layout]) {
        layout = 'default'
      }
      return Promise.resolve(layouts['_' + layout])
    }
  },

  components: {
    NuxtLoading
  }
}
