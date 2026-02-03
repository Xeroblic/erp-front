export interface IInventoryMovement {
    "id": number,
    "product": {
        "id": number,
        "sku": string,
        "name": string
    },
    "branch": {
        "id": number,
        "name": string
    },
    "warehouse": {
        "id": number,
        "name": string
    },
    "quantity_delta": number,
    "balance_before": number,
    "balance_after": number,
    "movement_type": string,
    "reason": string,
    "source": {
        "type": string,
        "id": number,
        "line_id": number
    },
    "performed_by": {
        "id": number,
        "name": string,
        "email": string
    },
    "metadata": {
        "origin": string,
        "stock_target": number
    },
    "occurred_at": string,
    "created_at": string
}

export interface IInventoryMovementsResponse {
    "data": IInventoryMovement[],
    "links": {
        "first": string,
        "last": string,
        "prev": string,
        "next": string
    },
    "meta": {
        "current_page": number,
        "from": number,
        "last_page": number,
        "links": [
            {
                "url": string,
                "label": string,
                "page": number,
                "active": boolean
            },
            {
                "url": string,
                "label": string,
                "page": number,
                "active": boolean
            },
            {
                "url": string,
                "label": string,
                "page": null,
                "active": false
            }
        ],
        "path": string,
        "per_page": number,
        "to": number,
        "total": number
    }
}