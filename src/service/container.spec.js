// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import container from './container.js'
import { instance } from './service.js'

// service.js wires its 401 interceptor to the router and the store; neither
// is exercised here.
vi.mock('@/router', () => ({ default: { replace() {} } }))
vi.mock('@/store', () => ({ default: { commit() {} } }))

// A fake adapter sees the config exactly as XHR would: after transformRequest
// and after the headers are flattened.
const adapter = vi.fn(config => Promise.resolve({ data: '123', status: 200, statusText: 'OK', headers: {}, config }))
instance.defaults.adapter = adapter

const sent = () => adapter.mock.calls[0][0]

describe('container.applyComposeEnv', () => {
	beforeEach(() => adapter.mockClear())

	it('sends an empty string as an empty text/plain body, not as the JSON ""', async () => {
		await container.applyComposeEnv('jellyfin', '', true)
		expect(sent().url).toBe('/v2/app_management/compose/jellyfin/env')
		expect(sent().method).toBe('put')
		expect(sent().data).toBe('')
		expect(sent().headers['Content-Type']).toBe('text/plain')
		expect(sent().params).toEqual({ dry_run: true })
	})

	it('control: under the instance default, an empty string would go out as the JSON ""', async () => {
		await instance.put('/x', '')
		expect(sent().data).toBe('""')
	})

	it('sends the file text verbatim', async () => {
		await container.applyComposeEnv('jellyfin', 'KEY="a b"\n', false)
		expect(sent().data).toBe('KEY="a b"\n')
		expect(sent().params).toEqual({ dry_run: false })
	})
})

describe('container.applyComposeEnv after a token refresh', () => {
	beforeEach(() => adapter.mockClear())

	it('retries with the same text/plain body, not re-encoded as JSON', async () => {
		localStorage.setItem('refresh_token', 'r0')
		adapter
			.mockImplementationOnce(config => Promise.reject(Object.assign(new Error('401'), { config, response: { status: 401, data: '{}', config } })))
			.mockImplementationOnce(config => Promise.resolve({ data: { success: 200, data: { access_token: 'new', refresh_token: 'r1', expires_at: 1 } }, status: 200, statusText: 'OK', headers: {}, config }))
		await container.applyComposeEnv('jellyfin', 'A=1\n', false)
		expect(adapter.mock.calls.map(c => c[0].url)).toEqual(['/v2/app_management/compose/jellyfin/env', '/v1/users/refresh', '/v2/app_management/compose/jellyfin/env'])
		const retry = adapter.mock.calls[2][0]
		expect(retry.data).toBe('A=1\n')
		expect(retry.headers['Content-Type']).toBe('text/plain')
		expect(retry.headers.Authorization).toBe('new')
	})
})

describe('container.getComposeEnv', () => {
	beforeEach(() => adapter.mockClear())

	it('hands the caller the server message of a failed GET', async () => {
		adapter.mockImplementationOnce(config => Promise.reject(Object.assign(new Error('500'), { config, response: { status: 500, data: '{"message":"cannot parse .env"}', config } })))
		await expect(container.getComposeEnv('jellyfin')).rejects.toMatchObject({ response: { data: { message: 'cannot parse .env' } } })
	})

	it('reads the body as text, leaving a numeric-looking file alone', async () => {
		const res = await container.getComposeEnv('jellyfin')
		expect(sent().url).toBe('/v2/app_management/compose/jellyfin/env')
		expect(sent().responseType).toBe('text')
		expect(res.data).toBe('123')
	})
})
