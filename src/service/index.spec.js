import { beforeEach, describe, expect, it, vi } from 'vitest'

// The generated client reads `axios.defaults.baseURL` and calls `axios.request`;
// nothing else. Stubbing the shared instance keeps the real index.js under test.
const sent = []
vi.mock('@/service/service', () => ({
	instance: {
		defaults: {},
		request: (config) => {
			sent.push(config)
			return Promise.resolve({ data: {} })
		},
	},
}))

const openAPI = (await import('@/service/index.js')).default

// Every operation the dashboard calls, with the method and URL the published
// @icewhale/casaos-appmanagement-openapi 0.4.17-alpha1 produced for it. The
// client is now generated from our own AppManagement spec: this is the wire
// contract the 41 call sites depend on.
const CALLS = [
	[() => openAPI.appManagement.appStore.appStoreList(), 'GET', '/v2/app_management/appstore'],
	[() => openAPI.appManagement.appStore.categoryList(), 'GET', '/v2/app_management/categories'],
	[() => openAPI.appManagement.appStore.composeApp('id 1'), 'GET', '/v2/app_management/apps/id%201/compose'],
	[() => openAPI.appManagement.appStore.composeAppStoreInfo('a'), 'GET', '/v2/app_management/apps/a'],
	[() => openAPI.appManagement.appStore.composeAppStoreInfoList(), 'GET', '/v2/app_management/apps'],
	[() => openAPI.appManagement.appStore.composeAppServiceStableTag('a', 'b'), 'GET', '/v2/app_management/apps/a/stable/b'],
	[() => openAPI.appManagement.appStore.registerAppStore('http://s/x.zip'), 'POST', '/v2/app_management/appstore?url=http%3A%2F%2Fs%2Fx.zip'],
	[() => openAPI.appManagement.appStore.unregisterAppStore('7'), 'DELETE', '/v2/app_management/appstore/7'],
	[() => openAPI.appManagement.compose.applyComposeAppSettings('a', 'yaml', true), 'PUT', '/v2/app_management/compose/a?dry_run=true'],
	[() => openAPI.appManagement.compose.checkComposeAppHealthByID('a'), 'GET', '/v2/app_management/compose/a/healthcheck'],
	[() => openAPI.appManagement.compose.composeAppContainers('a'), 'GET', '/v2/app_management/compose/a/containers'],
	[() => openAPI.appManagement.compose.composeAppLogs('a', 100), 'GET', '/v2/app_management/compose/a/logs?lines=100'],
	[() => openAPI.appManagement.compose.installComposeApp('yaml'), 'POST', '/v2/app_management/compose'],
	[() => openAPI.appManagement.compose.myComposeApp('a'), 'GET', '/v2/app_management/compose/a'],
	[() => openAPI.appManagement.compose.myComposeAppList(), 'GET', '/v2/app_management/compose'],
	[() => openAPI.appManagement.compose.setComposeAppStatus('a', 'start'), 'PUT', '/v2/app_management/compose/a/status'],
	[() => openAPI.appManagement.compose.uninstallComposeApp('a', true), 'DELETE', '/v2/app_management/compose/a?delete_config_folder=true'],
	[() => openAPI.appManagement.compose.updateComposeApp('a'), 'PATCH', '/v2/app_management/compose/a'],
	[() => openAPI.appManagement.app.checkImageUpdates(), 'POST', '/v2/app_management/image-updates'],
	[() => openAPI.appGrid.getAppGrid(), 'GET', '/v2/app_management/web/appgrid'],
	[() => openAPI.appCompose.setComposeAppStatus('a', 'stop'), 'PUT', '/v2/app_management/compose/a/status'],
]

describe('app_management openapi client', () => {
	beforeEach(() => {
		sent.length = 0
	})

	it.each(CALLS)('%# hits the same endpoint as the published SDK did', async (call, method, url) => {
		await call()
		expect(sent).toHaveLength(1)
		expect(sent[0].method).toBe(method)
		expect(sent[0].url).toBe(url)
	})

	it('sends the compose body as YAML and the status body as JSON', async () => {
		await openAPI.appManagement.compose.applyComposeAppSettings('a', 'services: {}')
		expect(sent[0].headers['Content-Type']).toBe('application/yaml')
		sent.length = 0
		await openAPI.appManagement.compose.setComposeAppStatus('a', 'start')
		expect(sent[0].headers['Content-Type']).toBe('application/json')
		// serializeDataIfNeeded passes a string through untouched, JSON mime or not.
		expect(sent[0].data).toBe('start')
	})
})
