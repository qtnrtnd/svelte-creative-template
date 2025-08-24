<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import { mergeCls } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { gsap, ScrollTrigger } from '$lib/gsap';
	import { useSuspense } from '$lib/suspense';
	import { optional, type SvelteTransitionFactory } from '$lib/animation';
	import { usePreload } from '$lib/preload';

	let {
		sources,
		sizes,
		pictureEl = $bindable<HTMLPictureElement>(),
		imgEl = $bindable<HTMLImageElement>(),
		decoded = $bindable(),
		decodeDelay = 20,
		class: className,
		style,
		fade,
		out,
		...props
	}: {
		pictureEl?: HTMLElement;
		imgEl?: HTMLImageElement;
		decoded?: boolean;
		decodeDelay?: number;
		fade?: boolean | Pick<gsap.TweenVars, 'delay' | 'duration' | 'ease'>;
		out?: SvelteTransitionFactory;
	} & Partial<PictureImport> & { src: string } & HTMLImgAttributes = $props();

	const { imagePreloaded } = usePreload();
	const { suspended } = useSuspense();

	const opacity = $state({ current: fade ? 0 : 1 });

	const isImageReady = () => imgEl.complete && imgEl.naturalWidth > 0;

	const handleImageLoad = () => {
		imgEl.decode().then(() => {
			decoded = true;

			if (fade && !suspended() && ScrollTrigger.isInViewport(pictureEl)) {
				gsap.to(opacity, {
					current: 1,
					...(fade === true ? {} : fade)
				});
			} else {
				opacity.current = 1;
			}
		});
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
					imgEl.onload = handleImageLoad;
				}
			}, decodeDelay);
		} else {
			imgEl.onload = handleImageLoad;
		}
	});
</script>

<picture
	bind:this={pictureEl}
	class={mergeCls('block', className)}
	style:aspect-ratio={props.width && props.height ? props.width / props.height : null}
	{style}
	out:optional|global={out}
>
	{#each Object.entries(sources ?? []) as [format, srcset]}
		<source type={`image/${format}`} {srcset} {sizes} />
	{/each}
	<img
		bind:this={imgEl}
		class="block w-full"
		loading="lazy"
		decoding="async"
		{...props}
		style:opacity={opacity.current}
	/>
</picture>
