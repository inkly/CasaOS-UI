// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import AppSection from '@/components/Apps/AppSection.vue'

// The section pulls in the app panel, which imports lottie-web: it paints into a
// canvas the moment it is imported and happy-dom has no 2d context, so the import
// itself throws. Nothing here renders a template.
vi.mock('lottie-web-vue', () => ({ default: { name: 'lottie-animation', template: '<div/>' } }))

// The grid, not the card, is what has to be read again after an update: the app that
// was updated is a different app now. Only app:updated says an update applied -- a
// compose update carries no image information at all, and docker:image:updated says
// what a pull found rather than what ended up installed.
describe('app section update outcome', () => {
	function section() {
		const open = vi.fn()
		const vm = {
			$buefy: { toast: { open } },
			$t: (key, params) => key.replace('{name}', params.name),
			addIdToSessionStorage: vi.fn(),
			getList: vi.fn(() => Promise.resolve()),
			scrollToNewApp: vi.fn(),
		}
		return { vm, open }
	}

	const fire = (vm, Properties) =>
		AppSection.sockets['app:update-end'].call(vm, { Properties })

	it('reloads the grid and says so once an update applied', async () => {
		const { vm, open } = section()

		fire(vm, { 'app:name': 'syncthing', 'app:updated': 'true' })
		await Promise.resolve()

		expect(vm.getList).toHaveBeenCalledTimes(1)
		expect(open).toHaveBeenCalledTimes(1)
		expect(open.mock.calls[0][0].message).toBe('syncthing has been updated to the latest version!')
		expect(vm.addIdToSessionStorage).toHaveBeenCalledWith('syncthing')
	})

	it('claims nothing on an update-end that does not say it applied', () => {
		// published on failure too, and a pull that found something newer is not a
		// recreate that survived it
		const { vm, open } = section()

		fire(vm, { 'app:name': 'syncthing' })
		fire(vm, { 'app:name': 'syncthing', 'docker:image:updated': 'true' })

		expect(vm.getList).not.toHaveBeenCalled()
		expect(open).not.toHaveBeenCalled()
	})
})
