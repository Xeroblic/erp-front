# Zentria ERP Frontend - AI Coding Instructions

## Project Overview

This is a **React 18 + TypeScript** ERP frontend built with **Vite**, **Redux Toolkit**, and **Tailwind CSS**. The app features a comprehensive UI component system, role-based authentication, and modular architecture.

## Architecture Patterns

### Component System Hierarchy

-   **UI Components**: Use the structured component system in `src/components/ui/`
    -   **Modals**: Always use `Modal` → `ModalHeader` → `ModalBody` → `ModalFooter` → `ModalFooterChild`
    -   **Cards**: Structure content with `Card` → `CardHeader` → `CardBody` → `CardFooter`
    -   **Tables**: Use `Table` → `THead` → `TBody` components instead of native HTML

### Form Architecture

-   **Never use native HTML form elements** (`<input>`, `<select>`, `<textarea>`)
-   **Required imports**: Import from `src/components/form/`:
    ```tsx
    import Input from '@/components/form/Input';
    import SelectReact from '@/components/form/SelectReact';
    import Textarea from '@/components/form/Textarea';
    import Checkbox from '@/components/form/Checkbox';
    import Label from '@/components/form/Label';
    import Validation from '@/components/form/Validation';
    ```
-   **SelectReact Pattern**: Always use typed options

    ```tsx
    import { TSelectOption, TSelectOptions } from '@/types/select.type';

    const options: TSelectOptions = [{ value: 'val', label: 'Label' }];

    <SelectReact<TSelectOption>
    	options={options}
    	value={options.find((opt) => opt.value === formik.values.field)}
    	onChange={(selectedOption) => {
    		const option = selectedOption as TSelectOption;
    		formik.setFieldValue('field', option?.value || '');
    	}}
    	isValid={formik.isValid}
    	isTouched={!!formik.touched.field}
    	invalidFeedback={formik.errors.field}
    />;
    ```

### Form Validation Pattern (Formik + Yup)

```tsx
// All form components support validation props:
<Input
	name='fieldName'
	value={formik.values.fieldName}
	onChange={formik.handleChange}
	onBlur={formik.handleBlur}
	isValid={formik.isValid}
	isTouched={!!formik.touched.fieldName}
	invalidFeedback={formik.errors.fieldName}
/>
```

### State Management (Redux Toolkit)

-   **Store structure**: `src/store/slices/` - each module has its own slice
-   **Authentication**: Always use hooks from `src/store/`:
    ```tsx
    import { useAppDispatch, useAppSelector } from '@/store';
    const { isAuthenticated, access } = useAppSelector((state) => state.auth);
    ```
-   **API calls**: Use `ApiService.fetchData()` or `ApiService.fetchNormalized()`

### Route Protection

-   **Protected routes**: Wrap with authorization components from `src/components/authorization/`
-   **Route config**: Define in `src/routes/contentRoutes.tsx` with lazy loading
-   **Page config**: Authority requirements in `src/config/pages.config.ts`

## Development Workflow

### Key Commands

-   `npm run dev` - Start development server (typically runs on port 5174)
-   `npm run build` - TypeScript compilation + Vite build
-   `npm run lint` - ESLint check
-   `npm run lint:fix` - Auto-fix linting issues
-   `npm run prettier:fix` - Format code
-   `npm run icon` - Process SVG icons from `SvgIcons/` folder

### File Structure Conventions

-   **Pages**: `src/pages/[module]/[PageName].tsx`
-   **Components**: `src/pages/[module]/components/` for page-specific components
-   **Modals**: `src/pages/[module]/modals/` or `src/pages/[module]/components/modals/`
-   **Tables**: `src/pages/[module]/tables/` for data tables
-   **API services**: Use `src/services/ApiService.ts` - never direct axios

### API Integration

-   **BaseService**: Handles auth tokens, refresh logic, request cancellation
-   **Pattern**:
    ```tsx
    const response = await ApiService.fetchData<ResponseType>({
    	url: '/endpoint',
    	method: 'post',
    	data: payload,
    });
    ```
-   **Error handling**: Automatic token refresh, toast notifications built-in

## Design System Rules

### Color Guidelines (CRITICAL)

-   **Never use custom colors** in complete UI components except:
    -   Action buttons (`bg-blue-600`, `bg-green-600`, `bg-red-600`)
    -   Status badges and alerts
    -   Process state indicators
    -   State-dependent elements (active/inactive states, progress indicators)
-   **Form elements**: Only use `focus:ring-gray-500` for focus states
-   **Neutral palette**: `bg-white`, `bg-gray-50`, `border-gray-300`, `text-gray-900`
-   **State colors allowed**: Colors for representing states, status, or conditions are permitted
    }

### Icon Usage (CRITICAL)

-   **Never use emojis** in the UI
-   **Always use project icons** from `src/components/icon/`
-   **Icon import pattern**:

    ```tsx
    import Icon from '@/components/icon/Icon';

    // Usage
    <Icon icon='HeroIconName' className='size-5' />;
    ```

-   **Available icons**: Check `src/components/icon/` directory for all available icons
-   **Consistent sizing**: Use Tailwind size classes (`size-4`, `size-5`, `size-6`, etc.)

### Component Migration

-   Replace `<select>` → `<SelectReact>`
-   Replace `<textarea>` → `<Textarea>`
-   Replace `<input>` → `<Input>`
-   Replace modal divs → `<Modal>` system
-   Replace table HTML → `<Table>` system

## Common Patterns

### Page Structure

```tsx
// Standard page layout
<PageWrapper>
	<Subheader>
		<SubheaderLeft>
			<Breadcrumb />
		</SubheaderLeft>
		<SubheaderRight>
			<Button>Actions</Button>
		</SubheaderRight>
	</Subheader>

	<Container>
		<Card>
			<CardBody>{/* Page content */}</CardBody>
		</Card>
	</Container>
</PageWrapper>
```

### Modal with Form

```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalHeader>
    <ModalTitle>Form Title</ModalTitle>
  </ModalHeader>

  <Formik initialValues={...} validationSchema={...} onSubmit={...}>
    {(formik) => (
      <Form>
        <ModalBody>
          <Card>
            <CardHeader>
              <CardTitle>Section Title</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Form fields */}
            </CardBody>
          </Card>
        </ModalBody>

        <ModalFooter>
          <ModalFooterChild>
            <Button color="red" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </ModalFooterChild>
        </ModalFooter>
      </Form>
    )}
  </Formik>
</Modal>
```

## Critical Files

-   `src/App/App.tsx` - App initialization
-   `src/services/BaseService.ts` - HTTP client with auth
-   `src/store/slices/auth/authSlice.ts` - Authentication logic
-   `DESIGN_GUIDELINES.md` - Color and design rules
-   `Doc/DOCUMENTACION_COMPONENTES_UI.md` - Complete UI component guide

## TypeScript Integration

-   All components are fully typed
-   Use interfaces from `src/interface/` for API data
-   Form types often use `TSelectOption` for select options
-   Redux state is fully typed via `RootState`
