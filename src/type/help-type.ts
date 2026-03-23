export interface ITopic {
	id: string;
	topic_name_en: string;
	topic_name_hn?: string;
	topic_name_fr?: string;
	topic_description_en: string;
	topic_description_fr: string;
	topic_description_hn: string;
	most_popular?: boolean;
	published_at: Date;
	created_at: Date;
	updated_at: Date;
	categories: ICategory[];
}

export interface ICategory {
	id: string | any;
	name_en: string;
	name_hn: string;
	name_fr: string;
	topic: ITopic;
	helps?: IHelp[];
	most_popular?: boolean;
	published_at: Date;
	created_at: Date;
	updated_at: Date;
	permissions: string;
}

export interface ITopicDetail {
	id: string;
	name: string;
	topic: ITopic;
	helps: IHelp[];
	published_at: Date;
	created_at: Date;
	updated_at: Date;
}

export interface IHelp {
	id: string;
	title_en: string;
	type: string;
	most_popular: boolean;
	description_en: string;
	slug: string;
	category: ICategory;
	published_at: Date;
	created_at: Date;
	updated_at: Date;
	description_fr: string;
	description_hn: string;
	title_fr: string;
	title_hn: string;
}

export type ICodeLanguage = 'fr' | 'en' | 'hn';
