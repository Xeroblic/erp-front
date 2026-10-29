export interface SystemParameter {
	id: number;
	key: string;
	value: string;
	description: string;
	category: 'general' | 'system' | 'email' | 'security' | 'integration' | 'ui' | 'business';
	data_type: 'string' | 'number' | 'boolean' | 'json' | 'date';
	is_editable: boolean;
	is_visible: boolean;
	default_value?: string;
	validation_rules?: string;
	created_at: string;
	updated_at: string;
	updated_by?: string;
}

export interface SystemParameterCreate {
	key: string;
	value: string;
	description: string;
	category: SystemParameter['category'];
	data_type: SystemParameter['data_type'];
	is_editable?: boolean;
	is_visible?: boolean;
	default_value?: string;
	validation_rules?: string;
}

export interface SystemParameterUpdate {
	value?: string;
	description?: string;
	category?: SystemParameter['category'];
	data_type?: SystemParameter['data_type'];
	is_editable?: boolean;
	is_visible?: boolean;
	default_value?: string;
	validation_rules?: string;
}

export interface SystemParameterFilters {
	search?: string;
	category?: SystemParameter['category'];
	data_type?: SystemParameter['data_type'];
	is_editable?: boolean;
	is_visible?: boolean;
}

// Para el hook de gestión
export interface SystemParametersState {
	parameters: SystemParameter[];
	filteredParameters: SystemParameter[];
	isLoading: boolean;
	error: string | null;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	filters: SystemParameterFilters;
}

// Para estadísticas del dashboard
export interface SystemParameterStats {
	total: number;
	byCategory: Record<string, number>;
	editable: number;
	systemControlled: number;
}
