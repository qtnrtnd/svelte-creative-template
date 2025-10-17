<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import { mergeCls } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { gsap, ScrollTrigger } from '$lib/gsap';
	import { useSuspense } from '$lib/suspense';
	import { usePreload } from '$lib/preload';

	let {
		sources,
		sizes,
		pictureNode = $bindable<HTMLPictureElement>(),
		imgNode = $bindable<HTMLImageElement>(),
		decoded = $bindable(),
		decodeDelay = 20,
		class: className,
		style,
		fade,
		...props
	}: {
		/** A bindable reference to the `<picture>` node. */
		pictureNode?: HTMLPictureElement;
		/** A bindable reference to the `<img>` node. */
		imgNode?: HTMLImageElement;
		/** A bindable boolean indicating if the image has been decoded. */
		decoded?: boolean;
		/** A delay in milliseconds before attempting to decode a preloaded image. */
		decodeDelay?: number;
		/** If `true` or a GSAP TweenVars object, the image will fade in when loaded. */
		fade?: boolean | Pick<gsap.TweenVars, 'delay' | 'duration' | 'ease'>;
	} & Partial<PictureImport> & { src: string } & HTMLImgAttributes = $props();

	const { imagePreloaded } = usePreload();
	const { suspended } = useSuspense();

	const opacity = $state({ current: fade ? 0 : 1 });

	const isImageReady = () => imgNode.complete && imgNode.naturalWidth > 0;

	const handleImageLoad = async () => {
		await imgNode.decode();

		decoded = true;

		if (fade && !suspended() && ScrollTrigger.isInViewport(pictureNode)) {
			gsap.to(opacity, {
				current: 1,
				...(fade === true ? {} : fade)
			});
		} else {
			opacity.current = 1;
		}
	};

	onMount(() => {
		if (isImageReady()) {
			decoded = true;
			opacity.current = 1;
			return;
		}

		if (imagePreloaded(props.src, sources, sizes)) {
			setTimeout(() => {
				if (isImageReady()) {
					decoded = true;
					opacity.current = 1;
				} else {
					imgNode.onload = handleImageLoad;
				}
			}, decodeDelay);
		} else {
			imgNode.onload = handleImageLoad;
		}
	});
</script>

<picture
	bind:this={pictureNode}
	class={mergeCls('block', className)}
	style:aspect-ratio={props.width && props.height ? props.width / props.height : null}
	{style}
>
	{#each Object.entries(sources ?? []) as [format, srcset]}
		<source type={`image/${format}`} {srcset} {sizes} />
	{/each}
	<img
		bind:this={imgNode}
		class="block h-auto w-full"
		loading="lazy"
		decoding="async"
		{...props}
		style:opacity={opacity.current}
	/>
</picture>
