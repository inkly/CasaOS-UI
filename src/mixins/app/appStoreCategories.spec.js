import { describe, expect, it } from 'vitest'
import { categoryMenu } from './appStoreCategories'

describe('categoryMenu', () => {
	it('drops empty categories and selects the first remaining one', () => {
		const { menu, current } = categoryMenu([
			{ id: 0, name: 'All', count: 3 },
			{ id: 1, name: 'Backup', count: 0 },
			{ id: 2, name: 'Chat', count: 3 },
		])

		expect(menu.map(item => item.name)).toEqual(['All', 'Chat'])
		expect(current.name).toBe('All')
	})

	it('keeps a usable All selection when no category has apps (CasaOS#2537)', () => {
		const { menu, current } = categoryMenu([{ id: 0, name: 'All', font: 'apps', count: 0 }])

		expect(menu).toEqual([])
		expect(current.name).toBe('All')
	})

	it('survives a missing list', () => {
		expect(categoryMenu(undefined).current.name).toBe('All')
	})
})
