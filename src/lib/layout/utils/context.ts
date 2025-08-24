import { setContext, getContext } from 'svelte';
import { LayoutContext } from '../core/LayoutContext.svelte';

const contextKey = Symbol('layout-context');

export const createLayoutContext = function () {
	return setContext(contextKey, new LayoutContext());
};

export const useLayout = function () {
	return getContext<LayoutContext>(contextKey);
};
