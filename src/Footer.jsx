import { useEffect } from '@wordpress/element';
import { useAdminData } from './contexts/AdminDataContext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

export default function Footer() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};

	useEffect( () => {
		if ( ! adminData ) {
		}
	}, [ adminData ] );

	if ( ! adminData ) {
		return null;
	}

	return (
		<Box
			component="footer"
			sx={ {
				p: 1,
				height: 40,
				boxSizing: 'border-box',
				borderTop: 1,
				borderColor: 'divider',
				background: (theme) => theme.palette.background.paper,
				display: 'flex',
				gap: 1,
				justifyContent: 'flex-end',
				alignItems: 'center',
			} }
		>
			<Button
				size="small"
				target="_blank"
				rel="nofollow noreferer noopener"
				sx={ { textTransform: 'none' } }
			>
				{__('Support', 'rest-api-firewall')}
			</Button>
			<Button
				size="small"
				target="_blank"
				rel="nofollow noreferer noopener"
				sx={ { textTransform: 'none' } }
			>
				{__('Credits', 'rest-api-firewall')}
			</Button>
			<Tooltip title={ 'Open in a new tab' }>
				<Button
				size="small"
				href="https://creativecommons.org/licenses/by-sa/4.0/"
				target="_blank"
				rel="nofollow noreferer noopener"
				sx={ { textTransform: 'none' } }
				>
					{__('GPL-V2 License', 'rest-api-firewall')}
				</Button>
			</Tooltip>
		</Box>
	);
}
