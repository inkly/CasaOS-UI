import { api } from './service.js'

const PREFIX = '/v2/app_management'

const backup = {
	// The names of the destinations this box knows. Names only: what a destination
	// needs to be reached stays in rclone's config and is never read back out.
	getDestinations() {
		return api.get(`${PREFIX}/backup/destinations`)
	},

	// `backend` is an rclone backend name -- s3, sftp, ftp -- and `parameters` are
	// that backend's own options, passed through untouched.
	saveDestination(name, backend, parameters) {
		return api.put(`${PREFIX}/backup/destinations/${encodeURIComponent(name)}`, {
			backend,
			parameters,
		})
	},

	// Removes the way in, not the backups already sent there.
	deleteDestination(name) {
		return api.delete(`${PREFIX}/backup/destinations/${encodeURIComponent(name)}`)
	},

	// Asked when somebody configures a destination rather than at 3am by a
	// scheduled job nobody is watching.
	checkDestination(name) {
		return api.post(`${PREFIX}/backup/destinations/${encodeURIComponent(name)}/check`)
	},

	// Returns as soon as the copy has started; it takes as long as it takes.
	// `holdStill` stops the app for the length of the copy -- leaving it running
	// takes a copy that may not restore.
	backupApp(id, destination, holdStill) {
		return api.post(`${PREFIX}/compose/${encodeURIComponent(id)}/backup`, {
			destination,
			hold_still: holdStill,
		})
	},
}

export default backup
