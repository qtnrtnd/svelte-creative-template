// Utilities for Three.js TSL (Three Shading Language) node graph helpers
// Object-Fit: Cover UV transformer
// Given:
//  - uv (vec2 0..1)
//  - container aspect (width / height)
//  - media aspect (intrinsic image/video width / height)
// Returns UV scaled & offset so the media covers the container while preserving aspect ratio.
// Areas outside the intrinsic media are cropped (can be masked by user if needed).

import { Fn, float, vec2, type ShaderNodeObject, uv as _uv, step } from 'three/tsl';
import type { Node } from 'three/webgpu';
// PURE: does not touch uniforms or external state.
// Usage: const newUv = objectFitCoverUV({ uv: uv(), meshAspect: float(a), mediaAspect: float(b) });
export const fitCover = Fn(
	({
		uv = _uv(),
		meshAspect,
		textureAspect
	}: {
		uv?: ShaderNodeObject<Node>;
		meshAspect: ShaderNodeObject<Node>; // container width / height
		textureAspect: ShaderNodeObject<Node>; // media width / height
	}) => {
		// True object-fit: cover
		// If content is wider than container -> crop horizontally (visibleWidth < 1, visibleHeight = 1)
		// Else crop vertically (visibleHeight < 1, visibleWidth = 1)
		const uvImmutable = uv.toVar();
		const meshAspectImmutable = meshAspect.toVar(); // container aspect (W/H)
		const textureAspectImmutable = textureAspect.toVar(); // media aspect (W/H)
		const wide = step(meshAspectImmutable, textureAspectImmutable).toVar(); // 1 when media wider or equal
		// visibleWidth = wide ? meshAspectImmutable/textureAspectImmutable : 1
		const visibleWidth = wide
			.mul(meshAspectImmutable.div(textureAspectImmutable).sub(float(1)))
			.add(float(1))
			.toVar();
		// visibleHeight = wide ? 1 : textureAspectImmutable/meshAspectImmutable
		const visibleHeight = wide
			.mul(float(1).sub(textureAspectImmutable.div(meshAspectImmutable)))
			.add(textureAspectImmutable.div(meshAspectImmutable))
			.toVar();
		// center offsets
		const offsetX = float(1).sub(visibleWidth).mul(float(0.5)).toVar();
		const offsetY = float(1).sub(visibleHeight).mul(float(0.5)).toVar();
		const u = uvImmutable.x.mul(visibleWidth).add(offsetX).toVar();
		const v = uvImmutable.y.mul(visibleHeight).add(offsetY).toVar();
		return vec2(u, v);
	}
);

export const fitContain = Fn(
	({
		uv = _uv(),
		meshAspect,
		textureAspect
	}: {
		uv?: ShaderNodeObject<Node>;
		meshAspect: ShaderNodeObject<Node>;
		textureAspect: ShaderNodeObject<Node>;
	}) => {
		const uvImmutable = uv.toVar();
		const meshAspectImmutable = meshAspect.toVar();
		const textureAspectImmutable = textureAspect.toVar();
		const wide = step(meshAspectImmutable, textureAspectImmutable).toVar();
		const one = float(1);
		const half = float(0.5);

		const widthUsageTall = textureAspectImmutable.div(meshAspectImmutable);
		const widthUsageWide = one;
		const widthUsage = wide.mul(widthUsageWide.sub(widthUsageTall)).add(widthUsageTall).toVar();

		const heightUsageWide = meshAspectImmutable.div(textureAspectImmutable);
		const heightUsageTall = one;
		const heightUsage = wide.mul(heightUsageWide.sub(heightUsageTall)).add(heightUsageTall).toVar();

		const offsetX = half.mul(one.sub(widthUsage)).toVar();
		const offsetY = half.mul(one.sub(heightUsage)).toVar();

		const u = uvImmutable.x.sub(offsetX).div(widthUsage).toVar();
		const v = uvImmutable.y.sub(offsetY).div(heightUsage).toVar();

		return vec2(u, v);
	}
);
