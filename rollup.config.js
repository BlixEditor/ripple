import { spawn } from 'child_process';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import sveltePreprocess from 'svelte-preprocess';
import ts from '@rollup/plugin-typescript';
import typescript from 'typescript';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			// server = spawn('npm', ['run', 'start', '--', '--dev'], {
			// 	stdio: ['ignore', 'inherit', 'inherit'],
			// 	shell: true
			// });

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'webview/app.ts',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'dist/bundle.js'
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({ sourceMap: !production }),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte'],
			preferBuiltins: false,
			exportConditions: ['svelte']
		}),

		ts({
			tsconfig: './tsconfig.json',
			sourceMap: !production,
			inlineSources: !production,
			typescript
			// compilerOptions: {
			// 	noUnusedLocals: false
			// }
		}),

		// Important to allow node modules to be imported in .svelte files
		nodePolyfills(),
		commonjs({
			include: 'node_modules/**',
		}),

		serve({
			// open: true, // Open browser automatically
			// verbose: true,
			// contentBase: ['src', 'dist'],

			// host: 'localhost',
			// port: 3000,
		}),

		// Watch the `dist` directory and refresh the
		// browser on changes when not in production
		!production && livereload({
			watch: 'dist'
		}),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

// import ts from "@rollup/plugin-typescript";
// import typescript from 'typescript';

// import commonjs from "@rollup/plugin-commonjs";
// import resolve from "@rollup/plugin-node-resolve";
// import svelte from "rollup-plugin-svelte";
// import serve from "rollup-plugin-serve";
// // import terser from "rollup-plugin-terser";
// import livereload from "rollup-plugin-livereload";
// import sveltePreprocessor from "svelte-preprocess";

// const isDevelopment = process.env.NODE_ENV === "development";

// const plugins = [
// 	svelte({
// 		dev: isDevelopment,
// 		extensions: [".svelte"],
// 		preprocess: sveltePreprocessor(),
// 		emitCss: true,
// 	}),
// 	ts({ typescript }),
// 	commonjs({ include: "node_modules/**", extensions: [".js", ".ts"] }),
// 	resolve(),
// ];
// plugins.push(
// 	serve({
// 		contentBase: "./dist",
// 		open: false,
// 	}),
// 	livereload({ watch: "./dist" })
// );

// export default {
// 	// input: "src/index.ts",
// 	// output: {
// 	// 	file: "dist/index.js",
// 	// 	sourcemap: true,
// 	// 	format: "iife",
// 	// },
// 	input: 'webview/app.ts',
// 	output: {
// 		sourcemap: true,
// 		format: 'iife',
// 		name: 'app',
// 		file: 'dist/bundle.js'
// 	},
// 	plugins,
// };