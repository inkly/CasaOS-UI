import {fileURLToPath} from 'node:url'
import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vitest/config'

// Templates and option blocks reach for assets with webpack's require().
// @vitejs/plugin-vue2 rewrote those into imports; @vitejs/plugin-vue leaves
// them as runtime require() calls, which vitest hands to plain Node - and
// '@/assets/...' is a webpack alias Node knows nothing about. Webpack hands
// back a URL string for an image and no test asserts on one, so hand back the
// path. Non-image requires (JSON animation data) are deliberately left alone.
const webpackAssetRequire = {
	name: 'webpack-asset-require',
	enforce: 'post',
	transform(code, id) {
		if (!id.includes('.vue') || !code.includes('require(')) return null
		return code.replace(
			/require\(\s*["'`](@\/assets\/[^"'`]+\.(?:svg|png|jpe?g|gif|webp))["'`]\s*\)/g,
			(_match, assetPath) => JSON.stringify(assetPath)
		)
	}
}

export default defineConfig({
	plugins: [vue(), webpackAssetRequire],
	resolve: {
		alias: [
			// Both of these resolve to a CJS build under the "node" condition, which
			// vitest externalises, so their require('vue') lands on a second copy of
			// Vue - which carries its own reactivity and injection. Absolute paths
			// because neither package exports the dist file by subpath.
			{
				find: /^@vue\/test-utils$/,
				replacement: fileURLToPath(new URL('./node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs', import.meta.url))
			},
			{
				find: /^vee-validate$/,
				replacement: fileURLToPath(new URL('./node_modules/vee-validate/dist/vee-validate.mjs', import.meta.url))
			},
			// Same story: buefy has no `exports` map at all, so `main` wins. A
			// shallow mount never renders a Buefy slot and survives it; a real one
			// dies in renderSlot with `Cannot read properties of null (reading 'ce')`.
			{
				find: /^buefy$/,
				replacement: fileURLToPath(new URL('./node_modules/buefy/dist/buefy.esm.js', import.meta.url))
			},
			{find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url))}
		],
		// vue-cli resolves extensionless imports of .vue files; vite does not.
		extensions: ['.mjs', '.js', '.json', '.vue']
	},
	test: {
		// resolve.alias only reaches what vite processes. Left externalised, these
		// packages require('vue') through Node and get their own copy - a second Vue
		// carries its own reactivity and injection, so no <Field> finds its <Form>.
		server: {deps: {inline: [/@vue\/test-utils/, /vee-validate/, /buefy/, /vue-dompurify-html/, /vue-i18n/]}}
	}
})
