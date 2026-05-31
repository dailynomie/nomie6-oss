const sveltePreprocess = require("svelte-preprocess");
module.exports = {
  compilerOptions: {
    compatibility: {
      componentApi: 4
    }
  },
  preprocess: [
    sveltePreprocess({
      postcss: true
    }),
  ],
};