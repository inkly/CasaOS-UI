import { describe, expect, it } from 'vitest'
import { BACKUP_BACKENDS, parametersFrom, suggestedFields } from './backupBackends'

describe('suggested fields', () => {
	it('names rclone\'s own options, which is the point of showing them', () => {
		// access_key_id rather than aws_access_key_id is the difference between a
		// destination that works and an afternoon
		expect(suggestedFields('s3').map(row => row.key)).toContain('access_key_id')
		expect(suggestedFields('sftp').map(row => row.key)).toContain('host')
	})

	it('leaves every value blank', () => {
		for (const row of suggestedFields('s3'))
			expect(row.value).toBe('')
	})

	it('still offers a row for a backend nobody here has heard of', () => {
		// rclone has seventy backends and gains them between releases; a closed list
		// would stop someone configuring one this file does not know
		expect(suggestedFields('swift')).toEqual([{ key: '', value: '' }])
		expect(suggestedFields('')).toHaveLength(1)
	})

	it('says plainly that FTP is not encrypted', () => {
		const ftp = BACKUP_BACKENDS.find(backend => backend.id === 'ftp')
		expect(ftp.label.toLowerCase()).toContain('unencrypted')
	})
})

describe('what gets sent as parameters', () => {
	it('keeps the rows that were filled in', () => {
		expect(parametersFrom([
			{ key: 'host', value: 'nas.local' },
			{ key: 'user', value: 'gary' },
		])).toEqual({ host: 'nas.local', user: 'gary' })
	})

	it('drops a suggestion nobody filled in', () => {
		// rclone treats an empty value as a value, and an empty endpoint is not the
		// same as no endpoint
		expect(parametersFrom([
			{ key: 'host', value: 'nas.local' },
			{ key: 'endpoint', value: '' },
			{ key: '', value: 'orphan' },
		])).toEqual({ host: 'nas.local' })
	})

	it('trims a key somebody typed with a stray space', () => {
		expect(parametersFrom([{ key: '  host  ', value: 'nas.local' }])).toEqual({ host: 'nas.local' })
	})

	it('survives nothing at all', () => {
		expect(parametersFrom(null)).toEqual({})
		expect(parametersFrom([])).toEqual({})
	})
})
