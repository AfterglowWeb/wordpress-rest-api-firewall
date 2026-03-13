import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import ApiIcon from '@mui/icons-material/Api';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import WebhookIcon from '@mui/icons-material/Webhook';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

const FEATURES = [
	{
		Icon: AppsOutlinedIcon,
		label: 'Applications',
		desc: 'Isolate settings, rules and keys per client app',
	},
	{
		Icon: SecurityOutlined,
		label: 'Auth & Rate Limiting',
		desc: 'JWT / OAuth users with per-app rate limits',
	},
	{
		Icon: RuleOutlinedIcon,
		label: 'Properties & Models',
		desc: 'REST output transform and custom field models',
	},
	{
		Icon: ApiIcon,
		label: 'Collections',
		desc: 'Group endpoints with per-app sorting rules',
	},
	{
		Icon: AccountTreeIcon,
		label: 'Routes Policy',
		desc: 'Per-app HTTP method & post-type restrictions',
	},
	{
		Icon: VpnLockOutlinedIcon,
		label: 'IP Filtering',
		desc: 'Whitelist / blacklist with full CIDR support',
	},
	{
		Icon: AutoFixHighOutlinedIcon,
		label: 'Automations',
		desc: 'Event triggers with conditions and actions',
	},
	{
		Icon: WebhookIcon,
		label: 'Webhooks',
		desc: 'Outbound event notifications per application',
	},
	{
		Icon: EmailOutlinedIcon,
		label: 'Emails',
		desc: 'SMTP configuration and mail templates per app',
	},
	{
		Icon: BusinessOutlinedIcon,
		label: 'Settings Route',
		desc: 'Control wp/v2/settings visibility per app',
	},
	{
		Icon: AssessmentOutlinedIcon,
		label: 'Logs',
		desc: 'Full request history and audit trail',
	},
];

export default function ProFeatures() {
	const { __ } = wp.i18n || {};

	return (
		<Stack
            flex={1}
            maxWidth={800}
            minWidth={260}
            p={ 4 }
            spacing={ 2 }
            alignSelf="flex-start"
		>
			<Stack direction="row" alignItems="center" spacing={ 1 }>
				<Chip
					label="PRO"
					size="small"
					color="primary"
					sx={ { fontWeight: 700, fontSize: '0.6rem', height: 20 } }
				/>
				<Typography variant="subtitle2" fontWeight={ 700 }>
					{ __( 'Application Layer Pro', 'rest-api-firewall' ) }
				</Typography>
			</Stack>

			<Typography variant="caption" color="text.secondary">
				{ __(
					'Unlock per-application isolation and advanced REST API management.',
					'rest-api-firewall'
				) }
			</Typography>

			<Divider />

			<Stack spacing={ 1.5 }>
				{ FEATURES.map( ( { Icon, label, desc } ) => (
					<Stack
						key={ label }
						direction="row"
						spacing={ 1.25 }
						alignItems="flex-start"
					>
						<Icon
							sx={ {
								fontSize: 15,
								color: 'primary.main',
								flexShrink: 0,
								mt: 0.15,
							} }
						/>
						<Stack>
							<Typography
								variant="caption"
								fontWeight={ 600 }
								display="block"
								sx={ { lineHeight: 1.4 } }
							>
								{ label }
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{ desc }
							</Typography>
						</Stack>
					</Stack>
				) ) }
			</Stack>
		</Stack>
	);
}
