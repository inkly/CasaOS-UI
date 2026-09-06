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

describe('container.getComposeEnv', () => {
	beforeEach(() => adapter.mockClear())

	it('reads the body as text, leaving a numeric-looking file alone', async () => {
		const res = await container.getComposeEnv('jellyfin')
		expect(sent().url).toBe('/v2/app_management/compose/jellyfin/env')
		expect(sent().responseType).toBe('text')
		expect(res.data).toBe('123')
	})
})
