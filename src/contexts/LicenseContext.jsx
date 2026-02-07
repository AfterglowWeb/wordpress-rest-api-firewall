import { createContext, useContext, useState, useCallback } from '@wordpress/element';

const LicenseContext = createContext( {
	hasValidLicense: false,
	status: null,
	updateLicenseStatus: () => {},
} );

export function LicenseProvider( { children } ) {
	const [ hasValidLicense, setHasValidLicense ] = useState( false );
	const [ status, setStatus ] = useState( null );

	const updateLicenseStatus = useCallback( ( newStatus ) => {
		setStatus( newStatus );
		setHasValidLicense( newStatus?.valid === true );
	}, [] );

	return (
		<LicenseContext.Provider value={ { hasValidLicense, status, updateLicenseStatus } }>
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
