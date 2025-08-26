/**
 * @file Manages suspense boundaries for asynchronous operations, coordinating loading states and revealing content when tasks are complete.
 * @module lib/suspense/core/SuspenseContext
 */

import { Hook } from '$lib/hooks/core/Hook';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { useSuspense, type SuspenseScope } from '../utils/context';
import { onDestroy, onMount } from 'svelte';
import { toArray, type Extracted } from '$lib/helpers';
import type { HookFunction } from '$lib/hooks';

/**
 * A task that can be awaited, either a Promise or a function that returns a Promise.
 */
type SuspenseTask = (() => Promise<unknown>) | Promise<unknown>;

/**
 * Options for configuring a `SuspenseContext`.
 */
export type SuspenseContextOptions = {
	/**
	 * If `true`, the suspense boundary will only suspend once and will not react to new tasks after revealing.
	 * @default false
	 */
	final?: boolean;
	/**
	 * A parent `SuspenseContext` or `SuspenseScope` to inherit suspension state from.
	 */
	dependency?: SuspenseScope | Public<SuspenseContext> | null;
	/**
	 * The scope to which this suspense context belongs.
	 * @default 'parent'
	 */
	scope?: SuspenseScope;
	/**
	 * An initial state function to suspend on.
	 */
	suspendState?: Parameters<ComponentSuspense['suspendState']>[0];
	/**
	 * Initial tasks to suspend on.
	 */
	suspendTasks?: Parameters<ComponentSuspense['suspendTasks']>[0];
	/**
	 * A delay in seconds before the content is revealed after all tasks are complete.
	 */
	suspendDelay?: Parameters<ComponentSuspense['suspendDelay']>[0];
};

/**
 * An interface for components to interact with a `SuspenseContext`.
 */
export type ComponentSuspense = Public<SuspenseContext> & {
	/**
	 * Registers asynchronous tasks with the suspense boundary. The boundary will remain suspended until all tasks are resolved.
	 * @param tasks A single task or an array of tasks.
	 * @returns The resolved value(s) of the task(s).
	 */
	suspendTasks: <T extends SuspenseTask | SuspenseTask[]>(
		tasks: T
	) => T extends unknown[] ? Extracted<T[number]>[] : Extracted<T>;
	/**
	 * Registers a state function with the suspense boundary. The boundary will remain suspended as long as the function returns `true`.
	 * @param state A function that returns a boolean indicating if the component is in a suspended state.
	 */
	suspendState: (state: () => boolean) => void;
	/**
	 * Sets a delay in seconds before revealing the content after all tasks and states are resolved.
	 * @param delay The delay in seconds.
	 */
	suspendDelay: (delay: number) => void;
};

/**
 * Manages a suspense boundary, tracking pending tasks and states to control visibility of content.
 */
export class SuspenseContext {
	private _pendingDelays = new SvelteMap<symbol, number>();
	private _pendingTasks = new SvelteSet<SuspenseTask>();
	private _pendingStates = new SvelteSet<() => boolean>();
	private _suspended = $state(true);
	private _totalTaskCount = $state(0);
	private _pendingTaskCount = $derived(this._pendingTasks.size);
	private _resolvedTaskCount = $derived(this._totalTaskCount - this._pendingTaskCount);
	private _progress = $derived(this._resolvedTaskCount / (this._totalTaskCount || 1));
	private _hasRevealed = false;
	private _timeoutId?: number;
	private _options: Readonly<SuspenseContextOptions>;

	/**
	 * A hook that dispatches when the suspense boundary reveals its content.
	 */
	onReveal: HookFunction;

	/**
	 * A hook that dispatches when the suspense boundary becomes suspended.
	 */
	onSuspend: HookFunction;

	/**
	 * Creates a new `SuspenseContext`.
	 * @param options Configuration options for the suspense context.
	 */
	constructor(options: SuspenseContextOptions = {}) {
		this._options = Object.freeze({
			final: false,
			dependency: useSuspense(),
			scope: 'parent',
			...options
		});
		this.onReveal = Hook.create({
			validate: () => !this._suspended
		});
		this.onSuspend = Hook.create({
			validate: () => this._suspended
		});

		this._init();
	}

