import { RouteProps } from "react-router-dom";
import DefaultFooterTemplate from "../templates/layouts/Footers/DefaultFooter.template";
import { authPages } from "../config/pages.config";

const footerRoutes: RouteProps[] = [
  { path: authPages.loginPage.to,               element: null },
  { path: authPages.aceptarInvitacion.to,element: null },
  { path: authPages.recuperarPassword.to,       element: null },
  { path: authPages.confirmarNuevaPass.to,      element: null },
  { path: "*",                                  element: <DefaultFooterTemplate /> },
];

export default footerRoutes;
