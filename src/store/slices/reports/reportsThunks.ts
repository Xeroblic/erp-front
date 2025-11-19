import { createAsyncThunk } from "@reduxjs/toolkit";
import { ReportsService } from "@/services/reports/reports.service";
import { IReportExportParams, IReportFilters } from "@/interface/reports.interface";


export const fetchReportTypes = createAsyncThunk(
    "reports/fetchReportTypes",
    async (subsidiaryId: number, thunkAPI) => {
        try {
            const res = await ReportsService.getTypes(subsidiaryId);
            return res.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchReportResults = createAsyncThunk(
    "reports/fetchReportResults",
    async (
        params: {
            subsidiaryId: number;
            type: string;
            filters: IReportFilters;
        },
        thunkAPI
    ) => {
        try {
            const res = await ReportsService.getResults(
                params.subsidiaryId,
                params.type,
                params.filters
            );
            return res.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);


export const exportReport = createAsyncThunk(
    "reports/exportReport",
    async (
        params: {
            subsidiaryId: number;
            type: string;
            exportParams: IReportExportParams;
        },
        thunkAPI
    ) => {
        try {
            const res = await ReportsService.export(
                params.subsidiaryId,
                params.type,
                params.exportParams
            );
            return res; // BLOB
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);