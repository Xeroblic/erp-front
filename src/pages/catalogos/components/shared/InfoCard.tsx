import React from 'react';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

interface InfoCardSection {
	title: string;
	items: Array<{
		label?: string;
		value: React.ReactNode;
		highlight?: boolean;
		condition?: boolean;
	}>;
}

interface InfoCardProps {
	title: string;
	mainContent?: React.ReactNode;
	sections?: InfoCardSection[];
	badges?: Array<{
		label: string;
		color: 'emerald' | 'red' | 'sky' | 'amber' | 'blue';
		variant?: 'solid' | 'outline';
		condition?: boolean;
	}>;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, mainContent, sections, badges }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardBody>
				{mainContent}

				{badges && badges.length > 0 && (
					<div className='mt-2 flex flex-wrap items-center gap-2'>
						{badges.map((badge, idx) => {
							// Si tiene condición y es false, no mostrar
							if (badge.condition !== undefined && !badge.condition) {
								return null;
							}
							return (
								<Badge key={idx} color={badge.color} variant={badge.variant}>
									{badge.label}
								</Badge>
							);
						})}
					</div>
				)}

				{sections && sections.length > 0 && (
					<div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2'>
						{sections.map((section, sectionIdx) => (
							<div key={sectionIdx} className='space-y-3'>
								<h4 className='font-semibold text-gray-700 dark:text-gray-300'>
									{section.title}
								</h4>
								<div className='space-y-2 text-sm text-gray-600 dark:text-gray-400'>
									{section.items.map((item, itemIdx) => {
										// Si tiene condición y es false, no mostrar
										if (item.condition !== undefined && !item.condition) {
											return null;
										}

										if (item.label) {
											return (
												<p key={itemIdx}>
													<span className='font-medium text-gray-700 dark:text-gray-300'>
														{item.label}:
													</span>{' '}
													{item.highlight ? (
														<span className='text-green-600 dark:text-green-400'>
															{item.value}
														</span>
													) : (
														item.value
													)}
												</p>
											);
										}

										return <p key={itemIdx}>{item.value}</p>;
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default InfoCard;
