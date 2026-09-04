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
	// compatConfig mirrors the vue-loader option in vue.config.js, so the specs
	// compile the same templates the build does.
	plugins: [vue({template: {compilerOptions: {compatConfig: {MODE: 2}}}}), webpackAssetRequire],
	resolve: {
		alias: [
			// The same @vue/compat scaffold vue.config.js installs for webpack.
			// Exact match, or the prefix would also rewrite vue-router, vuex and
			// vue-i18n to @vue/compat-router and friends.
			{find: /^vue$/, replacement: '@vue/compat/dist/vue.runtime.esm-bundler.js'},
			// Both of these resolve to a CJS build under the "node" condition, which
			// vitest externalises; their require('vue') then bypasses the alias
			// above and a second, non-compat Vue ends up in the process. Absolute
			// paths because neither package exports the dist file by subpath.
			{
				find: /^@vue\/test-utils$/,
				replacement: fileURLToPath(new URL('./node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs', import.meta.url))
			},
			{
				find: /^vee-validate$/,
				replacement: fileURLToPath(new URL('./node_modules/vee-validate/dist/vee-validate.esm.js', import.meta.url))
			},
			{find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url))}
		],
		// vue-cli resolves extensionless imports of .vue files; vite does not.
		extensions: ['.mjs', '.js', '.json', '.vue']
	},
	test: {
		setupFiles: ['./vitest.setup.js'],
		// resolve.alias only reaches what vite processes. Left externalised, these
		// packages require('vue') through Node and get plain Vue 3 - vee-validate 3
		// then does `new Vue()` and every spec touching a form dies on collection.
		server: {deps: {inline: [/@vue\/test-utils/, /vee-validate/, /buefy/, /vue-dompurify-html/, /vue-i18n/]}}
	}
})
