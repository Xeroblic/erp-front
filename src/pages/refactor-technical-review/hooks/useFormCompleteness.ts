import { useMemo } from 'react';

export interface ValidationStats {
	completionPercentage: number;
	missingFields: { key: string; label: string; group: string }[];
	isComplete: boolean;
	totalFields: number;
	completedFields: number;
}

export const useFormCompleteness = (
	values: Record<string, any>,
	fieldsMetadata: Record<string, any>,
): ValidationStats => {
	const stats = useMemo(() => {
		let completed = 0;
		const missing: { key: string; label: string; group: string }[] = [];
		const fields = Object.entries(fieldsMetadata);

		fields.forEach(([key, meta]) => {
			const value = values[key];
			let isFilled = false;

			// Validation logic based on type
			switch (meta.type) {
				case 'string':
					isFilled = typeof value === 'string' && value.trim().length > 0;
					break;
				case 'integer':
					isFilled = typeof value === 'number' && !isNaN(value);
					break;
				case 'boolean':
					// Booleans are always "complete" if they exist (true/false), but undefined/null is not.
					isFilled = value !== undefined && value !== null;
					break;
				case 'string|integer':
					isFilled =
						(typeof value === 'string' && value.trim().length > 0) ||
						(typeof value === 'number' && !isNaN(value));
					break;
				case 'object':
					// For extra_attributes or similar, usually optional, but if required:
					isFilled = value !== undefined && value !== null;
					break;
				default:
					isFilled = !!value;
			}

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
	}, [values, fieldsMetadata]);

	return stats;
};
