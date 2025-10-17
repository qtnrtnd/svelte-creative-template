<script lang="ts">
	import { ScrollTrigger } from '$lib/gsap';
	import { Flowmap } from '$lib/renderer/core/Flowmap';
	import { useTask, useThrelte } from '@threlte/core';
	import { onMount } from 'svelte';
	import { pass, uv } from 'three/tsl';
	import { type WebGPURenderer, PostProcessing, Vector2 } from 'three/webgpu';

	const { scene, renderer, camera, size, renderStage, autoRenderTask } =
		useThrelte<WebGPURenderer>();

	renderStage.removeTask(autoRenderTask);

	const flowmap = new Flowmap();
	const velocity = new Vector2();
	const lastMouse = new Vector2();
	const scenePass = pass(scene, $camera);
	const sceneTexture = scenePass.getTextureNode();
	const postProcessing = new PostProcessing(renderer, sceneTexture);

	let lastTime: number | null = null;
	let velocityNeedsUpdate = false;

	onMount(() => {
		const observer = ScrollTrigger.observe({
			onMove({ x = 0, y = 0 }) {
				flowmap.location.value.set(x / $size.width, 1 - y / $size.height);

				if (lastTime === null) {
					lastTime = performance.now();
					lastMouse.set(x, y);
				}

				const deltaX = x - lastMouse.x;
				const deltaY = y - lastMouse.y;

				lastMouse.set(x, y);

				let time = performance.now();

				let delta = Math.max(1, time - lastTime);
				lastTime = time;

				velocity.x = deltaX / delta;
				velocity.y = deltaY / delta;

				velocityNeedsUpdate = true;
			}
		});

		return () => {
			postProcessing.dispose();
			observer.kill();
		};
	});

	$effect(() => {
		flowmap.aspect.value = $size.width / $size.height;
	});

	useTask(
		() => {
			if (!velocityNeedsUpdate) {
				flowmap.location.value.set(-1, -1);
				velocity.set(0, 0);
			}

			velocityNeedsUpdate = false;
			flowmap.velocity.value.lerp(velocity, velocity.length() ? 0.5 : 0.1);
			flowmap.update();
			postProcessing.render();
		},
		{ stage: renderStage }
	);
</script>
