

export interface ILockerLocation {
    id: number;
    name: string;
    address?: string;
    [key: string]: any;
}

export interface ILockerInternal {
    id: number;
    locker_number: string;
    number?: string; 
    qr_token: string;
    status: string;
    status_label?: string;
    locker_pin?: string | null;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    device_description?: string;
    device_brand?: string;
    device_model?: string;
    serial_number?: string;
    service_type?: string;
    is_invoice?: boolean;
    invoice_rut?: string;
    invoice_company_name?: string;
    invoice_company_address?: string;
    check_in_at?: string;
    check_out_at?: string;
    created_at?: string;
    updated_at?: string;
    active_service_order?: IServiceOrder | null;
    [key: string]: any;
}

export interface IServiceOrder {
    id: number;
    locker_id?: number;
    locker_number?: string;
    customer_name?: string;
    customer_email?: string;
    device_description?: string;
    device_brand?: string;
    device_model?: string;
    service_type?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface ITechWithdrawRequest {
    service_order_id: number;
}

export interface ITechDropOffRequest {
    locker_id: number;
    service_order_id: number;
    new_locker_pin?: string;
}

export interface ITechResetRequest {
    locker_id: number;
    new_locker_pin?: string;
}

export interface ISetReadyForPickupRequest {
    service_order_id: number;
    pin_manual: string;
}


export interface ILockerActionResponse {
    success: boolean;
    message?: string;
    [key: string]: any;
}



// ============================================================================
// ENTIDADES PÚBLICAS / VISTA CLIENTE
// ============================================================================

export interface ILockerPublicInfo {
    is_available: boolean;
    message?: string;
    available_lockers: string[];
    locker_number?: string | number;
    [key: string]: any; 
}

export interface ICheckInRequest {
    qr_token: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    device_description: string;
    is_invoice: boolean;
    invoice_rut?: string;
    invoice_company_name?: string;
    invoice_company_address?: string;
    serial_number?: string;
    service_type?: string;
    upgrade_type?: string | null;
    device_brand?: string;
    device_model?: string;
}

export interface ICheckOutRequest {
    withdrawal_keyword: string;
}

export interface ICheckInResponse {
    success: boolean;
    message?: string;
    locker_pin: string | null;
    data?: {
        locker?: {
            number: string;
        };
    };
}

export interface ICheckOutResponse {
    success: boolean;
    message?: string;
    locker_number?: string;
    locker_pin?: string;
}