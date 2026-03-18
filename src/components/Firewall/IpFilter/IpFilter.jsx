import { useLicense } from '../../../contexts/LicenseContext';
import { useNavigation } from '../../../contexts/NavigationContext';
import { useApplication } from '../../../contexts/ApplicationContext';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import PublicIcon from '@mui/icons-material/Public';
import TableViewIcon from '@mui/icons-material/TableView';
import LockOutlineIcon from '@mui/icons-material/LockOutline';
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined';

import IpDataGrid from './IpDataGrid';
import CountryBlockList from './CountryBlockList';

export default function IpFilter( { scope = 'app' } ) {
	const { __ } = wp.i18n || {};
	const { subKey, navigate } = useNavigation();
	const { selectedApplication } = useApplication();
	const isGlobal   = scope === 'global';
	const listType   = isGlobal ? 'global_blacklist' : 'blacklist';
	const panelKey   = isGlobal ? 'global-ip-filtering' : 'ip-filtering';
	const currentTab = subKey === 'countries' ? 1 : 0;
	const { hasValidLicense } = useLicense();

	const appLabel = selectedApplication?.title
		? selectedApplication.title
		: __( 'current application', 'rest-api-firewall' );

	return (
		<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>
			{ ! hasValidLicense && (
				<Alert
					severity="info"
					icon={ <LockOutlineIcon /> }
				>
					{ __(
						'Buy a licence for advanced IP management: Block by CIDR, Block by Country, Bulk Delete, Set Retention Time, Export and More…',
						'rest-api-firewall'
					) }
				</Alert>
			) }

			{ isGlobal ? (
				<Alert
					severity="info"
					icon={ <VpnLockOutlinedIcon /> }
					sx={ { bgcolor: 'grey.100', color: 'text.primary', '& .MuiAlert-icon': { color: 'text.secondary' } } }
				>
					<AlertTitle sx={ { fontWeight: 600 } }>
						{ __( 'Global IP Filtering', 'rest-api-firewall' ) }
					</AlertTitle>
					{ __( 'These rules apply to all applications before any request reaches application logic. Use this list for shared threats: known bots, scrapers, and unwanted geographies.', 'rest-api-firewall' ) }
					{ selectedApplication && (
						<>
							{ ' ' }
							{ __( 'To add blocks specific to', 'rest-api-firewall' ) }{ ' ' }
							<Link
								component="button"
								underline="always"
								sx={ { verticalAlign: 'baseline', fontSize: 'inherit', color: 'inherit' } }
								onClick={ () => navigate( 'ip-filtering' ) }
							>
								{ appLabel }
							</Link>
							{ ', ' }
							{ __( 'use the per-application IP Filtering panel.', 'rest-api-firewall' ) }
						</>
					) }
				</Alert>
			) : (
				<Alert
					severity="info"
					icon={ <VpnLockOutlinedIcon /> }
					sx={ { bgcolor: 'grey.100', color: 'text.primary', '& .MuiAlert-icon': { color: 'text.secondary' } } }
				>
					<AlertTitle sx={ { fontWeight: 600 } }>
						{ __( 'Additional blocks for this application', 'rest-api-firewall' ) }
					</AlertTitle>
					{ __( 'These rules layer on top of the', 'rest-api-firewall' ) }{ ' ' }
					<Link
						component="button"
						underline="always"
						sx={ { verticalAlign: 'baseline', fontSize: 'inherit', color: 'inherit' } }
						onClick={ () => navigate( 'global-ip-filtering' ) }
					>
						{ __( 'Global IP Filtering', 'rest-api-firewall' ) }
					</Link>
					{ '. ' }
					{ __( 'An IP blocked globally never reaches this application. Use this list for rules specific to', 'rest-api-firewall' ) }{ ' ' }
					{ appLabel }{ '.' }
				</Alert>
			) }

			<Tabs
				value={ currentTab }
				onChange={ ( _, v ) => navigate( panelKey, v === 1 ? 'countries' : 'ips' ) }
				sx={ {
					mb: 2,
					borderBottom: 1,
					borderColor: 'divider',
				} }
			>
				<Tab
					icon={ <TableViewIcon /> }
					iconPosition="start"
					label={ __( 'Block IPs', 'rest-api-firewall' ) }
				/>
				<Tab
					icon={ <PublicIcon /> }
					iconPosition="start"
					label={ __( 'Block Country', 'rest-api-firewall' ) }
				/>
			</Tabs>

			{ currentTab === 0 && <IpDataGrid listType={ listType } /> }
			{ currentTab === 1 && <CountryBlockList listType={ listType } /> }
		</Stack>
	);
}
