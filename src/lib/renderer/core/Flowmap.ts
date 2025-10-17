import { useThrelte } from '@threlte/core';
import {
	Mesh,
	Vector2,
	NodeMaterial,
	OrthographicCamera,
	RenderTarget,
	WebGPURenderer
} from 'three/webgpu';
import { float, Fn, min, pow, smoothstep, texture, uniform, uv, vec2, vec3 } from 'three/tsl';
import { ScreenGeometry } from './ScreenGeometry';
import { onDestroy } from 'svelte';

type FlowmapOptions = {
	size?: number;
	falloff?: number;
	alpha?: number;
	dissipation?: number;
};

export class Flowmap {
	private _threlte = useThrelte<WebGPURenderer>();
	private _texture = texture();
	private _location = uniform(new Vector2(-1));
	private _velocity = uniform(new Vector2());
	private _aspect = uniform(float(1));
	private _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
	private _material = new NodeMaterial();
	private _geometry = new ScreenGeometry();
	private _mesh = new Mesh(this._geometry, this._material);
	private _mask: {
		read: RenderTarget;
		write: RenderTarget;
	};
	private _options: Readonly<Required<FlowmapOptions>>;

	constructor(options: FlowmapOptions = {}) {
		this._options = Object.freeze({
			size: 128,
			falloff: 0.3,
			alpha: 1,
			dissipation: 0.98,
			...options
		});
		this._mask = {
			read: new RenderTarget(this._options.size, this._options.size),
			write: new RenderTarget(this._options.size, this._options.size)
		};

		this._init();
	}

	private _init() {
		this._material.colorNode = this._colorNode();
		this._material.depthTest = false;
		this._material.depthWrite = false;

		this._swap();

		onDestroy(() => {
			this._mask.read.dispose();
			this._mask.write.dispose();
			this._geometry.dispose();
			this._material.dispose();
		});
	}

	update() {
		const { renderer } = this._threlte;
		const lastTarget = renderer.getRenderTarget();

		renderer.setRenderTarget(this._mask.write);
		renderer.render(this._mesh, this._camera);
		renderer.setRenderTarget(lastTarget);

		this._swap();
	}

	get texture() {
		return this._texture;
	}

	get location() {
		return this._location;
	}

	get velocity() {
		return this._velocity;
	}

	get aspect() {
		return this._aspect;
	}

	private _swap() {
		const temp = this._mask.read;

		this._mask.read = this._mask.write;
		this._mask.write = temp;
		this._texture.value = this._mask.read.texture;
	}

	private _colorNode = Fn(() => {
		const color = this._texture.mul(this._options.dissipation).toVar();

		const cursor = uv().sub(this._location);
		cursor.x.mulAssign(this._aspect);

		const stamp = vec3(
			this._velocity.mul(vec2(1, -1)),
			float(1).sub(pow(float(1).sub(min(float(1), this._velocity.length())), 3))
		);

		const falloff = smoothstep(float(this._options.falloff * 0.5), float(0), cursor.length()).mul(
			this._options.alpha
		);

		color.rgb.mixAssign(stamp, vec3(falloff));

		return color;
	});
}
