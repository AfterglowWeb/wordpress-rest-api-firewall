import { createRoot, lazy, Suspense } from '@wordpress/element';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import AppTheme from './AppTheme';
import Header from './Header';
import Footer from './Footer';
import { AdminDataProvider } from './contexts/AdminDataContext';
import { DocumentationProvider } from './contexts/DocumentationContext';
import { LicenseProvider } from './contexts/LicenseContext';

const App = lazy( () => import( './App' ) );

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'rest-api-firewall-admin-page' );
	const adminData = window?.restApiFirewallAdminData || {};
	if ( container && adminData ) {
		const root = createRoot( container );
		root.render(
			<AdminDataProvider adminData={ adminData }>
				<LicenseProvider
					hasValidLicense={ adminData.has_valid_license }
				>
					<DocumentationProvider>
						<AppTheme>
							<Suspense fallback={ <HeaderSkeleton /> }>
								<Header />
							</Suspense>
							<Suspense fallback={ <ContentSkeleton /> }>
								<App />
							</Suspense>
							<Suspense fallback={ <FooterSkeleton /> }>
								<Footer />
							</Suspense>
						</AppTheme>
					</DocumentationProvider>
				</LicenseProvider>
			</AdminDataProvider>
		);
	}
} );

const HeaderSkeleton = () => (
	<Box
		sx={ {
			background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
			borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
			p: 3,
		} }
	>
		<Box
			sx={ {
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 3,
			} }
		>
			<Box sx={ { display: 'flex', alignItems: 'center', gap: 2 } }>
				<Skeleton
					variant="rounded"
					width={ 48 }
					height={ 48 }
					sx={ { borderRadius: '12px' } }
				/>
				<Box>
					<Skeleton variant="text" width={ 180 } height={ 32 } />
					<Skeleton variant="text" width={ 80 } height={ 20 } />
				</Box>
			</Box>
			<Box sx={ { display: 'flex', gap: 1.5, alignItems: 'center' } }>
				<Skeleton variant="rounded" width={ 80 } height={ 32 } />
				<Skeleton variant="rounded" width={ 60 } height={ 32 } />
				<Skeleton variant="circular" width={ 32 } height={ 32 } />
			</Box>
		</Box>
	</Box>
);

const FooterSkeleton = () => (
	<Box
		sx={ {
			p: 1,
			h: 100,
			display: 'flex',
			gap: 2,
			flexDirection: 'column',
		} }
	>
		<Skeleton variant="rounded" height={ 32 } />
		<Skeleton variant="rounded" height={ 32 } />
	</Box>
);

const ContentSkeleton = () => (
	<Box
		maxWidth="xl"
		sx={ {
			display: 'flex',
			flexDirection: 'column',
			minHeight: 'calc(100vh - 340px)',
			gap: 0,
			width: '100%',
			px: 3,
			pb: 3,
		} }
	>
		<Box
			sx={ {
				display: 'flex',
				gap: 2,
				borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
				mb: 0,
				pb: 2,
				pt: 2,
			} }
		>
			<Skeleton variant="text" width={ 80 } height={ 32 } />
			<Skeleton variant="text" width={ 80 } height={ 32 } />
			<Skeleton variant="text" width={ 80 } height={ 32 } />
			<Skeleton variant="text" width={ 80 } height={ 32 } />
		</Box>

		<Box
			sx={ {
				py: 4,
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				justifyContent: 'space-around',
				gap: 3,
			} }
		>
			<Skeleton
				variant="rounded"
				width={ 'calc(60% - 20px)' }
				height={ 160 }
			/>
			<Skeleton
				variant="rounded"
				width={ 'calc(40% - 20px)' }
				height={ 160 }
			/>
		</Box>
		<Box
			sx={ {
				py: 4,
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				justifyContent: 'space-around',
				gap: 3,
			} }
		>
			<Skeleton
				variant="rounded"
				width={ 'calc(60% - 20px)' }
				height={ 200 }
			/>
			<Skeleton
				variant="rounded"
				width={ 'calc(40% - 20px)' }
				height={ 200 }
			/>
		</Box>
		<Skeleton variant="rounded" height={ 60 } />
	</Box>
);
