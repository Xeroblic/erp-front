import React, {
	FC,
	ReactNode,
	FocusEventHandler,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import ReactSelect, {
	ActionMeta,
	ClassNamesConfig,
	ControlProps,
	GroupBase,
	StylesConfig,
	MultiValueProps,
	MultiValueRemoveProps,
	OptionProps,
	SingleValue,
	MultiValue,
	FormatOptionLabelMeta,
	components as ReactSelectComponents,
	type MenuProps,
	type MenuListProps,
} from 'react-select';
import { PublicBaseSelectProps } from 'react-select/base';
import classNames from 'classnames';
import CreatableSelect from 'react-select/creatable';
import { TBorderWidth } from '../../types/borderWidth.type';
import themeConfig from '../../config/theme.config';
import { TRounded } from '../../types/rounded.type';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import useColorIntensity from '../../hooks/useColorIntensity';
import useRoundedSize from '../../hooks/useRoundedSize';
import { IValidationBaseProps } from './Validation';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';

export type TSelectVariant = 'solid';
export type TSelectDimension = 'sm' | 'default' | 'lg' | 'xl';

export type TSelectOption = {
	value: string;
	label: string;
	isFixed?: boolean;
	isDisabled?: boolean;
};
export type TSelectOptions = TSelectOption[];
export type TSelectGroups = GroupBase<TSelectOption>[];

type TReactSelect = Partial<
	PublicBaseSelectProps<TSelectOption, boolean, GroupBase<TSelectOption>>
>;

interface OptionPropsExtend extends Partial<OptionProps> {
	data: { isDisabled: boolean };
}
interface MultiValuePropsExtends extends Partial<MultiValueProps> {
	data: { isFixed: boolean };
}
interface MultiValueRemovePropsExtend extends Partial<MultiValueRemoveProps> {
	data: { isFixed: boolean; isDisabled: boolean };
}

const baseComponents = {
	DropdownIndicator: null,
};

interface ISelectReactProps extends TReactSelect, Partial<IValidationBaseProps> {
	borderWidth?: TBorderWidth;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	id?: string;
	inputId?: string;
	name: string;
	rounded?: TRounded;
	dimension?: TSelectDimension;
	variant?: TSelectVariant;
	disabled?: boolean;
	isDisabled?: boolean;
	isCreatable?: boolean;
	noOptionsMessage?: (obj: { inputValue: string }) => ReactNode;
	options?: TSelectOptions | TSelectGroups;
	value?: TSelectOption | readonly TSelectOption[] | null;
	onChange?: (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
		actionMeta?: ActionMeta<TSelectOption>,
	) => void;
	isMulti?: boolean;
	onBlur?: FocusEventHandler<HTMLInputElement>;
	onFocus?: FocusEventHandler<HTMLInputElement>;
	placeholder?: string;
	menuPortalTarget?: HTMLElement | null;
	menuPosition?: 'absolute' | 'fixed';
	styles?: StylesConfig<TSelectOption, boolean, GroupBase<TSelectOption>> | undefined;
	isClearable?: boolean;
	isLoading?: boolean;
	isSearchable?: boolean;
	onInputChange?: (value: string, actionMeta?: any) => void;
	onCreateOption?: (inputValue: string) => void;
	formatOptionLabel?: (
		data: TSelectOption,
		formatOptionLabelMeta: FormatOptionLabelMeta<TSelectOption>,
	) => ReactNode;
	formatGroupLabel?: (group: GroupBase<TSelectOption>) => ReactNode;
}

const SelectReact: FC<ISelectReactProps> = (props) => {
	const mobileInputRef = useRef<HTMLInputElement>(null);
	const handleInputFocus = () => {
		mobileInputRef.current?.focus();
	};
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	const {
		borderWidth = themeConfig.borderWidth,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		isValidMessage,
		name,
		rounded = themeConfig.rounded,
		dimension = 'default',
		validFeedback,
		variant = 'solid',
		isValid,
		isTouched,
		invalidFeedback,
		disabled = false,
		isCreatable = false,
		isMulti = false,
		id,
		inputId,
		isDisabled: isDisabledProp,
		onChange: userOnChange,
		onMenuOpen: userOnMenuOpen,
		onMenuClose: userOnMenuClose,
		onInputChange: userOnInputChange,
		inputValue: userInputValue,
		isSearchable: isSearchableProp,
		...rest
	} = props;

	const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(max-width: 768px)').matches;
	});
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [mobileSearchInput, setMobileSearchInput] = useState('');

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const mediaQuery = window.matchMedia('(max-width: 768px)');

		const handleViewportChange = (event: MediaQueryListEvent) => {
			setIsMobileViewport(event.matches);
		};

		setIsMobileViewport(mediaQuery.matches);
		mediaQuery.addEventListener('change', handleViewportChange);

		return () => {
			mediaQuery.removeEventListener('change', handleViewportChange);
		};
	}, []);

	useEffect(() => {
		if (!isMobileViewport || !isMenuOpen || typeof document === 'undefined') return;

		const bodyStyle = document.body.style;
		const htmlStyle = document.documentElement.style;
		const previousOverflow = bodyStyle.overflow;
		const previousHtmlOverflow = htmlStyle.overflow;
		const previousHtmlOverscroll = htmlStyle.overscrollBehavior;
		const previousBodyOverscroll = bodyStyle.overscrollBehavior;

		bodyStyle.overflow = 'hidden';
		bodyStyle.overscrollBehavior = 'none';
		htmlStyle.overflow = 'hidden';
		htmlStyle.overscrollBehavior = 'none';

		return () => {
			bodyStyle.overflow = previousOverflow;
			bodyStyle.overscrollBehavior = previousBodyOverscroll;
			htmlStyle.overflow = previousHtmlOverflow;
			htmlStyle.overscrollBehavior = previousHtmlOverscroll;
		};
	}, [isMobileViewport, isMenuOpen]);

	const { textColor } = useColorIntensity(colorIntensity);

	const selectVariant: {
		[key in TSelectVariant]: {
			control: string;
			controlFocus: string;
			validation: string;
			validationFocus: string;
		};
	} = {
		solid: {
			control: classNames(
				// Default
				[`${borderWidth} border-zinc-300 dark:border-zinc-700`],
				'bg-white dark:bg-zinc-900',
				'w-full',
				'text-black dark:text-white',
				themeConfig.transition,
				[`${rounded}`],
				{
					'!bg-zinc-100 !text-zinc-600 dark:!bg-zinc-800/50 dark:!text-zinc-400 !border-zinc-200 dark:!border-zinc-700 cursor-not-allowed':
						disabled,
				},
				// Hover
				[`hover:border-${color}-${colorIntensity}`],
				[`dark:hover:border-${color}-${colorIntensity}`],
			),
			controlFocus: classNames(
				{
					'!border-zinc-300 dark:!border-zinc-800': isValid,
				},
				'!bg-transparent dark:!bg-transparent',
			),
			validation: classNames({
				'!border-red-500 ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'!border-green-500': !isValid && isTouched && !invalidFeedback,
			}),
			validationFocus: classNames({
				'!ring-4 !ring-green-500/30': !isValid && isTouched && !invalidFeedback,
			}),
		},
	};

	const selectControlVariantClasses = selectVariant[variant as TSelectVariant].control;
	const selectControlFocusVariantClasses = selectVariant[variant as TSelectVariant].controlFocus;
	const selectControlValidationsClasses = selectVariant[variant as TSelectVariant].validation;
	const selectControlValidationFocusClasses =
		selectVariant[variant as TSelectVariant].validationFocus;

	const selectDimensions: { [key in TSelectDimension]: { control: string } } = {
		sm: { control: classNames('!min-h-[2rem] text-sm') },
		default: { control: classNames('!min-h-[2.5rem]') },
		lg: { control: classNames('!min-h-[3rem] text-lg') },
		xl: { control: classNames('!min-h-[3.25rem] text-xl') },
	};
	const selectDimensionClasses = selectDimensions[dimension].control;

	const { roundedCustom } = useRoundedSize(rounded);

	const handleChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
		actionMeta?: ActionMeta<TSelectOption>,
	) => {
		if (!isMulti && newValue && !Array.isArray(newValue)) {
			const option = newValue as TSelectOption;
		} else if (isMulti && Array.isArray(newValue)) {
			newValue.forEach((option) => {
				const opt = option as TSelectOption;
			});
		}
		if (typeof userOnChange === 'function') {
			userOnChange(newValue, actionMeta);
		}

		if (isMobileViewport && !isMulti) {
			setIsMobileMenuOpen(false);
			setIsMenuOpen(false);
			setMobileSearchInput('');
			userOnMenuClose?.();
		}
	};

	const handleMenuOpen = () => {
		setIsMenuOpen(true);
		if (isMobileViewport) {
			setIsMobileMenuOpen(true);
		}
		userOnMenuOpen?.();
	};

	const handleMenuClose = () => {
		if (isMobileViewport) {
			return;
		}
		setIsMenuOpen(false);
		setMobileSearchInput('');
		userOnMenuClose?.();
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
		setIsMenuOpen(false);
		setMobileSearchInput('');
		userOnMenuClose?.();
	};

	const handleInputChange = (value: string, actionMeta: any) => {
		if (isMobileViewport) {
			setMobileSearchInput(value);
		}

		if (typeof userOnInputChange === 'function') {
			return userOnInputChange(value, actionMeta);
		}

		return value;
	};

	const effectiveInputValue = isMobileViewport
		? (userInputValue ?? mobileSearchInput)
		: userInputValue;

	const computedIsSearchable = isSearchableProp ?? true;

	const mobileComponents = useMemo(() => {
		if (!isMobileViewport) {
			return baseComponents;
		}
		return {
			...baseComponents,
			Menu: (menuProps: MenuProps<TSelectOption, boolean, GroupBase<TSelectOption>>) => (
				<>
					<div
						className='fixed inset-0 z-[1999] bg-black/40'
						onMouseDown={(event) => {
							event.preventDefault();
							closeMobileMenu();
						}}
					/>
					<ReactSelectComponents.Menu {...menuProps}>
						<div className='border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'>
							<input
								ref={mobileInputRef}
								type='text'
								value={effectiveInputValue ?? ''}
								onChange={(event) => {
									handleInputChange(event.target.value, {
										action: 'input-change',
									});
								}}
								onMouseDown={(event) => event.stopPropagation()}
								onClick={(event) => {
									event.stopPropagation();
									// blur y focus para forzar que el SO vuelva a abrir el teclado
									mobileInputRef.current?.blur();
									setTimeout(() => {
										mobileInputRef.current?.focus();
									}, 50);
								}}
								onTouchStart={(event) => event.stopPropagation()}
								onTouchEnd={(event) => event.stopPropagation()}
								placeholder='Buscar opcion...'
								className='w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
							/>
						</div>
						{menuProps.children}
					</ReactSelectComponents.Menu>
				</>
			),
			MenuList: (
				menuListProps: MenuListProps<TSelectOption, boolean, GroupBase<TSelectOption>>,
			) => (
				<div
					onWheel={(event) => event.stopPropagation()}
					onTouchMove={(event) => event.stopPropagation()}>
					<ReactSelectComponents.MenuList {...menuListProps} />
				</div>
			),
		};
	}, [isMobileViewport, effectiveInputValue, closeMobileMenu, handleInputChange]);

	const composedStyles = useMemo<
		StylesConfig<TSelectOption, boolean, GroupBase<TSelectOption>> | undefined
	>(() => {
		const customStyles = rest.styles;

		if (!isMobileViewport) {
			// En desktop renderizamos el menú en un portal a document.body para
			// evitar que quede recortado/detrás por contenedores con overflow o
			// stacking contexts (cards, modales, etc.). Necesita z-index alto.
			return {
				...customStyles,
				menuPortal: (base, state) => {
					const desktopBase = { ...base, zIndex: 9999 };
					return customStyles?.menuPortal
						? customStyles.menuPortal(desktopBase, state)
						: desktopBase;
				},
			};
		}

		return {
			...customStyles,
			menuPortal: (base, state) => {
				const mobileBase = {
					...base,
					zIndex: 2000,
				};
				return customStyles?.menuPortal
					? customStyles.menuPortal(mobileBase, state)
					: mobileBase;
			},
			menu: (base, state) => {
				const mobileBase = {
					...base,
					position: 'fixed' as const,
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					marginTop: 0,
					width: 'min(92vw, 32rem)',
					maxHeight: '72vh',
					overflow: 'hidden',
					borderRadius: '0.75rem',
					boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
					zIndex: 2001,
				};
				return customStyles?.menu ? customStyles.menu(mobileBase, state) : mobileBase;
			},
			menuList: (base, state) => {
				const mobileBase = {
					...base,
					maxHeight: '62vh',
					overflowY: 'auto' as const,
					overflowX: 'hidden' as const,
					overscrollBehavior: 'contain' as const,
					WebkitOverflowScrolling: 'touch' as const,
				};
				return customStyles?.menuList
					? customStyles.menuList(mobileBase, state)
					: mobileBase;
			},
		};
	}, [isMobileViewport, rest.styles]);

	const computedMenuPortalTarget =
		rest.menuPortalTarget ?? (typeof document !== 'undefined' ? document.body : undefined);

	const computedMenuPosition = rest.menuPosition ?? (isMobileViewport ? 'fixed' : 'absolute');
	const computedMenuIsOpen = isMobileViewport ? isMobileMenuOpen : undefined;

	const computedIsDisabled = disabled || Boolean(isDisabledProp);

	const reactSelectProps = {
		...rest,
		inputId: inputId ?? id ?? name,
		id,
		'data-component-name': 'Select',
		unstyled: true,
		components: mobileComponents,
		classNames: {
			control: (state: ControlProps): string =>
				classNames(
					'py-0.5 px-1.5',
					selectControlVariantClasses,
					{
						[`${selectControlFocusVariantClasses}`]: state.isFocused,
					},
					selectControlValidationsClasses,
					{
						[`${selectControlValidationFocusClasses}`]: state.isFocused,
					},
					selectDimensionClasses,
					themeConfig.transition,
					className,
				),
			option: (state: OptionPropsExtend): string =>
				classNames(
					'px-1.5 py-1.5 cursor-pointer',
					'text-zinc-900 dark:text-zinc-100',
					themeConfig.transition,
					{
						'bg-zinc-200 dark:bg-zinc-700': state.isFocused,
						'opacity-50 cursor-not-allowed': state?.data?.isDisabled,
					},
				),
			menu: () =>
				classNames(
					'bg-white dark:bg-zinc-900',
					'border border-zinc-200 dark:border-zinc-700',
					'overflow-hidden shadow-lg z-[1000]',
					[`${rounded}`],
				),
			menuList: () => classNames('py-1 max-h-60 overflow-y-auto'),
			noOptionsMessage: () =>
				classNames('px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400'),
			group: () => classNames('border-zinc-500/25', '[&:not(:last-child)]:border-b'),
			groupHeading: () =>
				classNames(
					'font-semibold',
					'px-1.5',
					'pt-1.5',
					'pb-0.5',
					'text-zinc-700 dark:text-zinc-300',
				),
			placeholder: () => classNames('text-black/50', 'dark:text-white/50'),
			indicatorSeparator: () => classNames('rounded', '!bg-zinc-500/50'),
			multiValue: (state: MultiValuePropsExtends): string =>
				classNames(
					`bg-${color}-${colorIntensity}`,
					'm-0.5',
					'ltr:pl-1 rtl:pr-1',
					[`${textColor}`],
					[`${roundedCustom(-2)}`],
					{
						'ltr:pr-1 rtl:pl-1': state?.data?.isFixed,
					},
				),
			multiValueRemove: (state: MultiValueRemovePropsExtend): string =>
				classNames('hover:bg-red-500', [`${roundedCustom(-2)}`], themeConfig.transition, {
					'!hidden': state?.data?.isFixed,
					'opacity-50 pointer-events-none': state?.data?.isDisabled,
				}),
		} as ClassNamesConfig<TSelectOption, boolean, GroupBase<TSelectOption>>,
		isDisabled: computedIsDisabled,
		isMulti,
		isSearchable: computedIsSearchable,
		inputValue: effectiveInputValue,
		menuPortalTarget: computedMenuPortalTarget,
		menuPosition: computedMenuPosition,
		menuIsOpen: computedMenuIsOpen,
		menuShouldBlockScroll: isMobileViewport,
		captureMenuScroll: true,
		menuShouldScrollIntoView: false,
		styles: composedStyles,
		onMenuOpen: handleMenuOpen,
		onMenuClose: handleMenuClose,
		onInputChange: handleInputChange,
		onChange: handleChange,
	};

	if (isCreatable) return <CreatableSelect {...reactSelectProps} />;
	return <ReactSelect {...reactSelectProps} />;
};

SelectReact.displayName = 'Select';

export default SelectReact;
