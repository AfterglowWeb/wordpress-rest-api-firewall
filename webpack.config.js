const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const BundleAnalyzerPlugin =
	require( 'webpack-bundle-analyzer' ).BundleAnalyzerPlugin;

module.exports = {
	...defaultConfig,
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/](react|react-dom|@wordpress)[\\/]/,
					name: 'vendor',
					chunks: 'all',
					priority: 10,
				},
				mui: {
					test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
					name: 'mui',
					chunks: 'all',
					priority: 20,
				},
			},
		},
	},
	plugins: [ ...defaultConfig.plugins, new BundleAnalyzerPlugin() ],
};
