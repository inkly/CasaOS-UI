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
		jellyfin: [{
			ID: 'j1',
			Name: 'media-jellyfin-1',
			Image: 'jellyfin/jellyfin:10.9',
			State: 'running',
			Status: 'Up 2 minutes (healthy)',
			Health: 'healthy',
			ExitCode: 0,
			Publishers: [{ URL: '0.0.0.0', TargetPort: 8096, PublishedPort: 8096, Protocol: 'tcp' }],
		}],
		backup: [{
			ID: 'b1',
			Name: 'media-backup-1',
			Image: 'alpine',
			State: 'exited',
			Status: 'Exited (137) 5 minutes ago',
			Health: '',
			ExitCode: 137,
			Publishers: [],
		}],
		worker: [
			{ ID: 'w1', Name: 'media-worker-1', Image: 'worker:1', State: 'running', Status: 'Up 3 hours', Health: '', ExitCode: 0, Publishers: [] },
			{ ID: 'w2', Name: 'media-worker-2', Image: 'worker:1', State: 'running', Status: 'Up 3 hours', Health: '', ExitCode: 0, Publishers: [] },
		],
		idle: [],
	},
}

async function setup(response = { data: { data: DATA } }, overrides = {}) {
	const composeAppContainers = vi.fn().mockResolvedValue(response)
	const setContainerStatus = overrides.setContainerStatus || vi.fn().mockResolvedValue({})
	const toast = overrides.toast
	const wrapper = mount(ContainersTab, {
		props: { appId: 'jellyfin' },
		global: {
			plugins: [Buefy, i18n],
			mocks: {
				$openAPI: { appManagement: { compose: { composeAppContainers } } },
				$api: { container: { setContainerStatus } },
				...(toast ? { $buefy: { toast: { open: toast } } } : {}),
			},
		},
	})
	await flushPromises()
	return { wrapper, composeAppContainers, setContainerStatus }
}

describe('containersTab', () => {
	it('shows one row per container, the main service first, with its state and ports', async () => {
		const { wrapper, composeAppContainers } = await setup()
		expect(composeAppContainers).toHaveBeenCalledWith('jellyfin')

		const rows = wrapper.findAll('tbody tr')
		// jellyfin, backup, idle, and BOTH workers -- five containers, four services.
		expect(rows).toHaveLength(5)
		expect(rows[0].text()).toContain('jellyfin')
		expect(rows[0].text()).toContain('Running')
		expect(rows[0].text()).toContain('8096 -> 8096/tcp')
		expect(rows[0].text()).toContain('2 minutes')
		expect(rows[1].text()).toContain('Stopped')
		expect(rows[1].text()).toContain('137')
		wrapper.unmount()
	})

	it('names the containers of a scaled service, and only those', async () => {
		const { wrapper } = await setup()
		const rows = wrapper.findAll('tbody tr')

		expect(rows[3].text()).toContain('media-worker-1')
		expect(rows[4].text()).toContain('media-worker-2')
		// The name would be noise on the services that have exactly one container,
		// which is nearly every row.
		expect(rows[0].text()).not.toContain('media-jellyfin-1')
		wrapper.unmount()
	})

	it('shows a service Docker runs nothing for, with nothing to open on it', async () => {
		const { wrapper } = await setup()
		const idle = wrapper.findAll('tbody tr')[2]

		expect(idle.text()).toContain('idle')
		expect(idle.text()).toContain('No container')
		idle.findAll('button').forEach(button => expect(button.attributes('disabled')).toBeDefined())
		wrapper.unmount()
	})

	it('asks for the logs of the container that was clicked, and for its terminal', async () => {
		const { wrapper } = await setup()
		// by name, not by position: the row grew start/stop/restart buttons in front
		// of these two, and an index would have moved with them
		const row = wrapper.findAll('tbody tr')[4]

		await row.find('[data-action="logs"]').trigger('click')
		await row.find('[data-action="terminal"]').trigger('click')
		// The second replica: naming the service alone would have opened the first one.
		expect(wrapper.emitted('open')).toEqual([
			[{ service: 'worker', containerId: 'w2', tab: 'logs' }],
			[{ service: 'worker', containerId: 'w2', tab: 'terminal' }],
		])
		wrapper.unmount()
	})

	it('offers no terminal on a service that is not running', async () => {
		const { wrapper } = await setup()
		const stopped = wrapper.findAll('tbody tr')[1]

		expect(stopped.find('[data-action="logs"]').attributes('disabled')).toBeUndefined()
		expect(stopped.find('[data-action="terminal"]').attributes('disabled')).toBeDefined()
		wrapper.unmount()
	})

	it('acts on one container rather than on the whole stack', async () => {
		const { wrapper, composeAppContainers, setContainerStatus } = await setup()

		await wrapper.findAll('tbody tr')[0].find('[data-action="restart"]').trigger('click')
		await flushPromises()

		// the container's own id, not the service name: a scaled service holds several
		expect(setContainerStatus).toHaveBeenCalledWith('jellyfin', 'j1', 'restart')
		// and the row has to show what happened, so the tab re-reads instead of guessing
		expect(composeAppContainers).toHaveBeenCalledTimes(2)
		wrapper.unmount()
	})

	it('offers stop to a running container and start to a stopped one', async () => {
		const { wrapper } = await setup()
		const rows = wrapper.findAll('tbody tr')

		expect(rows[0].find('[data-action="stop"]').exists()).toBe(true)
		expect(rows[0].find('[data-action="start"]').exists()).toBe(false)
		expect(rows[1].find('[data-action="start"]').exists()).toBe(true)
		expect(rows[1].find('[data-action="stop"]').exists()).toBe(false)
		// a service Docker runs no container for has nothing to act on
		expect(rows[2].find('[data-action="restart"]').exists()).toBe(false)
		wrapper.unmount()
	})

	it('says why an action failed rather than leaving the row unchanged and silent', async () => {
		const toast = vi.fn()
		const setContainerStatus = vi.fn().mockRejectedValue({ response: { data: { message: 'container is being removed' } } })
		const { wrapper } = await setup(undefined, { setContainerStatus, toast })

		await wrapper.findAll('tbody tr')[0].find('[data-action="stop"]').trigger('click')
		await flushPromises()

		expect(toast).toHaveBeenCalledWith(expect.objectContaining({ message: 'container is being removed' }))
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
