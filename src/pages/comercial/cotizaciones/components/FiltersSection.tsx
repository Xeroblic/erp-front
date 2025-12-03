import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from "@/components/ui/Card";
import { normalizeQuoteStatusValue, quoteStatusOptions } from "../constants/quoteStatuses";
import { QuoteStatus } from "@/interface";
import Button from "@/components/ui/Button";

export const FiltersSection = ({ filters, setFilters, showFilters, setShowFilters, resetFilters }: any) => (
    <Card className='mb-6'>
        <CardHeader>
            <CardHeaderChild>
                <CardTitle>Filtros</CardTitle>
            </CardHeaderChild>
        </CardHeader>
        <CardBody>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                <Input
                    name='search'
                    placeholder='Buscar por número o notas...'
                    value={filters.search || ''}
                    onChange={(e: any) => setFilters({ ...filters, search: e.target.value })}
                />

                <Select
                    name='status'
                    value={filters.status ? normalizeQuoteStatusValue(filters.status) : ''}
                    onChange={(e: any) =>
                        setFilters({
                            ...filters,
                            status: e.target.value
                                ? (e.target.value as QuoteStatus)
                                : undefined,
                        })
                    }>
                    <option value=''>Todos los estados</option>
                    {quoteStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>

                <Input
                    name='customer'
                    placeholder='Cliente...'
                    value={filters.customerId?.toString() || ''}
                    onChange={(e: any) =>
                        setFilters({
                            ...filters,
                            customerId: e.target.value ? Number(e.target.value) : undefined,
                        })
                    }
                />

                <div className='flex space-x-2'>
                    <Button variant='outline' onClick={resetFilters} icon='HeroXMark'>
                        Limpiar
                    </Button>
                    <Button onClick={() => setShowFilters(!showFilters)} icon='HeroFunnel'>
                        {showFilters ? 'Ocultar' : 'Más filtros'}
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    <Input
                        name='dateFrom'
                        type='date'
                        placeholder='Fecha desde'
                        value={filters.dateFrom || ''}
                        onChange={(e: any) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                    <Input
                        name='dateTo'
                        type='date'
                        placeholder='Fecha hasta'
                        value={filters.dateTo || ''}
                        onChange={(e: any) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                    <Input
                        name='minAmount'
                        type='number'
                        placeholder='Monto mínimo'
                        value={filters.minAmount || ''}
                        onChange={(e: any) =>
                            setFilters({
                                ...filters,
                                minAmount: e.target.value ? Number(e.target.value) : undefined,
                            })
                        }
                    />
                    <Input
                        name='maxAmount'
                        type='number'
                        placeholder='Monto máximo'
                        value={filters.maxAmount || ''}
                        onChange={(e: any) =>
                            setFilters({
                                ...filters,
                                maxAmount: e.target.value ? Number(e.target.value) : undefined,
                            })
                        }
                    />
                </div>
            )}
        </CardBody>
    </Card>
);

