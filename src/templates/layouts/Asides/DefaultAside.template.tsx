// src/components/layouts/Aside/DefaultAsideTemplate.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Aside, { AsideBody } from "@/components/layouts/Aside/Aside";
import Nav, { NavItem, NavCollapse, NavSeparator } from '../../../components/layouts/Navigation/Nav';
import pagesConfig from "@/config/pages.config";
import { useAppSelector } from "@/store";
import { selectUserAuthority } from "@/store/slices/auth/authSlice";
import { selectFeaturesList } from "@/store/slices/featuresSlice/featuresSlice";
import AsideHeadPart from "./_parts/AsideHead.part";
import AsideFooterPart from "./_parts/AsideFooter.part";
import { featuresApi } from "@/services/RtkQueryService";
import { hasPermission } from "@/utils/permissions";

// Componente guard que chequea permiso + feature
interface GuardProps { authority?: string[]; feature?: string; }



// DefaultAsideTemplate.tsx  (o crea un helper aparte)
const matchPermission = (required: string, granted: string[]) => {
  // 1. Super admin siempre pasa
  if (granted.includes('super-admin') || granted.includes('super_admin')) return true;

  // 2. Wildcard "prefijo:*"
  if (required.endsWith(':*')) {
    const prefix = required.slice(0, -2);          // 'empresa:*' -> 'empresa'
    return granted.some(p => p.startsWith(prefix));
  }

  // 3. Coincidencia exacta
  return granted.includes(required);
};



const AuthorityFeatureGuard: React.FC<GuardProps & { children: React.ReactNode }> = ({
  authority = [],
  feature,
  children,
}) => {
  const userPerms = useAppSelector(selectUserAuthority);
  const userFeats = useAppSelector(selectFeaturesList);

  const okPerm =
    authority.length === 0 || authority.some(req => hasPermission(req, userPerms));

  const okFeat = !feature || userFeats.includes(feature);

  return okPerm && okFeat ? <>{children}</> : null;
};






