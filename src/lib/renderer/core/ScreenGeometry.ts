import { BufferGeometry, BufferAttribute } from 'three/webgpu';

export class ScreenGeometry extends BufferGeometry {
	constructor() {
		super();

		const vertices = new Float32Array([-1.0, -1.0, 0.0, 3.0, -1.0, 0.0, -1.0, 3.0, 0.0]);

		const uvs = new Float32Array([0.0, 0.0, 2.0, 0.0, 0.0, 2.0]);

		this.setAttribute('position', new BufferAttribute(vertices, 3));
		this.setAttribute('uv', new BufferAttribute(uvs, 2));

		this.name = 'ScreenGeometry';
	}
}
