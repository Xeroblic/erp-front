import { useMemo } from 'react';
import { NOTEBOOK_FIELDS_METADATA } from '../components/constants/notebook/notebook.fields';

type FieldKey = keyof typeof NOTEBOOK_FIELDS_METADATA;

export interface ValidationStats {
	completionPercentage: number;
	missingFields: { key: string; label: string; group: string }[];
	isComplete: boolean;
	totalFields: number;
	completedFields: number;
}

export const useFormCompleteness = (values: Record<string, any>): ValidationStats => {
	const stats = useMemo(() => {
		let completed = 0;
		const missing: { key: string; label: string; group: string }[] = [];
		const fields = Object.entries(NOTEBOOK_FIELDS_METADATA);
		
		fields.forEach(([key, meta]) => {
			const value = values[key];
			let isFilled = false;

			// Validation logic based on type
			switch (meta.type) {
				case 'string':
					isFilled = typeof value === 'string' && value.trim().length > 0;
					break;
				case 'number':
				case 'integer':
					isFilled = typeof value === 'number' && !isNaN(value);
					break;
				case 'boolean':
					// Booleans are always "complete" if they exist, but undefined is not.
					// If default is false, it's considered filled? Usually yes in forms.
					// Checking for undefined/null mainly.
					isFilled = value !== undefined && value !== null;
					break;
				case 'string|integer':
					isFilled = (typeof value === 'string' && value.trim().length > 0) || (typeof value === 'number' && !isNaN(value));
					break;
				case 'object':
                    // Objects (like extra_attributes) might be optional or need content check
                    // For now, assume if it exists it's fine, or skip if optional? 
                    // extra_attributes usually isn't mandatory unless specified. 
                    // Let's assume non-null is enough
					isFilled = value !== undefined && value !== null;
					break;
				default:
					isFilled = !!value;
			}

            // Exceptions / Business Logic
            // Example: observations might be optional? 
            // If the user wants STRICT completeness, everything must be filled.
            // If observations is optional in schema but listed here, we might flagging it.
            // Based on the prompt "validate that ALL fields are complete", we enforce strictness.
            
			if (isFilled) {
				completed++;
			} else {
				missing.push({
					key,
					label: meta.label,
					group: (meta as any).group || 'General',
				});
			}
		});

		const total = fields.length;
		const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);

		return {
			completionPercentage: percentage,
			missingFields: missing,
			isComplete: percentage === 100,
			totalFields: total,
			completedFields: completed,
		};
	}, [values]);

	return stats;
};