function DefaultAsideTemplate() {

  const { data: feats = [], isLoading } = featuresApi.useGetFeaturesQuery();

  const navigate = useNavigate();
  const cfg = pagesConfig as any;	
  if (isLoading) return <Aside>…Loading…</Aside>;
	return (
		<Aside>
			<AsideHeadPart />
			<AsideBody>
				<Nav>
					{/* Dashboard */}
					<AuthorityFeatureGuard
						authority={cfg.dashboard.authority}
						feature={cfg.dashboard.feature}
					>
						<NavItem {...cfg.dashboard} onClick={() => navigate(cfg.dashboard.to)} />
					</AuthorityFeatureGuard>

					{/* Gestión */}
					<NavCollapse text="Gestión" icon={cfg.manage.icon} to="">
						{Object.values(cfg.manage.subPages).map((pg: any) => (
							<AuthorityFeatureGuard
								key={pg.id}
								authority={pg.authority}
								feature={pg.feature}
							>
								<NavItem {...pg} onClick={() => navigate(pg.to)} />
							</AuthorityFeatureGuard>
						))}
					</NavCollapse>





					{/* <AuthorityCheckNav authority={Pages.listaItem.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaItem.text} to={Pages.listaItem.to} icon={Pages.listaItem.icon} id={Pages.listaItem.id}></NavItem>
					</AuthorityCheckNav> */}
					{/* <AuthorityCheckNav authority={Pages.listaProveedoresEmpresa.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaProveedoresEmpresa.text} to={Pages.listaProveedoresEmpresa.to} icon={Pages.listaProveedoresEmpresa.icon} id={Pages.listaProveedoresEmpresa.id}></NavItem>
					</AuthorityCheckNav>
					<AuthorityCheckNav authority={Pages.listaItemsEmpresa.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaItemsEmpresa.text} to={Pages.listaItemsEmpresa.to} icon={Pages.listaItemsEmpresa.icon} id={Pages.listaItemsEmpresa.id}></NavItem>
					</AuthorityCheckNav>
					<AuthorityCheckNav authority={Pages.listaBodegas.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaBodegas.text} to={Pages.listaBodegas.to} icon={Pages.listaBodegas.icon} id={Pages.listaBodegas.id}></NavItem>
					</AuthorityCheckNav>
					<AuthorityCheckNav authority={Pages.listaOrdenesCompra.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaOrdenesCompra.text} to={Pages.listaOrdenesCompra.to} icon={Pages.listaOrdenesCompra.icon} id={Pages.listaOrdenesCompra.id}></NavItem>
					</AuthorityCheckNav> */}
					{/* <NavTitle>Registros</NavTitle> */}
					{/* <NavCollapse text="Registro" icon="HeroDocumentText" to={''}>
						<AuthorityCheckNav authority={Pages.listaCategorias.authority} userAuthority={listaGrupos?.grupos}>
							<NavItem text="Lista Categorías" to={Pages.listaCategorias.to} />
						</AuthorityCheckNav>
						<AuthorityCheckNav authority={Pages.listaFabricantes.authority} userAuthority={listaGrupos?.grupos}>
							<NavItem text="Lista Fabricantes" to={Pages.listaFabricantes.to} />
						</AuthorityCheckNav>
					</NavCollapse>
					<AuthorityCheckNav authority={Pages.listaClientes.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaClientes.text} to={Pages.listaClientes.to} icon={Pages.listaClientes.icon} id={Pages.listaClientes.id}></NavItem>
					</AuthorityCheckNav> */}
					{/* <NavItem {...appPages.salesAppPages.subPages.salesDashboardPage} />
					<NavItem {...appPages.aiAppPages.subPages.aiDashboardPage}>
						<Badge
							variant='outline'
							color='amber'
							className='border-transparent leading-none'>
							NEW
						</Badge>
					</NavItem>
					<NavItem {...appPages.crmAppPages.subPages.crmDashboardPage}>
						<NavButton
							title='New Customer'
							icon='HeroPlusCircle'
							onClick={() => {
								navigate(`../${appPages.crmAppPages.subPages.customerPage.to}/new`);
							}}
						/>
					</NavItem>
					<NavItem {...appPages.projectAppPages.subPages.projectDashboardPage}>
						<Badge
							variant='outline'
							color='emerald'
							className='border-transparent leading-none'>
							6
						</Badge>
					</NavItem>

					<NavTitle>Apps</NavTitle>
					<NavCollapse
						text={appPages.salesAppPages.text}
						to={appPages.salesAppPages.to}
						icon={appPages.salesAppPages.icon}>
						<NavItem {...appPages.salesAppPages.subPages.salesDashboardPage} />
						<NavCollapse
							text={appPages.salesAppPages.subPages.productPage.text}
							to={appPages.salesAppPages.subPages.productPage.to}
							icon={appPages.salesAppPages.subPages.productPage.icon}>
							<NavItem
								{...appPages.salesAppPages.subPages.productPage.subPages.listPage}
							/>
							<NavItem
								{...appPages.salesAppPages.subPages.productPage.subPages.editPage}
							/>
						</NavCollapse>
						<NavCollapse
							text={appPages.salesAppPages.subPages.categoryPage.text}
							to={appPages.salesAppPages.subPages.categoryPage.to}
							icon={appPages.salesAppPages.subPages.categoryPage.icon}>
							<NavItem
								{...appPages.salesAppPages.subPages.categoryPage.subPages.listPage}
							/>
							<NavItem
								{...appPages.salesAppPages.subPages.categoryPage.subPages.editPage}
							/>
						</NavCollapse>
					</NavCollapse>

					<NavCollapse
						text={appPages.aiAppPages.text}
						to={appPages.aiAppPages.to}
						icon={appPages.aiAppPages.icon}>
						<NavItem {...appPages.aiAppPages.subPages.aiDashboardPage} />
						<NavCollapse
							text={appPages.aiAppPages.subPages.chatPages.text}
							to={appPages.aiAppPages.subPages.chatPages.to}
							icon={appPages.aiAppPages.subPages.chatPages.icon}>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.photoPage}>
								<Badge
									variant='outline'
									color='amber'
									className='border-transparent leading-none'>
									22
								</Badge>
							</NavItem>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.videoPage}>
								<Badge
									variant='outline'
									color='violet'
									className='!border-transparent leading-none'>
									8
								</Badge>
							</NavItem>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.audioPage}>
								<Badge
									variant='outline'
									color='blue'
									className='!border-transparent leading-none'>
									13
								</Badge>
							</NavItem>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.codePage}>
								<Badge
									variant='outline'
									color='emerald'
									className='!border-transparent leading-none'>
									3
								</Badge>
							</NavItem>
						</NavCollapse>
					</NavCollapse>

					<NavCollapse
						text={appPages.crmAppPages.text}
						to={appPages.crmAppPages.to}
						icon={appPages.crmAppPages.icon}>
						<NavItem {...appPages.crmAppPages.subPages.crmDashboardPage} />
						<NavCollapse
							text={appPages.crmAppPages.subPages.customerPage.text}
							to={appPages.crmAppPages.subPages.customerPage.to}
							icon={appPages.crmAppPages.subPages.customerPage.icon}>
							<NavItem
								{...appPages.crmAppPages.subPages.customerPage.subPages.listPage}
							/>
							<NavItem
								{...appPages.crmAppPages.subPages.customerPage.subPages.editPage}
							/>
						</NavCollapse>
						<NavCollapse
							text={appPages.crmAppPages.subPages.rolePage.text}
							to={appPages.crmAppPages.subPages.rolePage.to}
							icon={appPages.crmAppPages.subPages.rolePage.icon}>
							<NavItem
								{...appPages.crmAppPages.subPages.rolePage.subPages.listPage}
							/>
							<NavItem
								{...appPages.crmAppPages.subPages.rolePage.subPages.editPage}
							/>
						</NavCollapse>
					</NavCollapse>
					<NavCollapse
						text={appPages.projectAppPages.text}
						to={appPages.projectAppPages.to}
						icon={appPages.projectAppPages.icon}>
						<NavItem {...appPages.projectAppPages.subPages.projectDashboardPage}>
							<NavButton
								title='New Project'
								icon='HeroPlusCircle'
								onClick={() => {
									navigate(
										`../${appPages.projectAppPages.subPages.projectBoardPageLink.to}/new`,
									);
								}}
							/>
						</NavItem>
						<NavItem {...appPages.projectAppPages.subPages.projectBoardPage}>
							<Badge
								variant='outline'
								color='emerald'
								className='border-transparent leading-none'>
								6
							</Badge>
						</NavItem>
					</NavCollapse>
					<NavItem
						text={appPages.mailAppPages.text}
						to={appPages.mailAppPages.subPages.inboxPages.to}
						icon={appPages.mailAppPages.icon}>
						<Badge
							variant='outline'
							color='emerald'
							className='border-transparent leading-none'>
							3
						</Badge>
						<NavButton
							icon='HeroPlusCircle'
							title='New Mail'
							onClick={() => {
								navigate(`../${appPages.mailAppPages.subPages.newMailPages.to}`);
							}}
						/>
					</NavItem>
					<NavItem
						text={appPages.educationAppPages.text}
						to={appPages.educationAppPages.to}
						icon={appPages.educationAppPages.icon}>
						<Badge variant='outline' className='border-transparent leading-none'>
							Soon
						</Badge>
					</NavItem>
					<NavItem
						text={appPages.reservationAppPages.text}
						to={appPages.reservationAppPages.to}
						icon={appPages.reservationAppPages.icon}>
						<Badge variant='outline' className='border-transparent leading-none'>
							Soon
						</Badge>
					</NavItem>

					<NavSeparator />

					<NavTitle>Components & Templates</NavTitle>
					<NavCollapse
						text={componentsPages.uiPages.text}
						to={componentsPages.uiPages.to}
						icon={componentsPages.uiPages.icon}>
						<NavItem {...componentsPages.uiPages.subPages.alertPage} />
						<NavItem {...componentsPages.uiPages.subPages.badgePage} />
						<NavItem {...componentsPages.uiPages.subPages.buttonPage} />
						<NavItem {...componentsPages.uiPages.subPages.buttonGroupPage} />
						<NavItem {...componentsPages.uiPages.subPages.cardPage} />
						<NavItem {...componentsPages.uiPages.subPages.collapsePage} />
						<NavItem {...componentsPages.uiPages.subPages.dropdownPage} />
						<NavItem {...componentsPages.uiPages.subPages.modalPage} />
						<NavItem {...componentsPages.uiPages.subPages.offcanvasPage} />
						<NavItem {...componentsPages.uiPages.subPages.progressPage} />
						<NavItem {...componentsPages.uiPages.subPages.tablePage}>
							<NavButton
								title='Open Npm page'
								icon='CustomNpm'
								onClick={() => {
									window.open(
										'https://www.npmjs.com/package/@tanstack/react-table',
										'_blank',
									);
								}}
							/>
						</NavItem>
						<NavItem {...componentsPages.uiPages.subPages.tooltipPage} />
					</NavCollapse>
					<NavCollapse
						text={componentsPages.formPages.text}
						to={componentsPages.formPages.to}
						icon={componentsPages.formPages.icon}>
						<NavItem {...componentsPages.formPages.subPages.fieldWrapPage} />
						<NavItem {...componentsPages.formPages.subPages.checkboxPage} />
						<NavItem {...componentsPages.formPages.subPages.checkboxGroupPage} />
						<NavItem {...componentsPages.formPages.subPages.inputPage} />
						<NavItem {...componentsPages.formPages.subPages.labelPage} />
						<NavItem {...componentsPages.formPages.subPages.radioPage} />
						<NavItem {...componentsPages.formPages.subPages.richTextPage}>
							<NavButton
								title='Open Npm page'
								icon='CustomNpm'
								onClick={() => {
									window.open(
										'https://www.npmjs.com/package/slate-react',
										'_blank',
									);
								}}
							/>
						</NavItem>
						<NavItem {...componentsPages.formPages.subPages.selectPage} />
						<NavItem {...componentsPages.formPages.subPages.selectReactPage}>
							<NavButton
								title='Open Npm page'
								icon='CustomNpm'
								onClick={() => {
									window.open(
										'https://www.npmjs.com/package/react-select',
										'_blank',
									);
								}}
							/>
						</NavItem>
						<NavItem {...componentsPages.formPages.subPages.textareaPage} />
						<NavItem {...componentsPages.formPages.subPages.validationPage}>
							<Badge variant='outline'>Formik</Badge>
						</NavItem>
					</NavCollapse>
					<NavCollapse
						text={componentsPages.integratedPages.text}
						to={componentsPages.integratedPages.to}
						icon={componentsPages.integratedPages.icon}>
						<NavItem {...componentsPages.integratedPages.subPages.reactDateRangePage} />
						<NavItem {...componentsPages.integratedPages.subPages.fullCalendarPage} />
						<NavItem {...componentsPages.integratedPages.subPages.apexChartsPage} />
						<NavItem
							{...componentsPages.integratedPages.subPages.reactSimpleMapsPage}
						/>
						<NavItem {...componentsPages.integratedPages.subPages.waveSurferPage} />
						<NavItem {...componentsPages.formPages.subPages.richTextPage} />
						<NavItem {...componentsPages.formPages.subPages.selectReactPage} />
					</NavCollapse>

					<NavCollapse
						text={componentsPages.iconsPage.text}
						to={componentsPages.iconsPage.to}
						icon={componentsPages.iconsPage.icon}>
						<NavItem {...componentsPages.iconsPage} />
						<NavItem {...componentsPages.iconsPage.subPages.heroiconsPage}>
							<Badge
								variant='outline'
								color='violet'
								className='!border-transparent leading-none'>
								292
							</Badge>
						</NavItem>
						<NavItem {...componentsPages.iconsPage.subPages.duotoneIconsPage}>
							<Badge
								variant='outline'
								color='violet'
								className='!border-transparent leading-none'>
								640
							</Badge>
						</NavItem>
					</NavCollapse>

					<NavSeparator />
					<NavTitle>Members</NavTitle>
					<NavUser
						text={`${usersDb[0].firstName} ${usersDb[0].lastName}`}
						image={usersDb[0].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[0].username}`}
					/>
					<NavUser
						text={`${usersDb[1].firstName} ${usersDb[1].lastName}`}
						image={usersDb[1].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[1].username}`}>
						<NavButton
							title='New Message'
							icon='HeroChatBubbleLeftEllipsis'
							iconColor='emerald'
							onClick={() => {}}
						/>
					</NavUser>
					<NavUser
						text={`${usersDb[2].firstName} ${usersDb[2].lastName}`}
						image={usersDb[2].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[2].username}`}
					/>
					<NavUser
						text={`${usersDb[3].firstName} ${usersDb[3].lastName}`}
						image={usersDb[3].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[3].username}`}>
						<NavButton
							title='New Message'
							icon='HeroChatBubbleLeftEllipsis'
							iconColor='emerald'
							onClick={() => {}}
						/>
					</NavUser>
					<NavUser
						text={`${usersDb[4].firstName} ${usersDb[4].lastName}`}
						image={usersDb[4].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[4].username}`}>
						<NavButton
							title='New Message'
							icon='HeroChatBubbleLeftEllipsis'
							iconColor='emerald'
							onClick={() => {}}
						/>
					</NavUser> */}
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default DefaultAsideTemplate;
