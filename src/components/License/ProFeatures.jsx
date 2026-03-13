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
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';

const USECASES = [
	{
		desc: 'Reduce cloud infrastructure and maintenance costs and give your editorial teams a powerful tool to distribute content across all your applications.',
	},
    {
        desc: 'Selfhost you data easily by using WordPress without breaking your existing applications. Take back control on your business privacy.'
    },
	{
		desc: 'Serve content in multiple languages across separate websites or applications.',
	},
	{
		desc: 'Use WordPress as a headless CMS powering a corporate website, an e-commerce store, and a mobile application — all from one back-end.',
	},
	{
		desc: 'Map WordPress content structures to the exact schemas your existing applications expect.',
	},
    {
        desc: 'Reinforce global WordPress privacy and security: deactivate public APIs, apply security policies on HTML responses, reinforce WordPress login, secure your server files and more.'
    }
];

const FEATURES = [
	{
		Icon: AppsOutlinedIcon,
		label: 'Applications',
		desc: 'Isolate settings, rules, and secrets per client application.',
		details: 'Each application has its own configuration scope and can define its own REST API base route. Users, authentication methods, rate limits, route policies, collections, models, automations, webhooks, and email templates are all managed independently. Identify applications by API key or client certificate, or let the firewall automatically match incoming requests to applications based on custom rules.',
	},
	{
		Icon: SecurityOutlined,
		label: 'Auth & Rate Limiting',
		desc: 'JWT / OAuth authentication with per-app and per-user rate limits.',
		details: 'Attach users to an application, enforce token-based authentication and configure independent request rate limits per application or per user.',
	},
	{
		Icon: RuleOutlinedIcon,
		label: 'Properties & Models',
		desc: 'Filter and transform REST API output field by field.',
		details: 'Disable or rename WordPress post and taxonomy properties or map them into custom objects using the JSON object builder.',
	},
	{
		Icon: ApiIcon,
		label: 'Collections',
		desc: 'Sorting and grouping rules for posts and taxonomies per application.',
		details: 'Define custom sort orders and group related endpoints into named collections, independently configured for each application.',
	},
	{
		Icon: AccountTreeIcon,
		label: 'Routes Policy',
		desc: 'Fine-grained control over route access and HTTP methods per application.',
		details: 'Restrict allowed HTTP methods, assign users per route, configure redirections, filter by post type, and more — all scoped per application.',
	},
	{
		Icon: VpnLockOutlinedIcon,
		label: 'IP Filtering',
		desc: 'IP whitelist / blacklist with full CIDR support and GeoIP country filtering.',
		details: 'Whitelist mode: allow only requests from specified IPs or countries. Blacklist mode: block specified IPs or countries while allowing all others. Configure allowed origins in whitelist mode and set the retention period in blacklist mode.',
	},
	{
		Icon: AutoFixHighOutlinedIcon,
		label: 'Automations',
		desc: 'Event-driven workflows with conditions and actions.',
		details: 'Create unlimited automation workflows triggered by WordPress CRUD actions, Application Layer events or custom filter hooks with configurable arguments.',
	},
	{
		Icon: WebhookIcon,
		label: 'Webhooks',
		desc: 'Outbound event notifications scoped per application.',
		details: 'Configure endpoint URLs, custom payload templates and authentication headers independently for each webhook entry.',
	},
	{
		Icon: EmailOutlinedIcon,
		label: 'Emails',
		desc: 'Unlimited mail templates with per-app SMTP configuration.',
		details: 'Create reusable email templates with dynamic placeholders and configure a dedicated SMTP server for each application.',
	},
	{
		Icon: BusinessOutlinedIcon,
		label: 'Settings Route',
		desc: 'Control the wp/v2/settings route output per application.',
		details: 'Filter or disable WordPress settings properties, populate ACF options page fields, resolve WordPress menus and map custom objects into the settings response.',
	},
	{
		Icon: AssessmentOutlinedIcon,
		label: 'Logs',
		desc: 'Full request history and audit trail.',
		details: 'Track all incoming REST API requests with timestamps, response codes, matched application context and rule outcomes.',
	},
];

export default function ProFeatures() {
	const { __ } = wp.i18n || {};

	return (
		<Stack
            flex={1}
            maxWidth={500}
            minWidth={260}
            p={ 4 }
            spacing={ 2 }
            alignSelf="flex-start"
		>
			<Stack spacing={ 0 }>
                <Stack direction="row" alignItems="center" spacing={ 1 }>
                    <CardMembershipOutlinedIcon />
                    <Typography variant="h6" fontWeight={ 600 }>
                        { __( 'Application Layer Pro', 'rest-api-firewall' ) }
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    { __(
                        'Unlock per-application isolation and advanced management.',
                        'rest-api-firewall'
                    ) }
                </Typography>
			</Stack>

			<Stack spacing={ 0.75 }>
				{ USECASES.map( ( { desc }, i ) => (
					<Stack key={ i } direction="row" spacing={ 1 } alignItems="flex-start">
						<Typography variant="body2" color="text.disabled" sx={ { flexShrink: 0, mt: '1px' } }>›</Typography>
						<Typography variant="body2" color="text.secondary">{ desc }</Typography>
					</Stack>
				) ) }
			</Stack>

			<Stack spacing={ 2 } pb={ 4 }>
				{ FEATURES.map( ( { Icon, label, desc, details = null } ) => (
                        <Stack
                            key={ label }
                            direction="row"
                            spacing={ 1.25 }
                            alignItems="flex-start"
                        >
                            <Icon
                                sx={ {
                                    fontSize: 18,
                                    flexShrink: 0,
                                    mt: 0.15,
                                } }
                            />
                            <Stack>
                                <Typography
                                    variant="body2"
                                    fontWeight={ 600 }
                                    display="block"
                                    sx={ { lineHeight: 1.4 } }
                                >
                                    { label }
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    { desc }
                                </Typography>
                                { details && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={ {
                                            display: 'block',
                                            mt: 0.5,
                                            pl: 1,
                                            borderLeft: '2px solid',
                                            borderColor: 'divider',
                                            lineHeight: 1.55,
                                        } }
                                    >
                                        { details }
                                    </Typography>
                                ) }
                            </Stack>
                        </Stack>
				) ) }
			</Stack>
		</Stack>
	);
}
