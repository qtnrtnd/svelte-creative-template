import { gsap, ScrollTrigger } from '$lib/gsap';
import { extract, fromClient } from '$lib/helpers';
import { onMount, untrack } from 'svelte';
import { resolveDirection, toKeyframe } from '../utils/functions';
import type { SvelteTransitionDirection, SvelteTransitionFunction } from '../utils/types';
import { linear } from 'svelte/easing';

type Attach = (() => Element | undefined) | Element | string;

type TweenTransitionType = 'idle' | 'intro' | 'outro';

export type TweenTransitionDirection = Exclude<SvelteTransitionDirection, 'both'>;

type TweenTransitionBaseParams<UserData extends object = object> = {
	attach?: Attach;
	ignore?: boolean;
	data?: Partial<UserData>;
};

export type TweenTransitionParams<UserData extends object = object> =
	TweenTransitionBaseParams<UserData> & {
		dispatchEvents?: boolean;
		instant?: boolean;
		inViewport?: boolean | number;
		overlapStrategy?: 'abort' | 'invalidate' | 'restart' | 'add';
		overwrite?: boolean;
	};

type TweenTransitionIdleParams<UserData extends object = object> =
	TweenTransitionBaseParams<UserData> & {
		direction?: TweenTransitionDirection;
	};

type TweenTransitionOptions<UserData extends object = object> = {
	idle?: TweenTransitionIdleParams<UserData>;
	intro?: TweenTransitionParams<UserData>;
	outro?: TweenTransitionParams<UserData>;
	bypass?: boolean;
} & TweenTransitionParams<UserData>;

type ResolvedTweenTransitionParams<UserData extends object = object> = Omit<
	Required<TweenTransitionParams<UserData>>,
	'attach'
> & {
	attach: Element | null;
	bypass: boolean;
};

export type TweenTransitionFunctionParams<UserData extends object = object> = {
	last: {
		animation: gsap.core.Animation | null;
		params: ResolvedTweenTransitionParams<UserData> | null;
	};
	direction: TweenTransitionDirection;
	type: TweenTransitionType;
	ratio: number;
	params: ResolvedTweenTransitionParams<UserData>;
};

export type TweenTransitionFunction<UserData extends object = object> = (
	params: TweenTransitionFunctionParams<UserData>
) => gsap.core.Animation | null;

export class TweenTransition<UserData extends object = object> {
	private readonly _transition: TweenTransitionFunction<UserData>;
	private readonly _options: Readonly<TweenTransitionOptions<UserData>>;
	private readonly _lastParams: Record<
		TweenTransitionDirection,
		ResolvedTweenTransitionParams<UserData> | null
	> = {
		in: null,
		out: null
	};

	private _qeuedIdle: TweenTransitionIdleParams<UserData> | null = null;
	private _allowIdle = false;
	private _animation: gsap.core.Animation | null = null;
	private _direction: TweenTransitionDirection | null = $state(null);
	private _ratio = $state(0);
	private _context = fromClient(
		() => gsap.context(() => {}),
		(c) => c.kill()
	);

	constructor(
		transition: TweenTransitionFunction<UserData>,
		options: TweenTransitionOptions<UserData> = {}
	) {
		this._transition = transition;
		this._options = options;

		this._init();
	}

	static validate(
		node: Element,
		direction: SvelteTransitionDirection,
		inViewport?: boolean | number
	): boolean {
		const resolvedDirection = resolveDirection(node, direction);
		const resolvedParams = resolveParams(resolvedDirection, { attach: node, inViewport });
		return !shouldSkipTransition(resolvedDirection, resolvedParams);
	}

