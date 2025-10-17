import type { ShaderNodeObject } from 'three/tsl';
import type {
	Node,
	NodeMaterialParameters,
	TextureNode,
	UniformNode,
	Vector4,
	VarNode
} from 'three/webgpu';

type OmitNodeProps<T> = {
	[K in keyof T as K extends `${string}Node` ? never : K]: T[K];
};

type ExtractNodeProps<T> = {
	[K in keyof T as K extends `${string}Node` ? K : never]: T[K];
};

export type PlaneShaderVars = {
	texture: ShaderNodeObject<TextureNode>;
	bleed: ShaderNodeObject<UniformNode<Vector4>>;
	meshAspect: ShaderNodeObject<UniformNode<number>>;
	textureAspect: ShaderNodeObject<UniformNode<number>>;
	meshMask: ShaderNodeObject<VarNode>;
	textureMask: ShaderNodeObject<VarNode>;
};

export type PlaneShader = (
	uniforms: PlaneShaderVars
) => ExtractNodeProps<NodeMaterialParameters> & {
	uvNode?: Node | null;
};

export type PlaneProps = OmitNodeProps<NodeMaterialParameters> & {
	bleed?: number | { top: number; right: number; bottom: number; left: number };
	shader?: PlaneShader;
};
