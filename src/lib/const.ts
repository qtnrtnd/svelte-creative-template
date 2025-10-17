/**
 * @file Defines global constants used throughout the application.
 * @module lib/const
 */

import hyphen from 'hyphen/en-us';

/**
 * Debounce duration in milliseconds for all resize events across the application.
 * @constant
 */
export const RESIZE_DEBOUNCE = 100;

/**
 * Default document title template function for the `Meta` component.
 * @param title - The title of the page.
 * @returns The formatted document title.
 */
export const DOCUMENT_TITLE = (title: string) => title;

export const PERSPECTIVE = 1400;

/**
 * The hyphenation engine for choosen language.
 * @see https://www.npmjs.com/package/hyphen
 */
export { hyphen };
