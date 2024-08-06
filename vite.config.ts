import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import AutoImport from "unplugin-auto-import/vite";


export default ({}) => {
  return defineConfig({
    plugins: [
      uni(),
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/,
          /\.vue\?vue/, // .vue
        ],
        imports: ["vue", "uni-app"],
        dts: "typings/auto-imports.d.ts",
      }),
    ],
  });
};
