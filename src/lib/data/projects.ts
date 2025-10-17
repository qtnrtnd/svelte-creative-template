import ewenLarreurThumbnail from '$lib/assets/portfolio-ewen-larreur-2025.png?w=720&string';
import lissacBrigeThumbnail from '$lib/assets/site-lissac-brige-2023.png?w=720&string';
import errorThumbnail from '$lib/assets/component-error-2022.png?w=720&string';
import portfolioThumbnail from '$lib/assets/portfolio-quentin-ratinaud-2022.png?w=720&string';
import portraitThumbnail from '$lib/assets/app-portrait-2022.png?w=720&string';
import circumThumbnail from '$lib/assets/app-circum-2022.png?w=720&string';
import pokindexThumbnail from '$lib/assets/app-pokindex-2022.png?w=720&string';
import soundTidyThumbnail from '$lib/assets/app-soundtidy-2021.png?w=720&string';

export type Project = {
	title: string;
	year: number;
	link: string;
	thumbnail: string;
	tags: string[];
};

const projects: Project[] = [
	{
		title: 'Ewen Larreur',
		year: 2025,
		link: 'https://ewenlarreur.com',
		thumbnail: ewenLarreurThumbnail,
		tags: ['Portfolio', 'SvelteKit', 'GSAP', 'Directus']
	},
	{
		title: 'Lissac Brige',
		year: 2023,
		link: 'https://lissac-brige.fr',
		thumbnail: lissacBrigeThumbnail,
		tags: ['Showcase', 'Multi-User', 'Nuxt.js', 'Strapi']
	},
	{
		title: 'Error',
		year: 2022,
		link: 'https://component-error-2022.madebyquent.in',
		thumbnail: errorThumbnail,
		tags: ['Component', 'Vue.js', 'GSAP', 'Canvas']
	},
	{
		title: 'Quentin Ratinaud',
		year: 2022,
		link: 'https://portfolio-qratinaud-2022.madebyquent.in/',
		thumbnail: portfolioThumbnail,
		tags: ['Portfolio', 'GSAP', 'ScrollTrigger', 'SVG']
	},
	{
		title: 'Portrait',
		year: 2022,
		link: 'https://app-portrait-2022.madebyquent.in/',
		thumbnail: portraitThumbnail,
		tags: ['Experiment', 'Blender', 'GSAP', 'Canvas']
	},
	{
		title: 'Circum',
		year: 2022,
		link: 'https://app-circum-2022.madebyquent.in/',
		thumbnail: circumThumbnail,
		tags: ['Web App', 'Generative Art', 'Canvas', 'Workers']
	},
	{
		title: 'Pokindex',
		year: 2022,
		link: 'https://app-pokindex-2022.madebyquent.in/',
		thumbnail: pokindexThumbnail,
		tags: ['Web App', 'PHP', 'CSS Driven', 'JSON']
	},
	{
		title: 'Sound Tidy',
		year: 2021,
		link: 'https://app-soundtidy-2021.madebyquent.in/',
		thumbnail: soundTidyThumbnail,
		tags: ['Web App', 'Web Audio', 'UI', 'UX']
	}
];

export default projects;
