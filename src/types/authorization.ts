export interface AuthorizationCompanyRef {
	id: number;
	name: string;
}

export interface AuthorizationSubsidiaryRef {
	id: number;
	name: string;
	company?: AuthorizationCompanyRef | null;
	source?: string;
}

export interface AuthorizationBranchRef {
	id: number;
	name: string;
	subsidiary?: AuthorizationSubsidiaryRef | null;
	source?: string;
	is_primary?: boolean;
	position?: string | null;
}

export interface AuthorizationAccessScope {
	subsidiaries: AuthorizationSubsidiaryRef[];
	branches: AuthorizationBranchRef[];
}

export interface AuthorizationVisibleScope {
	subsidiaries: AuthorizationSubsidiaryRef[];
	branches: AuthorizationBranchRef[];
}

export interface AuthorizationContext {
	branchId?: number | null;
	subsidiaryId?: number | null;
	companyId?: number | null;
}

export type AuthorizationScopeMode = 'none' | 'visible' | 'access' | 'both';

export interface AuthorizationCheckOptions extends AuthorizationContext {
	permission?: string | string[];
	permissions?: string[];
	role?: string | string[];
	roles?: string[];
	requireAll?: boolean;
	scope?: AuthorizationScopeMode;
}
