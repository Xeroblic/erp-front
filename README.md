[![Netlify Status](https://api.netlify.com/api/v1/badges/42118bfb-c41b-4015-9ae8-cf2c725a6dd2/deploy-status)](https://app.netlify.com/sites/fyr-react/deploys)

# Fyr | React TypeScript Tailwind Admin & AI Chat Template

[![Fyr | React TypeScript Tailwind Admin & AI Chat Template](./src/assets/Cover.png)](https://fyr.omtanke.studio)

# Empezando con Vite

Este proyecto fue creado con [Vite](https://github.com/vitejs/vite) y [TailwindCSS](https://github.com/tailwindlabs/tailwindcss).

## Instalar Dependencias

### `npm install` o `yarn install`

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

### `npm run dev` o `yarn dev`

Ejecuta la aplicación en modo de desarrollo.\
Abre [http://localhost:5174](http://localhost:5174) para verlo en el navegador.

La página se recargará si haces ediciones.\
También verás cualquier error de lint en la consola.

### `npm run build` o `yarn build`

Construye la aplicación para producción en la carpeta `build`.\
Empaqueta correctamente React en modo de producción y optimiza la construcción para el mejor rendimiento.

La construcción está minificada y los nombres de archivo incluyen los hashes.\
¡Tu aplicación está lista para ser desplegada!

### `npm run lint` o `yarn run lint`

Controla el proyecto según las reglas de Eslint.

### `npm run lint:fix` o `yarn run lint:fix`

Inspecciona el proyecto según las reglas de Eslint y las corrige según esas reglas.

### `npm run prettier:fix` o `yarn run prettier:fix`

Inspecciona el proyecto según las reglas de Prettier y las corrige según esas reglas.

### `npm run icon` o `yarn run icon`

Prepara iconos en formato svg en la carpeta `SvgIcons` para su uso en el proyecto. Nombra el icono en formato `PascalCase`.

## Aprende Más

Puedes aprender más en la [documentación de Vite React](https://vitejs.dev/guide/).

Para aprender React, consulta la [documentación de React](https://reactjs.org/).

# Estructura del Proyecto

```
fyr
├── public
├── src
│   ├── App
│   ├── assets
│   ├── components
│   ├── config
│   │   ├── pages.config.ts
│   │   └── theme.config.ts
│   ├── constants
│   ├── context
│   ├── hooks
│   ├── interface
│   ├── locales
│   ├── mocks
│   ├── pages
│   ├── routes
│   │   ├── asideRoutes.tsx
│   │   ├── contentRoutes.tsx
│   │   ├── footerRoutes.tsx
│   │   └── headerRoutes.tsx
│   ├── styles
│   ├── templates
│   ├── types
│   ├── utils
│   ├── declaration.d.ts
│   ├── i18n.ts
│   ├── index.tsx
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   └── setupTests.ts
├── SvgIcons
├── .eslintignore
├── .eslintrc.json
├── .gitattributes
├── .gitignore
├── .npmrc
├── .prettierignore
├── .svgrc
├── index.html
├── package.json
├── postcss.config.js
├── prettier.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.eslint.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

# Configuración de Tailwind

Hay 22 colores definidos en Tailwind, hemos añadido 8 (zinc `#71717a`, rojo `#ef4444`, ámbar `#f59e0b`, lima `#84cc16`, esmeralda `#10b981`, cielo `#0ea5e9`, azul `#3b82f6`, violeta `#8b5cf6`) de ellos para los componentes de Fyr. Si lo deseas, puedes activar otros colores o definir nuevos colores.

Puedes añadir nuevos valores a "TColors" en el archivo [src/types/colors.type.ts](src/types/colors.type.ts) para su uso en el proyecto y no olvides añadirlos a la [safelist](https://tailwindcss.com/docs/content-configuration#safelisting-classes).

# Configuración del Tema

Puedes editar la configuración del tema en el archivo [src/config/theme.config.ts](src/config/theme.config.ts).

# Configuración de Páginas

```tsx
export const examplePages = {
	parentPage: {
		id: 'parentPage',
		to: '/parent-page',
		text: 'Parent Page',
		icon: 'HeroBookOpen',
		subPages: {
			childPage1: {
				id: 'childPage',
				to: '/parent-page/child-page',
				text: 'Child Page',
				icon: 'HeroBookOpen',
			},
			childPage2: {
				id: 'childPage2',
				to: '/parent-page/child-page-2',
				text: 'Child Page 2',
				icon: 'HeroBookOpen',
			},
		},
	},
};
```

Si guardas la información de tu página en el formato anterior en el archivo [src/config/pages.config.ts](src/config/pages.config.ts), puedes usarla fácilmente en los menús.

# Arquitectura del Proyecto

## src/index.tsx

```tsx
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<ThemeContextProvider>
			<BrowserRouter>
				<AuthProvider>
					<App />
				</AuthProvider>
			</BrowserRouter>
		</ThemeContextProvider>
	</React.StrictMode>,
);
```

### src/App/App.tsx

```tsx
return (
	<div data-component-name='App' className='flex grow flex-col'>
		<AsideRouter />
		<Wrapper>
			<HeaderRouter />
			<ContentRouter />
			<FooterRouter />
		</Wrapper>
	</div>
);
```

#### src/components/router/AsideRouter.tsx

Si no deseas personalizar el proyecto en este archivo, no necesitas hacer ningún cambio. En este componente, solo el archivo [src/routes/asideRoutes.tsx](src/routes/asideRoutes.tsx) establece qué componente se mostrará en qué ruta.

```tsx
const asideRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: null },
	{ path: '*', element: <DefaultAsideTemplate /> },
];
```

Puedes establecer las "Plantillas de Aside" para que se muestren en las rutas que desees. Si no deseas ningún "Aside" en una ruta, puedes establecer el elemento en `null`.

#### src/components/router/HeaderRouter.tsx

Si no deseas personalizar el proyecto en este archivo, no necesitas hacer ningún cambio. En este componente, solo el archivo [src/routes/headerRoutes.tsx](src/routes/headerRoutes.tsx) establece qué componente se mostrará en qué ruta.

```tsx
const headerRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: null },
	{
		path: `${componentsPages.uiPages.to}/*`,
		element: <ComponentAndTemplateHeaderTemplate />,
	},
	{ path: '', element: null },
	{ path: '*', element: <DefaultHeaderTemplate /> },
];
```

Puedes establecer las "Plantillas de Header" para que se muestren en las rutas que desees. Si no deseas ningún "Header" en una ruta, puedes establecer el elemento en `null`.

Si tendrás datos sobre la página en "Header", especifica que no habrá ningún "Header" en esa ruta con `null` y defínelo dentro de la página. Así no tendrás que preocuparte por mover los datos hacia arriba.

#### src/components/router/ContentRouter.tsx

Puedes usar [React Lazy](https://react.dev/reference/react/lazy#lazy) al importar páginas.

```tsx
const contentRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: <LoginPage /> },
	{ path: authPages.profilePage.to, element: <ProfilePage /> },
	{ path: examplePages.duotoneIconsPage.to, element: <IconsPage /> },
	{ path: '*', element: <NotFoundPage /> },
];
```

##### Página de Ejemplo

```tsx
import React from 'react';
import PageWrapper from '../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../components/layouts/Subheader/Subheader';
import Container from '../components/layouts/Container/Container';

const ExamplePage = () => {
	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>SubheaderLeft</SubheaderLeft>
				<SubheaderRight>SubheaderRight</SubheaderRight>
			</Subheader>
			<Container>Container</Container>
		</PageWrapper>
	);
};

export default ExamplePage;
```

Puedes usar este método en páginas donde establezcas el valor nulo para "Header" como se describe en la sección [src/routes/headerRoutes.tsx](#srccomponentsrouterheaderroutertsx).

```tsx
import React from 'react';
import Header, { HeaderLeft, HeaderRight } from '../components/layouts/Header/Header';
import PageWrapper from '../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../components/layouts/Subheader/Subheader';
import Container from '../components/layouts/Container/Container';

const ExamplePage = () => {
	return (
		<>
			<Header>
				<HeaderLeft>HeaderLeft</HeaderLeft>
				<HeaderRight>HeaderRight</HeaderRight>
			</Header>
			<PageWrapper>
				<Subheader>
					<SubheaderLeft>SubheaderLeft</SubheaderLeft>
					<SubheaderRight>SubheaderRight</SubheaderRight>
				</Subheader>
				<Container>Container</Container>
			</PageWrapper>
		</>
	);
};

export default ExamplePage;
```

#### src/components/router/FooterRouter.tsx

Si no deseas personalizar el proyecto en este archivo, no necesitas hacer ningún cambio. En este componente, solo el archivo [src/routes/footerRoutes.tsx](src/routes/footerRoutes.tsx) establece qué componente se mostrará en qué ruta.

```tsx
const footerRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: null },
	{ path: '*', element: <DefaultFooterTemplate /> },
];
```

Puedes establecer las "Plantillas de Footer" para que se muestren en las rutas que desees. Si no deseas ningún "Footer" en una ruta, puedes establecer el elemento en `null`.

Si tendrás datos sobre la página en "Footer", especifica que no habrá ningún "Footer" en esa ruta con `null` y defínelo dentro de la página. Así no tendrás que preocuparte por mover los datos hacia arriba.

