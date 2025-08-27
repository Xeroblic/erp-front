import { useAppDispatch, useAppSelector } from '@/store';
import { selectFontSize, setFontSize } from '@/store/slices/personalizacion/personalizacionSlice';

export default function useFontSize() {
	const dispatch = useAppDispatch();
	const fontSize = useAppSelector(selectFontSize);

	const handleSetFontSize = (newFontSize: number) => {
		dispatch(setFontSize(newFontSize));
	};

	return {
		fontSize,
		setFontSize: handleSetFontSize
	};
}
