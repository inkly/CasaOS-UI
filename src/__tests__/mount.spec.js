// @vitest-environment happy-dom
import Vue from 'vue'
import Buefy from 'buefy'
import VAnimateCss from 'v-animate-css'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import { shallowMount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import createEventBus from '@/events/eventBus'

/**
 * Smoke tests: every component below must mount without throwing and without
 * emitting a single Vue warning. They deliberately assert nothing about markup
 * or behaviour, so that the Vue 3 / Buefy 3 swap can keep them unchanged and
 * still get a loud failure the moment a component stops booting.
 */

// The locale table is assembled with webpack's `require.context`, which Vite has
// no equivalent for. $t is mocked below, so an empty table changes nothing here.
vi.mock('@/assets/lang', () => ({ default: { en_us: { lang_name: 'English' } } }))

const App = () => import('@/App.vue')
const TopBar = () => import('@/components/TopBar.vue')
const BrandBar = () => import('@/components/BrandBar.vue')
const ContactBar = () => import('@/components/ContactBar.vue')
const SearchBar = () => import('@/components/SearchBar.vue')
const AppCard = () => import('@/components/Apps/AppCard.vue')
const AppSideBar = () => import('@/components/Apps/AppSideBar.vue')
const UpdateModal = () => import('@/components/settings/UpdateModal.vue')
const Ports = () => import('@/components/forms/Ports.vue')
const Login = () => import('@/views/Login.vue')
const Clock = () => import('@/widgets/Clock.vue')
const Network = () => import('@/widgets/Network.vue')
const ListView = () => import('@/components/filebrowser/components/ListView.vue')

// Every $api / $openAPI call returns a promise that never settles: the network
// is not what these tests are about, and a fake payload would only feed each
// component a shape it does not expect.
const apiHandler = {
  get: () => new Proxy(() => {}, apiHandler),
  apply: () => new Promise(() => {}),
}
const $api = new Proxy(() => {}, apiHandler)

const state = {
  isMobile: false,
  sidebarOpen: false,
  siteLoading: false,
  needInitialization: false,
  existingAppsSwitch: true,
  recommendSwitch: true,
  rssSwitch: false,
  searchEngine: 'google',
  searchEngineSwitch: true,
  appLaunchInIframe: false,
  appLaunchExceptions: [],
  hardwareInfo: { cpu: { num: 1, percent: 0 }, mem: { total: 1, used: 0 }, net: [], disk: {} },
  user: { username: 'tester', avatar: '', role: 'admin' },
  currentPath: '/',
  isViewGird: true,
  operateObject: null,
  networkStorage: [],
  shortcutData: [],
  notImportList: [],
  wallpaperObject: { path: '', from: 'Built-in' },
}

const mocks = {
  $t: key => key,
  $tc: key => key,
  $te: () => true,
  $i18n: { locale: 'en_us', t: key => key },
  $api,
  $openAPI: $api,
  $EventBus: createEventBus(),
  $messageBus: Object.assign(() => {}, { on: () => {}, off: () => {}, emit: () => {} }),
  $baseIp: '127.0.0.1',
  $baseURL: '127.0.0.1',
  $protocol: 'http:',
  $wsProtocol: 'ws:',
  $route: { path: '/', name: 'home', params: {}, query: {}, meta: {} },
  $router: { push: () => {}, replace: () => {}, currentRoute: { path: '/' } },
  $store: { state, getters: {}, commit: () => {}, dispatch: () => Promise.resolve() },
}

let problems = []

beforeAll(() => {
  // Mirrors the plugin stack main.js installs, minus the ones that need a live
  // socket; a plugin that stops loading is exactly what should fail here.
  Vue.use(Buefy)
  Vue.use(VueDOMPurifyHTML)
  Vue.use(VAnimateCss)
  Vue.config.warnHandler = msg => problems.push(msg)
})

beforeEach(() => {
  problems = []
})

async function mountOk(load, { mocks: extra = {}, stubs = {}, ...rest } = {}) {
  const { default: Component } = await load()
  const wrapper = shallowMount(Component, {
    mocks: { ...mocks, ...extra },
    stubs: { 'router-view': true, ...stubs },
    ...rest,
  })
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  expect(wrapper.element).toBeTruthy()
  expect(problems).toEqual([])
  wrapper.destroy()
}

describe('component smoke tests', () => {
  it('mounts App', () => mountOk(App))
  it('mounts TopBar', () => mountOk(TopBar, {
    propsData: { initBarData: { lang: 'en_us', search_engine: 'https://duckduckgo.com/?q=', search_switch: true, recommend_switch: true, existing_apps_switch: true, rss_switch: false } },
  }))
  it('mounts BrandBar', () => mountOk(BrandBar))
  it('mounts ContactBar', () => mountOk(ContactBar))
  it('mounts SearchBar', () => mountOk(SearchBar))
  it('mounts AppCard', () => mountOk(AppCard, {
    propsData: { item: { id: '1', name: 'Test', title: { en_us: 'Test' }, icon: '', status: 'running', app_type: 'system', index: '', port_map: '', host: '', protocol: 'http' } },
    provide: { homeShowFiles: () => {}, openAppStore: () => {} },
  }))
  // Open, with slot content: closed and empty it renders one hidden div and
  // the test would only prove the SFC parsed.
  it('mounts AppSideBar', () => mountOk(AppSideBar, {
    propsData: { open: true },
    slots: { default: '<p>panel</p>' },
  }))
  it('mounts UpdateModal', () => mountOk(UpdateModal, { propsData: { changeLog: '# hi' } }))
  it('mounts Ports', () => mountOk(Ports, { propsData: { vData: [], showHostPost: true } }))
  it('mounts Login', () => mountOk(Login))
  it('mounts Clock', () => mountOk(Clock))
  it('mounts Network', () => mountOk(Network))
  it('mounts ListView', () => mountOk(ListView, { propsData: { listData: [] }, attachTo: document.body }))
})
