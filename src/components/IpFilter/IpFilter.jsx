import { useLicense } from '../../contexts/LicenseContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useApplication } from '../../contexts/ApplicationContext';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import PublicIcon from '@mui/icons-material/Public';
import TableViewIcon from '@mui/icons-material/TableView';
import LockOutlineIcon from '@mui/icons-material/LockOutline';

import IpDataGrid from './IpDataGrid';
import CountryBlockList from './CountryBlockList';
import PublicRateLimitSection from './PublicRateLimitSection';

export default function IpFilter( { scope = 'app' } ) {
	const { __ } = wp.i18n || {};
	const { subKey, navigate } = useNavigation();
	const { selectedApplication } = useApplication();
	const isGlobal   = scope === 'global';
	const listType   = isGlobal ? 'global_blacklist' : 'blacklist';
	const panelKey   = isGlobal ? 'global-ip-filtering' : 'ip-filtering';
	const currentTab = subKey === 'countries' ? 1 : 0;
	const { hasValidLicense } = useLicense();

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


			{ isGlobal && <PublicRateLimitSection /> }

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
					label={ __( 'Blocked IPs', 'rest-api-firewall' ) }
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
