export const formatCurrency = (value: number) =>
	new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);

export const formatDate = (value: string) =>
	new Date(value).toLocaleDateString('es-CO', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
