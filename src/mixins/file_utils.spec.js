import { describe, expect, it } from 'vitest'
import { filterHiddenFiles, renderSize } from './file_utils'

describe('renderSize', () => {
	it.each([
		[0, '0 Bytes'],
		[10, '10 Bytes'],
		[1024, '1 KB'],
		[1800, '1.76 KB'],
		[1024 ** 2, '1 MB'],
		[1024 ** 3, '1 GB'],
		[2.5 * 1024 ** 3, '2.5 GB'],
		[1024 ** 4, '1 TB'],
		[1024 ** 5, '1 PB'],
		[2 * 1024 ** 5, '2 PB'],
		[1024 ** 6, '1 EB'],
	])('format %s bytes as %s', (bytes, formattedSize) => {
		expect(renderSize(bytes)).toEqual(formattedSize)
	})
})

describe('filterHiddenFiles', () => {
	const files = [
		{ name: 'visible-file.txt' },
		{ name: '.hidden-file' },
		{ name: '.hidden-folder' },
		{ name: 'file.with-dot.txt' },
	]

	it('filters dot-prefixed files and folders when disabled', () => {
		expect(filterHiddenFiles(files, false)).toEqual([
			{ name: 'visible-file.txt' },
			{ name: 'file.with-dot.txt' },
		])
	})

	it('keeps dot-prefixed files and folders when enabled', () => {
		expect(filterHiddenFiles(files, true)).toBe(files)
	})
})
