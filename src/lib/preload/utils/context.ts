import { getContext, setContext } from 'svelte';
import { PreloadContext } from '../core/PreloadContext';

const contextKey = Symbol('preload-context');

export const usePreload = () => {
	const context = getContext<PreloadContext>(contextKey);
	return (context ? PreloadContext.extend(context) : undefined)!;
};

export const createPreloadContext = () => {
	const context = setContext(contextKey, new PreloadContext());
	return PreloadContext.extend(context);
};
