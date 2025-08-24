// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces

declare global {
	type ImagetoolsPictureImport = {
		img: {
			w: number;
			h: number;
			src: string;
		};
		sources: Record<string, string>;
	};

	type PictureImport = {
		width: number;
		height: number;
		src: string;
		sources: Record<string, string>;
	};

	type ImageMetadataImport = {
		src: string;
		width: number;
		height: number;
		format: string;
		space: string;
		channels: number;
		density: number;
		depth: string;
		hasAlpha: boolean;
		hasProfile: boolean;
		isProgressive: boolean;
	};

	module '*&string' {
		const value: string;
		export default value;
	}

	module '*&meta' {
		const value: ImageMetadataImport;
		export default value;
	}

	module '*&picture' {
		const value: PictureImport;
		export default value;
	}

	type Public<T> = {
		[K in keyof T]: T[K];
	};

	namespace App {
		interface Error {
			path?: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
