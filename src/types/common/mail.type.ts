import { Descendant } from 'slate';
import { IUser } from '@/interface';

export type TMail = {
	id: number;
	user: IUser;
	fold: string;
	dateTime: string;
	isNew?: boolean;
	title: string;
	content: Descendant[];
	attachment?: string[];
	flag?: boolean;
};
