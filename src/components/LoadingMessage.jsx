import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

export default function LoadingMessage({ message = null }) {
	const { __ } = wp.i18n || {};
	return (
		<Stack
			flexGrow={ 1 }
			justifyContent="center"
			alignItems="center"
			sx={ { p: 4 } }
			spacing={ 1 }
		>
			<Typography color="text.secondary">
				{ message || __( 'Loading…', 'rest-api-firewall' ) }
			</Typography>
			<LinearProgress sx={ { width: '100%', maxWidth: 360 } } />
		</Stack>
	);
}
