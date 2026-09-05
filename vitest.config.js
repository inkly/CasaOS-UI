import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import vue from '@vitejs/plugin-vue'
import {compileTemplate, parse as parseSFC} from '@vue/compiler-sfc'
import {defineConfig} from 'vitest/config'

// The compiler half of the @vue/compat scaffold, matching the vue-loader
// compatConfig in vue.config.js. Every flag off below is a template idiom that
// no longer appears in src/.
const compatConfig = {
	MODE: 2,
	COMPILER_V_ON_NATIVE: false,
	COMPILER_V_BIND_SYNC: false,
	COMPILER_V_SLOT: false,
}

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

// A compat deprecation raised by the template compiler never reaches the test
// worker: the parser prints it with console.warn in *this* process, and the ones
// raised later in the transform go to Rollup's warn channel, which vitest drops.
// Either way mount.spec.js's zero-warning assertion cannot see them, so a
// component can carry .native, .sync or a v-if/v-for pair and still mount green.
// Compile each of our own templates a second time with the same compat options,
// collect both channels, and append them to the module: they then re-fire on
// import, inside that spec's console.warn spy.
const compatCompilerWarnings = {
	name: 'compat-compiler-warnings',
	enforce: 'post',
	transform(code, id) {
		if (!id.endsWith('.vue') || !id.includes('/src/')) return null
		const {descriptor} = parseSFC(readFileSync(id, 'utf8'), {filename: id})
		if (!descriptor.template || descriptor.template.src) return null
		// No `ast` option, so this call re-parses the source and the parse-time
		// deprecations land in `tips` alongside the transform-time ones.
		const {tips} = compileTemplate({
			source: descriptor.template.content,
			filename: id,
			id,
			compilerOptions: {compatConfig}
		})
		if (!tips.length) return null
		// Only the first line of a tip: the rest is a link and a code frame.
		const where = id.slice(id.indexOf('/src/') + 1)
		return tips.reduce(
			(out, tip) => `${out};console.warn(${JSON.stringify(`[Vue warn] ${tip.split(/\r?\n/)[0]} (${where})`)})`,
			code
		)
	}
}

export default defineConfig({
	// compatConfig mirrors the vue-loader option in vue.config.js, so the specs
	// compile the same templates the build does.
	plugins: [vue({template: {compilerOptions: {compatConfig}}}), webpackAssetRequire, compatCompilerWarnings],
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
