import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip, SplitText);

export { gsap, ScrollTrigger, ScrollSmoother, Flip, SplitText };
