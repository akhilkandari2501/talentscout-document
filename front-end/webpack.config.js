const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const path = require('path');

module.exports = {
  mode: "development",
  devtool: "source-map",
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "assets/**/*.*", context: "src/" },
        { from: "*.html", context: "src/html" },
        { from: "*.css", context: "src/css" },
      ],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  entry: {
    interview_page: {
      import: "./src/js/interview_page.js",
    },
    jobreadiness: {
      import: "./src/js/jobreadiness.js",
    },
    evaluation: {
      import: "./src/js/evaluation.js",
    },
    report_card: {
      import:"./src/js/report_card.js",
    },
    dashboard: {
      import:"./src/js/dashboard.js",
    },
    index: {
      import: "./src/js/index.js",
    },

    
  },
  resolve: { fallback: { 'process/browser': require.resolve('process/browser'), } },
  
  module: {
    rules: [
       {
       test: /\.m?js/,
       resolve: {
           fullySpecified: false
       }
      }
 ]},
  output: {
    clean: true,
  },

  devServer: {
    devMiddleware: {
      // HTML files aren't fully modeled in webpack and may refer to on-dsk files
      // So let's make sure these get written out when watching
      writeToDisk: true,
    },
    static: "./dist",
    liveReload: true,
    hot: true,
    open: "/",
    setupMiddlewares: (middlewares, devServer) => {
      // Let's create a fake file to serve up config to be used by the tests
      // At some point we may move all the tests to be Webpack entry points and this could be easier
      // But this makes things straight forward to use from our raw HTML files
      devServer.app.get('/devConfig.json', (_, res) => {
        res.json({cognitoIdentityPoolId});
      });
      return middlewares;
    },
    watchFiles: ["./src/index.html"],
  },
};

    

