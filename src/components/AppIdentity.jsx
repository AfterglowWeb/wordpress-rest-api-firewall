import { useAdminData } from '../contexts/AdminDataContext';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';

const AppLogo = styled( Avatar )( () => ( {
	width: 48,
	height: 48,
	background: 'linear-gradient(307deg, #ffb7c4 0%, #ff002e 100%)',
	borderRadius: 12,
	fontSize: '1.4rem',
	fontWeight: 500,
	fontFamily: 'monospace, Helvetica, Arial, sans-serif',
	color: 'white',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	position: 'relative',
} ) );

export default function AppIdentity() {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();

	return (
		<Box
			sx={ {
				p: 2,
				height: 75,
				display: 'flex',
				gap: 1,
				boxSizing: 'border-box',
			} }
		>
			<AppLogo>AL</AppLogo>
			<Box>
				<Typography variant="subtitle2" fontWeight={ 600 }>
					{ adminData.plugin_name }
				</Typography>
				<Typography variant="caption" color="text.secondary">
					v{ adminData.plugin_version }
				</Typography>
			</Box>
		</Box>
	);
}
