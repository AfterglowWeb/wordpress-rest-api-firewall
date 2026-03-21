import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

export default function SettingsRoute() {
	const { __ } = wp.i18n || {};

	return (
		<Box p={ 4 }>
			<Alert severity="info">
				{ __(
					'Menus and ACF options settings are configured per model. Edit a Settings Route model in the Models section to configure them.',
					'rest-api-firewall'
				) }
			</Alert>
		</Box>
	);
}
