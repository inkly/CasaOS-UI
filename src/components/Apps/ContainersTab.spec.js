// @vitest-environment happy-dom
import Buefy from 'buefy'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ContainersTab from './ContainersTab.vue'
import i18n from '@/plugins/i18n'

// require.context has no Vite equivalent; an empty table makes $t return its key.
vi.mock('@/assets/lang', () => ({ default: { en_us: {} } }))

const DATA = {
	main: 'jellyfin',
	containers: {
		jellyfin: {
			ID: 'j1',
			Image: 'jellyfin/jellyfin:10.9',
			State: 'running',
			Status: 'Up 2 minutes (healthy)',
			Health: 'healthy',
			ExitCode: 0,
			Publishers: [{ URL: '0.0.0.0', TargetPort: 8096, PublishedPort: 8096, Protocol: 'tcp' }],
		},
		backup: {
			ID: 'b1',
			Image: 'alpine',
			State: 'exited',
			Status: 'Exited (137) 5 minutes ago',
			Health: '',
			ExitCode: 137,
			Publishers: [],
		},
	},
}

async function setup(response = { data: { data: DATA } }) {
	const composeAppContainers = vi.fn().mockResolvedValue(response)
	const wrapper = mount(ContainersTab, {
		props: { appId: 'jellyfin' },
		global: {
			plugins: [Buefy, i18n],
			mocks: { $openAPI: { appManagement: { compose: { composeAppContainers } } } },
		},
	})
	await flushPromises()
	return { wrapper, composeAppContainers }
}

describe('containersTab', () => {
	it('shows one row per service, the main one first, with its state and ports', async () => {
		const { wrapper, composeAppContainers } = await setup()
		expect(composeAppContainers).toHaveBeenCalledWith('jellyfin')

		const rows = wrapper.findAll('tbody tr')
		expect(rows).toHaveLength(2)
		expect(rows[0].text()).toContain('jellyfin')
		expect(rows[0].text()).toContain('Running')
		expect(rows[0].text()).toContain('8096 -> 8096/tcp')
		expect(rows[0].text()).toContain('2 minutes')
		expect(rows[1].text()).toContain('Stopped')
		expect(rows[1].text()).toContain('137')
		wrapper.unmount()
	})

	it('asks for the logs of the row that was clicked, and for its terminal', async () => {
		const { wrapper } = await setup()
		const buttons = wrapper.findAll('tbody tr')[0].findAll('button')

		await buttons[0].trigger('click')
		await buttons[1].trigger('click')
		expect(wrapper.emitted('open')).toEqual([
			[{ service: 'jellyfin', tab: 'logs' }],
			[{ service: 'jellyfin', tab: 'terminal' }],
		])
		wrapper.unmount()
	})

	it('offers no terminal on a service that is not running', async () => {
		const { wrapper } = await setup()
		const stopped = wrapper.findAll('tbody tr')[1].findAll('button')

		expect(stopped[0].attributes('disabled')).toBeUndefined()
		expect(stopped[1].attributes('disabled')).toBeDefined()
		wrapper.unmount()
	})

	it('says so when the containers could not be read, instead of showing an empty app', async () => {
		const composeAppContainers = vi.fn().mockRejectedValue({ response: { data: { message: 'compose app `x` not found' } } })
		const wrapper = mount(ContainersTab, {
			props: { appId: 'x' },
			global: {
				plugins: [Buefy, i18n],
				mocks: { $openAPI: { appManagement: { compose: { composeAppContainers } } } },
			},
		})
		await flushPromises()
		expect(wrapper.text()).toContain('compose app `x` not found')
		expect(wrapper.find('table').exists()).toBe(false)
		wrapper.unmount()
	})
})