	static from<Params extends object>(
		transition: SvelteTransitionFunction<Element, Partial<Params>>,
		options?: TweenTransitionOptions<Params>
	) {
		let lastEasing = linear;

		return new this<Params>(({ direction, ratio, params: { attach, data } }) => {
			if (!attach) {
				return null;
			}

			const reset = gsap.set(attach, {
				clearProps: 'all'
			});

			const {
				delay = 0,
				duration: d = 0,
				easing = linear,
				tick,
				css
			} = transition(attach, data, { direction });
			const keyframes: Record<string, object> = {};
			const start = lastEasing(ratio);
			const duration = d * (1 - start);

			lastEasing = easing;

			if (css) {
				const n = Math.ceil(duration / (1000 / 60));

				for (let i = 0; i <= n; i++) {
					const p = i / n;
					const e = start + (1 - start) * easing(p);
					const t = direction === 'in' ? e : 1 - e;
					const style = css(t, 1 - t);

					keyframes[p * 100 + '%'] = toKeyframe(style);
				}
			}

			reset.revert();

			const tween = gsap.to(attach, {
				delay: delay / 1000,
				duration: duration / 1000,
				ease: 'none',
				keyframes,
				onUpdate:
					tick &&
					(() => {
						const p = start + (1 - start) * easing(tween.progress());
						const t = direction === 'in' ? p : 1 - p;

						tick(t, 1 - t);
					})
			});

			return tween;
		}, options);
	}

	idle = (params: TweenTransitionIdleParams<UserData> = {}): gsap.core.Animation | null => {
		return untrack(() => {
			if (!this._allowIdle) {
				this._qeuedIdle = params;
				return null;
			}

			const { idle = {}, ...options } = this._resolveOptions('idle');
			const direction = params.direction ?? idle.direction ?? 'out';
			const resolvedParams = resolveParams(
				null,
				{ ...params, instant: true, overlapStrategy: 'add' },
				options
			);

			this._context.revert();

			return this._executeTransition(direction, resolvedParams, true);
		});
	};

	intro = (params: TweenTransitionParams<UserData> = {}): gsap.core.Animation | null => {
		return untrack(() => {
			this._handleIdle();

			const options = this._resolveOptions('intro');
			const resolvedParams = resolveParams('in', params, options);

			if (shouldSkipTransition('in', resolvedParams)) {
				return null;
			}

			return this._executeTransition('in', resolvedParams, false);
		});
	};

	outro = (params: TweenTransitionParams<UserData> = {}): gsap.core.Animation | null => {
		return untrack(() => {
			this._handleIdle();

			const options = this._resolveOptions('outro');
			const resolvedParams = resolveParams('out', { inViewport: true, ...params }, options);

			if (shouldSkipTransition('out', resolvedParams)) {
				return null;
			}

			return this._executeTransition('out', resolvedParams, false);
		});
	};

	ratio = (): number => {
		return this._ratio;
	};

	direction = (): TweenTransitionDirection | null => {
		return this._direction;
	};

	get animation(): gsap.core.Animation | null {
		return this._animation;
	}

	get options(): Readonly<TweenTransitionOptions<UserData>> {
		return this._options;
	}

	private _init(): void {
		onMount(() => {
			this._handleIdle();
		});
	}

	private _handleIdle(): void {
		this._allowIdle = true;

		if (!this._qeuedIdle) return;

		this.idle(this._qeuedIdle);

		this._qeuedIdle = null;
	}

	private _resolveOptions(type: TweenTransitionType): TweenTransitionOptions<UserData> {
		return {
			...this._options,
			...this._options[type],
			data: { ...this._options.data, ...(this._options[type] && this._options[type].data) }
		};
	}

