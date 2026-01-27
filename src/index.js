import { createRoot } from '@wordpress/element';
import { lazy, Suspense } from '@wordpress/element';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import AppTheme from './AppTheme';
import Header from './Header';
import Footer from './Footer';
import { AdminDataProvider } from './contexts/AdminDataContext';
import { DocumentationProvider } from './contexts/DocumentationContext';

const App = lazy( () => import( './App' ) );

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'rest-api-firewall-admin-page' );
	const adminData = window?.restApiFirewallAdminData || {};
	if ( container && adminData ) {
		const root = createRoot( container );
		root.render(
			<AdminDataProvider adminData={ adminData }>
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
		sx={ {
			display: 'flex',
			flexDirection: 'column',
			gap: 2,
			maxWidth: 600,
			mx: 'auto',
			p: { xs: 2, md: 3 },
		} }
	>
		<Skeleton variant="rounded" height={ 300 } />
		<Skeleton variant="rounded" height={ 300 } />
		<Skeleton variant="rounded" height={ 300 } />
	</Box>
);
