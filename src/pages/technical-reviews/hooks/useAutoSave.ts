import { useAppDispatch } from "@/store"
import { PayloadAction } from "@reduxjs/toolkit";
import { useEffect, useRef } from "react";


type ActionCreator<T> = (payload: T) => PayloadAction<T>;

export const useAutoSave = <T>(
    actionCreator: ActionCreator<T>,
    payload: T,
    delay: number,
): void => {
    const dispatch = useAppDispatch();

    const savedCallback = useRef<() => void>(() => {});

    useEffect(() => {
        savedCallback.current = () => {
            dispatch(actionCreator(payload));
        };
    }, [payload, actionCreator, dispatch])

    useEffect(() => {
        if (delay === null || delay === undefined ) return;

        const tick = () =>{
            savedCallback.current();
        }

        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay])
}