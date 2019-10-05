import json from "rollup-plugin-json";
import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import bundleVisualizer from "rollup-plugin-visualizer";
import bundleSize from "rollup-plugin-bundle-size";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/bundle.js"
  },
  plugins: [
    json(),

    svelte({
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: css => {
        css.write("public/bundle.css");
      }
    }),

    resolve({
      mainFields: ["jsnext", "main"],
      browser: true,
      preferBuiltins: true,
      dedupe: importee =>
        importee === "svelte" || importee.startsWith("svelte/")
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    commonjs(),
    builtins(),
    globals(),

    // Enable live reloading in development mode
    !production && livereload("public"),

    // Minify the production build (npm run build)
    production && terser(),

    // Generate bundle visualization
    production &&
      bundleVisualizer({
        template: "treemap"
      }),

    // Get bundle size
    production && bundleSize()
  ]
};
