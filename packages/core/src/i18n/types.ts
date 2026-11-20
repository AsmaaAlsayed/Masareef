import type { en } from './en.js';

type Texts<T> = { readonly [K in keyof T]: T[K] extends string ? string : Texts<T[K]> };

/** The shape of the English resources with any text: what every language must provide. */
export type Translation = Texts<typeof en>;
