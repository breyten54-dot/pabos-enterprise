const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

/**
 * Custom NestJS webpack configuration.
 *
 * Goals:
 * 1. Stop webpack/watchpack from trying to watch Windows root system files
 *    (e.g. C:\pagefile.sys) when the watcher re-initialises after a crash or
 *    during the NestJS restart loop. These files cannot be lstat'd by the
 *    Node process and produce noisy Watchpack errors.
 * 2. Give the forked TypeScript checker more memory so long type-check runs
 *    don't abort with "Issues checking service aborted - probably out of memory".
 */
module.exports = function (defaultOptions) {
  return {
    ...defaultOptions,
    watchOptions: {
      ignored: /(^|[\\/])(node_modules|\.git|dist|\.postgres|prisma)([\\/]|$)|(^|[\\/])(pagefile\.sys|swapfile\.sys|hiberfil\.sys)$/,
    },
    plugins: defaultOptions.plugins.map((plugin) => {
      if (
        plugin.constructor &&
        plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      ) {
        // Preserve the original tsconfig path and bump the memory limit.
        const tsconfigPath =
          plugin.options?.typescript?.configFile || 'tsconfig.json';
        return new ForkTsCheckerWebpackPlugin({
          typescript: {
            configFile: tsconfigPath,
            memoryLimit: 4096,
          },
        });
      }
      return plugin;
    }),
  };
};
