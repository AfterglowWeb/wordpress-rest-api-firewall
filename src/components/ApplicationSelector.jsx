import { useState } from '@wordpress/element';
import { useApplication } from '../contexts/ApplicationContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useLicense } from '../contexts/LicenseContext';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import ApiIcon from '@mui/icons-material/Api';
import AppSettingsAltOutlinedIcon from '@mui/icons-material/AppSettingsAltOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import WebhookIcon from '@mui/icons-material/Webhook';

export const listItemIconSx = { px: 1, minWidth: 32, color: 'text.secondary' };
export const listItemTextSx = { '& .MuiListItemText-primary': { fontSize: '0.9rem', lineHeight: 'normal' } };

const MODULE_ITEMS = [
	{ key: 'per-route-settings', label: 'Routes',      Icon: AccountTreeOutlinedIcon },
	{ key: 'user-rate-limiting', label: 'Users',       Icon: SmartToyOutlinedIcon },
	{ key: 'collections',        label: 'Collections', Icon: ApiIcon },
	{ key: 'models-properties',  label: 'Properties',  Icon: RuleOutlinedIcon },
	{ key: 'automations',        label: 'Automations', Icon: AutoFixHighOutlinedIcon },
	{ key: 'webhook',            label: 'Webhooks',    Icon: WebhookIcon },
	{ key: 'emails',             label: 'Emails',      Icon: EmailOutlined },
];

export default function ApplicationSelector() {
	const { __ } = wp.i18n || {};
	const { hasValidLicense } = useLicense();
	const {
		applications,
		selectedApplicationId,
		applicationsLoading,
		setSelectedApplicationId,
	} = useApplication();
	const { navigateGuarded, panel, subKey } = useNavigation();
	const [ open, setOpen ] = useState( () => hasValidLicense && applications.length === 0 );
	const [ snackOpen, setSnackOpen ] = useState( false );

	const handleSelectApp = ( id ) => {
		if ( id === selectedApplicationId ) return;
		if ( subKey ) {
			navigateGuarded( 'applications', id, () => setSelectedApplicationId( id ) );
		} else {
			setSelectedApplicationId( id );
			setSnackOpen( true );
		}
	};

	const modulesDisabled = ! hasValidLicense || ! selectedApplicationId;
	const moduleTooltip   = ! hasValidLicense
		? __( 'Upgrade to Pro', 'rest-api-firewall' )
		: ! selectedApplicationId
			? __( 'Create an application first', 'rest-api-firewall' )
			: '';

	const activeApp = applications.find( ( a ) => a.id === selectedApplicationId );
	const appLabel  = applicationsLoading
		? __( 'Loading…', 'rest-api-firewall' )
		: ( activeApp?.title || __( 'No application', 'rest-api-firewall' ) );

	return (
		<>
			<ListItemButton
			onClick={ hasValidLicense ? () => setOpen( ( o ) => ! o ) : undefined }
			disabled={ ! hasValidLicense }
			sx={ { px: 3, mt: 1 } }
		>
				<ListItemIcon sx={ listItemIconSx }>
					<AppsOutlinedIcon fontSize="small" />
				</ListItemIcon>
				<ListItemText
					sx={ listItemTextSx }
					primary={ __( 'Applications', 'rest-api-firewall' ) }
				/>
				{ open
					? <ExpandLessIcon fontSize="small" sx={ { color: 'text.secondary' } } />
					: <ExpandMoreIcon fontSize="small" sx={ { color: 'text.secondary' } } />
				}
			</ListItemButton>

			<Collapse in={ open } timeout="auto" unmountOnExit>

				{ /* App navigation links */ }
				{ hasValidLicense && (
					<List component="div" disablePadding>
						<ListItemButton
							selected={ panel === 'applications' && ! subKey }
							disabled={ panel === 'applications' && ! subKey }
							onClick={ () => navigateGuarded( 'applications' ) }
							sx={ { pl: 6, pr: 3 } }
						>
							<ListItemText
								sx={ listItemTextSx }
								primary={ __( 'All Applications', 'rest-api-firewall' ) }
							/>
						</ListItemButton>

						<ListItemButton
							onClick={ () => navigateGuarded( 'applications', 'new' ) }
							sx={ { pl: 6, pr: 3 } }
						>
							<ListItemText
								sx={ listItemTextSx }
								primary={ __( 'New Application', 'rest-api-firewall' ) }
							/>
							<AddIcon fontSize="small" />
						</ListItemButton>
					</List>
				) }

				{ /* No app placeholder */ }
				<ListItemButton
					disabled={ ! selectedApplicationId }
					selected={ !! selectedApplicationId && panel === 'applications' && !! subKey }
					onClick={ selectedApplicationId
						? () => handleSelectApp( selectedApplicationId )
						: undefined }
					sx={ { pl: hasValidLicense ? 5 : 3, pr: 3, mt: 1 } }
				>
					<ListItemIcon sx={ { px: 1, minWidth: 32 } }>
						<AppSettingsAltOutlinedIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText sx={ listItemTextSx } primary={ appLabel } />
				</ListItemButton>

				{ /* Per app module items */ }
				<List component="div" disablePadding>
					{ MODULE_ITEMS.map( ( { key, label, Icon } ) => (
						<Tooltip
							key={ key }
							title={ moduleTooltip }
							followCursor
							disableInteractive
						>
							<span>
								<ListItemButton
									selected={ panel === key }
									disabled={ modulesDisabled }
									onClick={ () => navigateGuarded( key ) }
									sx={ { pl: hasValidLicense ? 6 : 5, pr: 3 } }
								>
									<ListItemIcon sx={ { px: 1, minWidth: 32 } }>
										<Icon fontSize="small" />
									</ListItemIcon>
									<ListItemText
										sx={ listItemTextSx }
										primary={ __( label, 'rest-api-firewall' ) }
									/>
								</ListItemButton>
							</span>
						</Tooltip>
					) ) }
				</List>

			</Collapse>

			<Snackbar
				open={ snackOpen }
				autoHideDuration={ 2000 }
				onClose={ () => setSnackOpen( false ) }
			>
				<Alert
					severity="success"
					onClose={ () => setSnackOpen( false ) }
				>
					{ __( 'Application changed', 'rest-api-firewall' ) }
				</Alert>
			</Snackbar>
		</>
	);
}
