const process = require('node:process')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
	publicPath: '/',
	lintOnSave: false,
	productionSourceMap: false,
	pluginOptions: {},
	css: {
		loaderOptions: {
			sass: {
				sassOptions: {
					// sass-loader >= 16 defaults to the modern Sass API, which reads
					// `loadPaths`. `includePaths` is the legacy key: it is ignored
					// with no error and no warning.
					loadPaths: ['./node_modules', './src/assets'],
					// Bulma 1 still calls Sass's deprecated global colour builtins, and
					// it is recompiled once per SCSS unit - 83 units x 5 warnings is
					// ~2700 lines of log per build, none of it actionable here. Our own
					// @import deprecations are still reported.
					quietDeps: true,
				},
			},
		},
	},

	chainWebpack: (config) => {
		config.module
			.rule('mjs')
			.test(/\.mjs$/)
			.type('javascript/auto')
			.include.add(/node_modules/)
			.end()
		// The generated app_management client is TypeScript. vue-cli's resolver only
		// knows .js/.vue and its babel rule only tests .m?jsx?. Widening that rule
		// rather than adding one keeps babel-loader's already-resolved path, which a
		// bare 'babel-loader' cannot find under pnpm. @babel/preset-typescript is
		// already in babel.config.js.
		config.resolve.extensions.prepend('.ts')
		config.module.rule('js').test(/\.m?[jt]sx?$/)

		const oneOfsMap = config.module.rule('scss').oneOfs.store
		oneOfsMap.forEach((item) => {
			item.use('style-resources-loader')
				.loader('style-resources-loader')
				.options({
					// _color.scss is 44 lines of CSS RULES, not variables. Prepended, it
					// made every following @use a hard error, and it duplicated those
					// rules into ~95 chunks. It is still imported once from app.scss.
					patterns: ['./src/assets/scss/common/_variables.scss'],
				})
				.end()
		})
		config.plugin('ignore').use(
			new webpack.IgnorePlugin({
				resourceRegExp: /^\.\/locale$/, // 这是一个示例，忽略所有 locale 文件
				contextRegExp: /moment$/, // 这是一个示例，只在 moment 库中忽略
			}),
		)

		// 添加 NodePolyfillPlugin wbepack5 专用插件
		config.plugin('node-polyfill').use(NodePolyfillPlugin)

		// Production only
		if (isProd) {
			config.output.filename('[name].[contenthash:8].js').end()
			config.output.chunkFilename('[name].[contenthash:8].js').end()
			config.optimization.minimize(true)
			config.optimization.splitChunks({
				chunks: 'all',
			})

			config.optimization
				.minimizer('css')
				.use(require('css-minimizer-webpack-plugin'), [
					{ minimizerOptions: { preset: ['default', { discardComments: { removeAll: true } }] } },
				])
		}
	},
	devServer: {
		open: true,
		port: 8080,
		hot: true,
		proxy: {
			'/v1': {
				target: `http://${process.env.VUE_APP_DEV_IP}:${process.env.VUE_APP_DEV_PORT}`,
				changeOrigin: true,
			},
			'/v2': {
				target: `http://${process.env.VUE_APP_DEV_IP}:${process.env.VUE_APP_DEV_PORT}`,
				changeOrigin: true,
			},
		},
	},
}
