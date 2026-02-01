import { createContext, useContext } from '@wordpress/element';

const LicenseContext = createContext( {
	hasValidLicense: false,
} );

export function LicenseProvider( { children, hasValidLicense } ) {
	return (
		<LicenseContext.Provider value={ { hasValidLicense } }>
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
