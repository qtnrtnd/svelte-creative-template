import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { imagetools, pictureFormat } from 'vite-imagetools';
import unplugin from 'unplugin-preprocessor-directives/vite';

export default defineConfig({
	build: {
		assetsInlineLimit: 0
	},
	plugins: [
		unplugin(),
		imagetools({
			extendOutputFormats(builtins) {
				return {
					...builtins,
					picture() {
						return async (metadatas): Promise<PictureImport> => {
							const picture = pictureFormat()(metadatas) as ImagetoolsPictureImport;
							return {
								width: picture.img.w,
								height: picture.img.h,
								src: picture.img.src,
								sources: picture.sources
							};
						};
					}
				};
			}
		}),
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	]
});
