/**
 * @file Initializes and exports the GSAP (GreenSock Animation Platform) library and its plugins.
 * This module registers the necessary plugins and makes them available for use throughout the application.
 * @module lib/gsap
 */

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins to make them available globally.
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip, SplitText);

/**
 * The core GSAP library.
 * @see https://greensock.com/docs/v3/GSAP
 */
export { gsap };

/**
 * GSAP plugin for creating scroll-based animations.
 * @see https://greensock.com/docs/v3/Plugins/ScrollTrigger
 */
export { ScrollTrigger };

/**
 * GSAP plugin for smooth scrolling effects.
 * @see https://greensock.com/docs/v3/Plugins/ScrollSmoother
 */
export { ScrollSmoother };

/**
 * GSAP plugin for animating layout changes (e.g., FLIP animations).
 * @see https://greensock.com/docs/v3/Plugins/Flip
 */
export { Flip };

/**
 * GSAP plugin for splitting text into characters, words, and lines for animation.
 * @see https://greensock.com/docs/v3/Plugins/SplitText
 */
export { SplitText };
