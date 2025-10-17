import { RESIZE_DEBOUNCE } from '$lib/const';
import { onMount } from 'svelte';
import { debounce } from '../utils/functions';
import { useScroller } from '$lib/scroller';
import { onRefresh, onScroll } from '$lib/hooks';

type RectOptions = {
	box?: 'content-box' | 'border-box';
};

export class Rect {
	private _element: () => HTMLElement;
	private _options: Required<RectOptions>;
	private _scroller = useScroller();
	private _isInViewport = $state(false);
	private _staticY = 0;
	private _x = $state(0);
	private _y = $state(0);
	private _width = $state(0);
	private _height = $state(0);

	constructor(element: () => HTMLElement, options?: RectOptions) {
		this._element = element;
		this._options = {
			box: 'content-box',
			...options
		};

		onMount(() => {
			// const resizeObserver = new ResizeObserver(
			// 	debounce(() => {
			// 		this._updateRect();
			// 	}, RESIZE_DEBOUNCE)
			// );

			// resizeObserver.observe(this._element());

			const intersectionObserver = new IntersectionObserver(([{ isIntersecting }]) => {
				this._isInViewport = isIntersecting;
			});

			intersectionObserver.observe(this._element());

			return () => {
				// resizeObserver.disconnect();
				intersectionObserver.disconnect();
			};
		});

		onRefresh(() => {
			this._updateRect();
		});

		onScroll(() => {
			if (this._isInViewport) this._updateY();
		});
	}

	private _getPosition() {
		let x = 0;
		let y = 0;
		let el: HTMLElement | null = this._element();

		while (el) {
			x += el.offsetLeft;
			y += el.offsetTop;
			el = el.offsetParent as HTMLElement | null;
		}

		return { x, y };
	}

	private _updateRect() {
		const { x, y } = this._getPosition();

		this._x = x;
		this._staticY = y;
		this._width = this._element().offsetWidth;
		this._height = this._element().offsetHeight;

		this._updateY();
	}

	private _updateY() {
		this._y = this._staticY - this._scroller.scrollTop();
	}

	get x() {
		return this._x;
	}

	get y() {
		return this._y;
	}

	get width() {
		return this._width;
	}

	get height() {
		return this._height;
	}

	get isInViewport() {
		return this._isInViewport;
	}
}
