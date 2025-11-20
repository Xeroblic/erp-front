import { IUser } from '@/interface';
import { Descendant } from 'slate';

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
