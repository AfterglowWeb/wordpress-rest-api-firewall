import {
	createContext,
	useContext,
	useState,
	useEffect,
} from '@wordpress/element';
import { useAdminData } from './AdminDataContext';
import { useLicense } from './LicenseContext';

const ApplicationContext = createContext( {
	applications: [],
	selectedApplicationId: '',
	selectedApplication: null,
	applicationsLoading: false,
	setSelectedApplicationId: () => {},
	refreshApplications: () => {},
	dirtyFlag: { has: false, message: '' },
	setDirtyFlag: () => {},
} );

export function ApplicationProvider( { children } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData?.nonce;

	const [ applications, setApplications ] = useState( [] );
	const [ selectedApplicationId, setSelectedApplicationId ] = useState( '' );
	const [ applicationsLoading, setApplicationsLoading ] = useState( false );
	const [ dirtyFlag, setDirtyFlag ] = useState( { has: false, message: '' } );

	const fetchApplications = () => {
		if ( ! hasValidLicense ) {
			return;
		}

		setApplicationsLoading( true );

		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action: 'get_application_entries',
				nonce,
			} ),
		} )
			.then( ( r ) => r.json() )
			.then( ( result ) => {
				if ( result?.success && result?.data?.entries ) {
					const entries = result.data.entries;
					setApplications( entries );
					setSelectedApplicationId( ( prev ) => {
						const stillExists = entries.some(
							( a ) => a.id === prev
						);
						return stillExists ? prev : entries[ 0 ]?.id ?? '';
					} );
				}
			} )
			.finally( () => setApplicationsLoading( false ) );
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( fetchApplications, [ hasValidLicense ] );

	const selectedApplication =
		applications.find( ( a ) => a.id === selectedApplicationId ) ?? null;

	return (
		<ApplicationContext.Provider
			value={ {
				applications,
				selectedApplicationId,
				selectedApplication,
				applicationsLoading,
				setSelectedApplicationId,
				refreshApplications: fetchApplications,
				dirtyFlag,
				setDirtyFlag,
			} }
		>
			{ children }
		</ApplicationContext.Provider>
	);
}

export function useApplication() {
	return useContext( ApplicationContext );
}
