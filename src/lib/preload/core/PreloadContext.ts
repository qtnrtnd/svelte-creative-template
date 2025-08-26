import { fromClient } from '$lib/helpers';
import { onResize } from '$lib/hooks';
import { onDestroy } from 'svelte';

/**
 * The parameters required to preload an image, including the default `src`,
 * optional responsive `sources`, and `sizes` attributes.
 * @internal
 */
type ImagePreloadParams = [
	src: string,
	sources?: Record<string, string> | null,
	sizes?: string | null
];

/**
 * An internal entry representing a preloaded image, containing its parameters,
 * the `<picture>` element used for preloading, the promise, associated components,
 * and its resolved state.
 * @internal
 */
type PreloadedImageEntry = {
	params: ImagePreloadParams;
	element: HTMLPictureElement;
	promise: Promise<void>;
	components: Set<symbol>;
	resolved: boolean;
};

/**
 * The public interface for a component-specific preload context, allowing components
 * to preload images and check their status.
 */
export type ComponentPreload = Public<PreloadContext> & {
	/**
	 * Initiates the preload of an image.
	 * @param params - The image source, sources, and sizes.
	 * @returns A promise that resolves when the image is loaded and decoded.
	 */
	preloadImage: (...params: ImagePreloadParams) => Promise<void>;
};

/**
 * Manages the preloading of assets, primarily images, to improve performance
 * by loading them before they are needed. It creates a hidden `<picture>` element
 * to trigger the browser's preload mechanism and tracks the loading status.
 */
export class PreloadContext {
	private _preloadedImages = new Map<string, PreloadedImageEntry>();
	private _rootEl = fromClient(() => document.getElementById('root') ?? document.body);

	constructor() {
		onResize(() => {
			this._handleResize();
		});
	}

	/**
	 * Extends the global `PreloadContext` to provide a component-specific interface.
	 * This allows tracking which components are using which preloaded images, so that
	 * resources can be managed efficiently.
	 *
	 * @param context - The global `PreloadContext` instance.
	 * @returns A `ComponentPreload` object with methods scoped to the component.
	 */
	static extend(context: PreloadContext): ComponentPreload {
		const componentId = Symbol();
		const componentQueries = new Set<string>();

		onDestroy(() => {
			for (const query of componentQueries) {
				context._unregisterImage(componentId, query);
			}
		});

		return {
			imagePreloaded: context.imagePreloaded,
			preloadImage(...params) {
				const query = context._getImageQuery(...params);
				componentQueries.add(query);
				return context._registerImage(componentId, params);
			}
		};
	}

	/**
	 * Checks if a specific image has already been preloaded and resolved.
	 *
	 * @param params - The parameters of the image to check.
	 * @returns `true` if the image is preloaded, `false` otherwise.
	 */
	imagePreloaded = (...params: ImagePreloadParams): boolean => {
		const query = this._getImageQuery(...params);
		const entry = this._preloadedImages.get(query);
		return !!entry && entry.resolved;
	};

	/**
	 * Handles window resize events by re-evaluating and potentially re-preloading
	 * images to ensure the correct responsive variant is loaded.
	 * @internal
	 */
	private _handleResize() {
		for (const [query, entry] of this._preloadedImages.entries()) {
			if (entry.components.size > 0) {
				if (this._rootEl.contains(entry.element)) {
					this._rootEl.removeChild(entry.element);
				}

				const { element, promise } = this._createImagePreload(...entry.params);

				entry.element = element;
				entry.promise = promise;
				entry.resolved = false;

				this._attachPromiseHandlers(entry, query);
				this._rootEl.appendChild(element);
			}
		}
	}

	/**
	 * Generates a unique query string for an image based on its sources and sizes.
	 * @internal
	 */
	private _getImageQuery(...[src, sources, sizes]: ImagePreloadParams): string {
		const parts: string[] = [src];

		if (sources) {
			parts.push(...Object.values(sources).sort((a, b) => a.localeCompare(b)));
		}

		if (sizes) {
			parts.push(sizes);
		}

		return parts.join(',');
	}

	/**
	 * Creates the `<picture>` element and the promise for preloading an image.
	 * @internal
	 */
	private _createImagePreload(...[src, sources, sizes]: ImagePreloadParams): {
		element: HTMLPictureElement;
		promise: Promise<void>;
	} {
		const picture = document.createElement('picture');
		picture.classList.add('hidden');
		picture.dataset.preload = 'image';

		const promise = new Promise<void>((resolve, reject) => {
			if (sources) {
				for (const format in sources) {
					const source = document.createElement('source');
					source.type = `image/${format}`;
					source.srcset = sources[format];
					if (sizes) {
						source.sizes = sizes;
					}
					picture.append(source);
				}
			}

			const img = new Image();

			const handleError = (err?: string | Event) => {
				const errorMessage =
					typeof err === 'string' ? err : `Failed to load image: ${img.currentSrc || src}`;
				reject(new Error(errorMessage));
			};

			img.onload = () => {
				img.decode().then(resolve).catch(handleError);
			};

			img.onerror = handleError;
			img.src = src;

			picture.append(img);
		});

		return { element: picture, promise };
	}

	/**
	 * Attaches `then` and `catch` handlers to the preload promise.
	 * @internal
	 */
	private _attachPromiseHandlers(entry: PreloadedImageEntry, query: string) {
		entry.promise
			.then(() => {
				entry.resolved = true;
				if (this._rootEl.contains(entry.element)) {
					this._rootEl.removeChild(entry.element);
				}
			})
			.catch(() => {
				if (this._preloadedImages.get(query) === entry) {
					this._preloadedImages.delete(query);
				}
			});
	}

	/**
	 * Registers an image for preloading, associating it with a component.
	 * @internal
	 */
	private _registerImage(componentId: symbol, params: ImagePreloadParams): Promise<void> {
		const query = this._getImageQuery(...params);
		let entry = this._preloadedImages.get(query);

		if (!entry) {
			const { element, promise } = this._createImagePreload(...params);
			entry = {
				params,
				element,
				promise,
				components: new Set(),
				resolved: false
			};
			this._preloadedImages.set(query, entry);
			this._attachPromiseHandlers(entry, query);
			this._rootEl.appendChild(entry.element);
		}

		entry.components.add(componentId);

		return entry.promise;
	}

	/**
	 * Unregisters an image from a component, cleaning up if no other components are using it.
	 * @internal
	 */
	private _unregisterImage(componentId: symbol, query: string): void {
		const entry = this._preloadedImages.get(query);
		if (!entry) return;

		entry.components.delete(componentId);

		if (entry.components.size === 0 && this._rootEl.contains(entry.element)) {
			this._rootEl.removeChild(entry.element);
		}
	}
}
