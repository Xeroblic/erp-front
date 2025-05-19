// src/App.tsx
import React from "react";
import { BrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import colors from "tailwindcss/colors";
import { ToastContainer } from "react-toastify";

import AppRouter from "@/routes/AppRouter";
import DefaultAsideTemplate from "@/templates/layouts/Asides/DefaultAside.template";
import { selectIsAuthenticated } from "@/store/slices/auth/authSlice";
import useFontSize from "@/hooks/useFontSize";
import useDarkMode from "@/hooks/useDarkMode";
import getOS from "@/utils/getOS.util";
import AsideRouter from "@/components/router/AsideRouter";
import Wrapper from "@/components/layouts/Wrapper/Wrapper";
import HeaderRouter from "@/components/router/HeaderRouter";
import ContentRouter from "@/components/router/ContentRouter";
import FooterRouter from "@/components/router/FooterRouter";

dayjs.extend(localizedFormat);

const App: React.FC = () => {
  getOS();
  const { fontSize } = useFontSize();
  const { isDarkTheme } = useDarkMode();
//   const isAuth = useSelector(selectIsAuthenticated);

//   if (!isAuth) {
//     return <Navigate to="/login" replace />;
//   }
	return (
		<>
			<ToastContainer theme={isDarkTheme ? 'dark' : 'light'} draggable></ToastContainer>
			<style>{`:root {font-size: ${fontSize}px;
			--toastify-toast-bd-radius: 0.75rem;
			--toastify-color-dark:  ${colors.zinc['800']};
			--toastify-color-info: ${colors.blue['500']};
			--toastify-color-success: ${colors.emerald['500']};
			--toastify-color-warning: ${colors.amber['500']};
			--toastify-color-error: ${colors.red['500']};
			--toastify-color-progress-light: linear-gradient(
				to right,
    			${colors.blue['500']},
    			${colors.emerald['500']},
    			${colors.amber['500']},
				${colors.red['500']});`}</style>
			<div data-component-name='App' className='flex grow flex-col'>
				<AsideRouter />
				<Wrapper>
					<HeaderRouter />
					<ContentRouter />
					<FooterRouter />
				</Wrapper>
			</div>
		</>
	);
};

export default App;
