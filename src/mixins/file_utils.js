/**
 * @description: Format size output
 * @param {int} bytes size value
 * @return {String}
 */
export const renderSize = (bytes) => {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']
	if (bytes === 0)
		return '0 Bytes'
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
	if (i === 0)
		return `${bytes} ${sizes[i]}`
	return `${parseFloat((bytes / (1024 ** i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Filter dot-prefixed files and folders unless hidden entries are enabled.
 * @param {Array} files
 * @param {Boolean} showHiddenFiles
 * @return {Array}
 */
export const filterHiddenFiles = (files, showHiddenFiles) => {
	if (showHiddenFiles)
		return files

	return files.filter(file => !file.name.startsWith('.'))
}
