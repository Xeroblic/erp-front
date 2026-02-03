import DataTable from "@/components/ui/DataTable";
import { IInventoryMovement } from "@/interface/inventoryMovements.interface";


export function TrazabilidadList({ data }: { data: IInventoryMovement[] }) {

    const columns = [
        {
            accessorKey: "product_id",
            header: "Producto",
        },
        {
            accessorKey: "from_warehouse_id",
            header: "Desde",
        },
        {
            accessorKey: "to_warehouse_id",
            header: "Hasta",
        },
        {
            accessorKey: "quantity",
            header: "Cantidad",
        },
        {
            accessorKey: "notes",
            header: "Notas",
        },
    ]
    return (
        <>
            <DataTable columns={columns} data={data} />
        </>
    )
}