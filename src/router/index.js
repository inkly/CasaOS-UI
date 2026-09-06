/*
 * @LastEditors: zhanghengxin ezreal.zhang@icewhale.org
 * @LastEditTime: 2022/12/1 下午8:21
 * @FilePath: /CasaOS-UI/src/router/index.js
 * @Description:
 *
 * Copyright (c) 2022 by IceWhale, All Rights Reserved.
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import api from '@/service/api'
import store from '@/store'
import route from './route.js'

const routes = route

// `mode: 'hash'` + `base` collapse into the history factory. Keep the argument:
// publicPath is "/", so BASE_URL is "/" and URLs stay /#/login. With no
// argument the base falls back to location.pathname, which differs under a
// test runner where BASE_URL is undefined.
const router = createRouter({
	history: createWebHashHistory(process.env.BASE_URL),
	routes,
})

// The VueRouter.prototype.push catch-monkeypatch that used to live here is
// gone: v4 has no prototype to patch, and it resolves with a NavigationFailure
// instead of rejecting on a duplicate navigation.

const needInit = async () => {
	if (store.state.needInitialization) {
		return true
	}
	try {
		let userStatusRes = await api.users.getUserStatus()
		if (userStatusRes.data.success === 200 && !userStatusRes.data.data.initialized) {
			store.commit('SET_NEED_INITIALIZATION', true)
			store.commit('SET_INIT_KEY', userStatusRes.data.data.key)
			localStorage.removeItem('access_token')
			localStorage.removeItem('refresh_token')
			return true
		} else {
			return false
		}
	} catch (error) {
		console.error(error)
		return false
	}
}

router.beforeEach(async (to, from, next) => {
	const accessToken = localStorage.getItem('access_token')
	const version = localStorage.getItem('version')
	const requireAuth = to.matched.some(record => record.meta.requireAuth)

	// 判断是否需要初始化
	let needInitRes = await needInit()

	if (to.path !== '/welcome') {
		if (needInitRes) {
			next('/welcome')
		} else {
			if (requireAuth && !accessToken) {
				next('/login')
			} else {
				// The `return`s matter: all three of these used to fall through to
				// the unconditional next() below. v4 applies only the first call,
				// so behaviour is unchanged, but it warns `The "next" callback was
				// called more than once` on every login, logout and version-less
				// boot.
				switch (to.path) {
					case '/login':
						if (accessToken) {
							return next('/')
						}
						break

					case '/logout':
						localStorage.removeItem('access_token')
						localStorage.removeItem('refresh_token')
						localStorage.removeItem('wallpaper')
						localStorage.removeItem('user')
						return next('/login')

					default:
						if (version == null) {
							localStorage.removeItem('access_token')
							return next('/login')
						}
						break
				}
				next()
			}
		}
	} else {
		if (needInitRes) {
			next()
		} else {
			next('/login')
		}
	}
})

export default router
