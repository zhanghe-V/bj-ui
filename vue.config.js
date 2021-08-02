const path = require('path')
const join = path.join // 拼接路径
const fs = require('fs')

function resolve(dir) {
    return path.resolve(__dirname, dir)
}

function getEntries(path) {
  let files = fs.readdirSync(resolve(path));
  const entries = files.reduce((ret, item) => {
      const itemPath = join(path, item)
      const isDir = fs.statSync(itemPath).isDirectory();
      if (isDir) {
          ret[item] = resolve(join(itemPath, 'index.js'))
      } else {
          const [name] = item.split('.')
          ret[name] = resolve(`${itemPath}`)
      }
      return ret
  }, {})
  return entries
}

// 开发环境配置
const devConfig = {
  devServer:{
    port: 8091, // 固定端口
    hot: true, // 开启热更新
    open: 'Google Chrome' // 固定打开浏览器
  },
  pages: {
    index: {
      entry: 'examples/main.js',
      template: 'public/index.html',
      filename: 'index.html',
    },
  },
  configureWebpack: {
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': resolve('packages'),
        'assets': resolve('examples/assets'),
        'views': resolve('examples/views'),
      }
    },
  },
  chainWebpack: config => {
    config.module
      .rule('js')
      .include
      .add('/packages')
      .end()
  },
}

const buildConfig = {
  //...
  outputDir: 'lib',
  productionSourceMap: false,
  chainWebpack: config => {
    config.module
      .rule('js')
      .include
      .add('/packages')
      .end()
    config.optimization.delete('splitChunks')
    config.plugins.delete('copy')
    config.plugins.delete('html')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
    config.plugins.delete('hmr')
    config.entryPoints.delete('app')
  },
  configureWebpack: {
    entry: { 
      ...getEntries('packages')
    },
    output: {
      filename: '[name]/index.js',
      libraryTarget: 'commonjs2',
    },
  },
  css: {
    sourceMap: true,
    extract: {
        filename: 'style/[name].css' // 在lib文件夹中建立style文件夹中，生成对应的css文件。
    }
  }
}
module.exports = process.env.NODE_ENV === 'development' ? devConfig : buildConfig;
