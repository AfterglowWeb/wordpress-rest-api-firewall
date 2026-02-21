import {
	createContext,
	useContext,
	useState,
	useCallback,
} from '@wordpress/element';

const LicenseContext = createContext( {
	hasValidLicense: false,
	status: null,
	proNonce: null,
	updateLicenseStatus: () => {},
} );

export function LicenseProvider( {
	children,
	hasValidLicense: initialValid = false,
} ) {
	const [ hasValidLicense, setHasValidLicense ] = useState( initialValid );
	const [ status, setStatus ] = useState( null );
	const proNonce = window.restApiFirewallPro?.nonce || null;

	const updateLicenseStatus = useCallback( ( newStatus ) => {
		setStatus( newStatus );
		setHasValidLicense( newStatus?.valid === true );
	}, [] );

	return (
		<LicenseContext.Provider
			value={ { hasValidLicense, status, proNonce, updateLicenseStatus } }
		>
			{ children }
		</LicenseContext.Provider>
	);
}

export function useLicense() {
	const context = useContext( LicenseContext );
	if ( context === undefined ) {
		throw new Error( 'useLicense must be used within a LicenseProvider' );
	}
	return context;
}

export function useProNonce() {
	const { proNonce } = useLicense();
	return proNonce;
}
