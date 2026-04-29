import type { UserConfigExport } from "@tarojs/cli"

export default {
  
  mini: {},
  h5: {
    devServer: {
      open: false
    }
  }
} satisfies UserConfigExport<'vite'>
