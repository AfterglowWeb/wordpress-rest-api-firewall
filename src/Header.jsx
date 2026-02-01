import { useEffect } from '@wordpress/element';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import { useAdminData } from './contexts/AdminDataContext';
import sanitizeHtml from './utils/sanitizeHtml';

const AppHeader = styled( Box )( ( { theme } ) => ( {
	background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
	borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
	padding: theme.spacing( 3, 4 ),
	position: 'relative',
	backdropFilter: 'blur(10px)',
} ) );

const MainContainer = styled( Box )( ( { theme } ) => ( {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	flexWrap: 'wrap',
	gap: theme.spacing( 3 ),
	[ theme.breakpoints.down( 'sm' ) ]: {
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: theme.spacing( 2 ),
	},
} ) );

const BrandSection = styled( Box )( ( { theme } ) => ( {
	display: 'flex',
	alignItems: 'center',
	gap: theme.spacing( 2 ),
} ) );

const AppLogo = styled( Avatar )( () => ( {
	width: 48,
	height: 48,
	background: 'linear-gradient(307deg, #ffb7c4 0%, #ff002e 100%)',
	borderRadius: 12,
	fontSize: '1.4rem',
	fontWeight: 500,
	fontFamily: 'Helvetica, Arial, sans-serif',
	color: 'white',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	position: 'relative',
} ) );

const BrandInfo = styled( Box )( ( { theme } ) => ( {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-end',
	gap: theme.spacing( 0.25 ),
} ) );

const AppName = styled( Typography )( () => ( {
	fontSize: '1.375rem',
	fontWeight: 400,
	color: '#111827',
	lineHeight: 1.2,
	letterSpacing: '-0.025em',
} ) );

const VersionBadge = styled( Box )( ( { theme } ) => ( {
	display: 'inline-flex',
	alignItems: 'center',
	padding: theme.spacing( 0.375, 1 ),
	backgroundColor: '#f3f4f6',
	color: '#6b7280',
	fontSize: '0.6875rem',
	fontWeight: 600,
	borderRadius: 6,
	textTransform: 'uppercase',
	letterSpacing: '0.025em',
	border: '1px solid #e5e7eb',
} ) );

export default function Header() {
	const { adminData } = useAdminData();

	useEffect( () => {
		if ( ! adminData ) {
		}
	}, [ adminData ] );

	if ( ! adminData ) {
		return null;
	}

	return (
		<AppHeader>
			<MainContainer>
				<BrandSection>
					<AppLogo>raf.</AppLogo>

					<BrandInfo>
						<AppName
							dangerouslySetInnerHTML={ {
								__html: sanitizeHtml( adminData?.plugin_name ),
							} }
						/>
					</BrandInfo>

					<VersionBadge
						dangerouslySetInnerHTML={ {
							__html: `v${ sanitizeHtml(
								adminData?.plugin_version
							) }`,
						} }
					/>

					<Tooltip title={ 'Open Theme Github in a new tab' }>
						<Button
							size="small"
							color="primary"
							href={ adminData?.plugin_uri }
							target="_blank"
							rel="noreferer noopener"
						>
							Documentation
						</Button>
					</Tooltip>
				</BrandSection>
			</MainContainer>
		</AppHeader>
	);
}