	/**
	 * Extends a `SuspenseContext` to provide a component-level API for managing suspense.
	 * @param context The `SuspenseContext` instance to extend.
	 * @returns A `ComponentSuspense` object for the component to interact with.
	 */
	static extend(context: SuspenseContext): ComponentSuspense {
		const componentId = Symbol();
		const componentTasks = new SvelteSet<SuspenseTask>();
		const componentStates = new SvelteSet<() => boolean>();

		onDestroy(() => {
			for (const task of componentTasks) {
				context._unsuspendTask(task, componentTasks);
			}

			for (const state of componentStates) {
				context._unsuspendState(state, componentStates);
			}

			context._pendingDelays.delete(componentId);
		});

		return {
			options: context.options,
			suspended: context.suspended,
			pendingTaskCount: context.pendingTaskCount,
			resolvedTaskCount: context.resolvedTaskCount,
			totalTaskCount: context.totalTaskCount,
			progress: context.progress,
			onReveal: context.onReveal,
			onSuspend: context.onSuspend,
			suspendTasks(tasks) {
				return context._suspendTasks(tasks, componentTasks);
			},
			suspendState(state) {
				return context._suspendState(state, componentStates);
			},
			suspendDelay(delay) {
				return context._pendingDelays.set(componentId, delay);
			}
		};
	}

	/**
	 * Returns whether the suspense boundary is currently suspended.
	 * @returns `true` if suspended, otherwise `false`.
	 */
	suspended = () => {
		return this._suspended;
	};

	/**
	 * Returns the number of pending tasks.
	 */
	pendingTaskCount = () => {
		return this._pendingTaskCount;
	};

	/**
	 * Returns the number of resolved tasks.
	 */
	resolvedTaskCount = () => {
		return this._resolvedTaskCount;
	};

	/**
	 * Returns the total number of tasks registered.
	 */
	totalTaskCount = () => {
		return this._totalTaskCount;
	};

	/**
	 * Returns the progress of task completion as a value between 0 and 1.
	 */
	progress = () => {
		return this._progress;
	};

	/**
	 * The configuration options for the suspense context.
	 */
	get options() {
		return this._options;
	}

	private _getDelay() {
		return Math.max(0, ...this._pendingDelays.values()) * 1000;
	}

	private _init() {
		const { final, dependency, suspendDelay, suspendTasks, suspendState } = this._options;

		const parent = typeof dependency === 'string' ? useSuspense(dependency) : dependency;

		if (suspendDelay) {
			this._pendingDelays.set(Symbol(), suspendDelay);
		}

		if (suspendTasks) {
			this._suspendTasks(suspendTasks);
		}

		if (suspendState) {
			this._suspendState(suspendState);
		}

		$effect(() => {
			if (final && this._hasRevealed) return;

			const prev = this._suspended;
			const hasPendingState = Array.from(this._pendingStates).some((s) => s());
			const hasPendingTask = this._pendingTasks.size > 0;
			const currentSuspended = hasPendingState || hasPendingTask;
			const parentSuspended = parent ? parent.suspended() : false;
			const suspended = currentSuspended || parentSuspended;

			if (prev === suspended) return;

			clearTimeout(this._timeoutId);

			if (suspended) {
				this._suspended = true;
				this.onSuspend.dispatch();
			} else {
				this._timeoutId = setTimeout(() => {
					this._suspended = false;
					this._hasRevealed = true;
					this._pendingDelays.clear();
					this.onReveal.dispatch();
				}, this._getDelay());
			}
		});
	}

	private _wrapTask(task: SuspenseTask): Extracted<SuspenseTask> {
		return typeof task === 'function'
			? new Promise<unknown>((resolve, reject) => {
					onMount(() => {
						task()
							.then((value) => resolve(value))
							.catch((err) => reject(err));
					});
				})
			: task;
	}

	private _suspendTasks<
		Tasks extends SuspenseTask | SuspenseTask[],
		Return = Tasks extends unknown[] ? Extracted<Tasks[number]>[] : Extracted<Tasks>
	>(tasks: Tasks, componentTasks?: Set<SuspenseTask>): Return {
		const wrapped = Array.isArray(tasks)
			? tasks.map((t) => this._wrapTask(t))
			: this._wrapTask(tasks);

		if (!this._options.final || !this._hasRevealed) {
			if (!this._suspended) {
				this._totalTaskCount = 0;
			}

			for (const task of toArray(wrapped)) {
				if (componentTasks) componentTasks.add(task);

				this._pendingTasks.add(task);
				this._totalTaskCount++;

				task.finally(() => this._unsuspendTask(task, componentTasks));
			}
		}

		return wrapped as Return;
	}

	private _unsuspendTask(task: SuspenseTask, componentTasks?: Set<SuspenseTask>): void {
		if (componentTasks) componentTasks.delete(task);
		this._pendingTasks.delete(task);
	}

	private _suspendState(state: () => boolean, componentStates?: Set<() => boolean>): void {
		if (componentStates) componentStates.add(state);
		this._pendingStates.add(state);
	}

	private _unsuspendState(state: () => boolean, componentStates?: Set<() => boolean>): void {
		if (componentStates) componentStates.delete(state);
		this._pendingStates.delete(state);
	}
}