	private _executeTransition(
		direction: TweenTransitionDirection,
		params: ResolvedTweenTransitionParams<UserData>,
		idle: boolean
	): gsap.core.Animation | null {
		const { attach, dispatchEvents, instant, ignore, overlapStrategy, overwrite } = params;
		let ratio = 0;
		let resume: number | null = null;

		if (this._animation) {
			const progress = this._animation.progress();

			if (this._direction === direction) {
				if (overlapStrategy === 'abort') return null;

				if (overlapStrategy === 'invalidate') {
					const lastDirection = this._direction === 'in' ? 'out' : 'in';
					const { attach, data } = this._lastParams[lastDirection] ?? {};

					this.idle({
						direction: lastDirection,
						attach: attach ?? undefined,
						ignore: true,
						data
					});

					resume = progress;
				} else if (overlapStrategy === 'add') {
					ratio = progress;
				} else if (overlapStrategy === 'restart') {
					this._animation.revert();
				}
			} else {
				ratio = 1 - progress;
			}

			if (overwrite) {
				this._animation.kill();
			}
		}

		const animation = this._context.add(() => {
			return this._transition({
				last: {
					animation: this._animation,
					params: this._lastParams[direction]
				},
				type: idle ? 'idle' : direction === 'in' ? 'intro' : 'outro',
				direction,
				ratio,
				params
			});
		}, attach ?? undefined);

		const progress = instant ? 1 : resume;

		if (progress !== null && animation) {
			animation.progress(progress);
		}

		if (!ignore) {
			this._lastParams[direction] = params;

			if (attach && direction) {
				this._handlePointerEvents(attach, direction);

				if (dispatchEvents && animation) {
					this._dispatchEvents(attach, direction, animation);
				}
			}

			this._animation = animation;
			this._direction = direction;
			this._ratio = ratio;
		}

		return animation;
	}

	private _handlePointerEvents(attach: Element, direction: TweenTransitionDirection): void {
		gsap.set(
			attach,
			direction === 'out' ? { pointerEvents: 'none' } : { clearProps: 'pointerEvents' }
		);
	}

	private _dispatchEvents(
		attach: Element,
		direction: TweenTransitionDirection,
		animation: gsap.core.Animation
	): void {
		const startEvent = direction === 'in' ? 'introstart' : 'outrostart';
		const endEvent = direction === 'in' ? 'introend' : 'outroend';

		attach.dispatchEvent(new CustomEvent(startEvent));

		animation.then(() => {
			attach.dispatchEvent(new CustomEvent(endEvent));
		});
	}
}

const shouldSkipTransition = (
	direction: TweenTransitionDirection,
	params: ResolvedTweenTransitionParams
): boolean => {
	const { instant, bypass, attach, inViewport } = params;

	return (
		bypass ||
		(direction === 'out' && instant) ||
		(inViewport !== undefined &&
			inViewport !== false &&
			!!attach &&
			!ScrollTrigger.isInViewport(attach, inViewport === true ? 0 : inViewport))
	);
};

const resolveDataFlag = (
	node: Element | null,
	key: string,
	direction: TweenTransitionDirection | null,
	fallback: boolean
): boolean => {
	let value = node && node.getAttribute('data-' + key);

	if (value === null && node) {
		const closest = node.closest(`[data-${key}]`);
		if (closest) value = closest.getAttribute('data-' + key);
	}
	if (value === null) return fallback;
	if (value === 'in') return direction === 'in';
	if (value === 'out') return direction === 'out';

	return value !== 'false';
};

const resolveAttach = (attach?: Attach): Element | null => {
	const selector = extract(attach) ?? null;
	return typeof selector === 'string' ? document.querySelector(selector) : selector;
};

const resolveParams = <UserData extends object>(
	direction: TweenTransitionDirection | null,
	params: TweenTransitionParams<UserData>,
	options: TweenTransitionOptions<UserData> = {}
): ResolvedTweenTransitionParams<UserData> => {
	const attach = resolveAttach(params.attach ?? options.attach);

	return {
		attach,
		dispatchEvents: params.dispatchEvents ?? options.dispatchEvents ?? false,
		instant: resolveDataFlag(
			attach,
			'instant',
			direction,
			params.instant ?? options.instant ?? false
		),
		bypass: resolveDataFlag(attach, 'bypass', direction, options.bypass ?? false),
		ignore: params.ignore ?? options.ignore ?? false,
		inViewport: params.inViewport ?? options.inViewport ?? false,
		overlapStrategy: params.overlapStrategy ?? options.overlapStrategy ?? 'abort',
		overwrite: params.overwrite ?? options.overwrite ?? true,
		data: { ...options.data, ...params.data }
	};
};
