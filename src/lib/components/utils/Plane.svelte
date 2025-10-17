<script lang="ts">
	import { T, useThrelte, useLoader } from '@threlte/core';
	import { Rect } from '$lib/helpers';
	import {
		Mesh,
		Node,
		NodeMaterial,
		SRGBColorSpace,
		Texture,
		TextureLoader,
		TextureNode,
		UniformNode,
		type NodeMaterialParameters
	} from 'three/webgpu';
	import {
		vec4,
		texture,
		Fn,
		uniform,
		type ShaderNodeObject,
		float,
		uv,
		vec2,
		step,
		Var
	} from 'three/tsl';
	import type { PlaneProps, PlaneShaderVars } from '$lib/renderer';

	let {
		mesh = $bindable(),
		node,
		src,
		bleed: _bleed,
		shader,
		...props
	}: {
		mesh?: Mesh;
		node: HTMLElement;
		src?: string;
	} & PlaneProps = $props();

	const { size, invalidate } = useThrelte();
	const { load } = useLoader(TextureLoader);

	const rect = new Rect(() => node);
	const uniforms: PlaneShaderVars = {
		texture: texture(),
		bleed: uniform(vec4(0, 0, 1, 1)),
		meshAspect: uniform(float()),
		textureAspect: uniform(float()),
		meshMask: Var(float(1)),
		textureMask: Var(float(1))
	};
	const bleed = $derived(
		typeof _bleed === 'number'
			? Object.fromEntries(['top', 'right', 'bottom', 'left'].map((k) => [k, _bleed]))
			: (_bleed ?? { top: 0, right: 0, bottom: 0, left: 0 })
	);
	const x = $derived(rect.x - bleed.left);
	const y = $derived(rect.y - bleed.top);
	const width = $derived(rect.width + bleed.left + bleed.right);
	const height = $derived(rect.height + bleed.top + bleed.bottom);
	// const intrinsicWidth = $derived(rect.width);
	// const intrinsicHeight = $derived(rect.height);
	const nodes = $derived(shader ? shader(uniforms) : {});

	const colorNode = Fn(() => {
		const geometryUv = Var(uv());
		const p = uniforms.bleed;
		const innerUv = vec2(geometryUv.x.sub(p.x).mul(p.z), geometryUv.y.sub(p.y).mul(p.w));
		const sampleBaseUv = Var(nodes.uvNode ?? geometryUv);
		const mappedUv = vec2(sampleBaseUv.x.sub(p.x).mul(p.z), sampleBaseUv.y.sub(p.y).mul(p.w));
		const innerInsideX = step(float(0), innerUv.x).mul(step(innerUv.x, float(1)));
		const innerInsideY = step(float(0), innerUv.y).mul(step(innerUv.y, float(1)));
		const sampleInsideX = step(float(0), sampleBaseUv.x).mul(step(sampleBaseUv.x, float(1)));
		const sampleInsideY = step(float(0), sampleBaseUv.y).mul(step(sampleBaseUv.y, float(1)));
		const mappedInsideX = step(float(0), mappedUv.x).mul(step(mappedUv.x, float(1)));
		const mappedInsideY = step(float(0), mappedUv.y).mul(step(mappedUv.y, float(1)));
		const meshMask = innerInsideX.mul(innerInsideY);
		const textureMask = meshMask
			.mul(sampleInsideX)
			.mul(sampleInsideY)
			.mul(mappedInsideX)
			.mul(mappedInsideY);

		uniforms.meshMask.assign(meshMask);
		uniforms.textureMask.assign(textureMask);

		uniforms.texture.uvNode = mappedUv;

		return nodes.colorNode ?? uniforms.texture;
	});

	$effect(() => {
		if (src) {
			load(src, {
				transform(texture) {
					texture.colorSpace = SRGBColorSpace;
					return texture;
				}
			}).then((texture) => {
				// destroy only if aspect changes
				// uniforms.texture.value.dispose();
				uniforms.texture.value = texture;
				uniforms.textureAspect.value = texture.image.width / texture.image.height;
				invalidate();
			});
		}
	});

	// Update UV params whenever rect / bleed derived values change
	$effect(() => {
		const outerW = width;
		const outerH = height;
		const innerW = rect.width;
		const innerH = rect.height;

		if (innerW > 0 && innerH > 0 && outerW > 0 && outerH > 0) {
			const offsetU = bleed.left / outerW;
			const offsetV = bleed.bottom / outerH; // v=0 bottom
			const scaleU = outerW / innerW;
			const scaleV = outerH / innerH;

			uniforms.bleed.value.set(offsetU, offsetV, scaleU, scaleV);
		}

		if (innerW > 0 && innerH > 0) {
			uniforms.meshAspect.value = innerW / innerH;
		}
	});
</script>

<T.Mesh
	bind:ref={mesh}
	position={[x - $size.width / 2 + width / 2, -y + $size.height / 2 - height / 2, 0]}
>
	<T.PlaneGeometry args={[width, height, 1, 1]} />
	<T is={NodeMaterial} transparent depthTest={false} colorNode={colorNode()} {...props} />
</T.Mesh>
