import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';
import { useLicense } from '../contexts/LicenseContext';

/**
 * Lightweight hook for a single POST to the WP AJAX endpoint.
 *
 * @param {Object}   payload  URLSearchParams payload (action + any extra fields). Nonce is injected automatically.
 * @param {Array}    deps     Extra dependency array values that trigger a refetch when changed.
 * @returns {{ data: any, loading: boolean, error: string, refetch: Function }}
 */
export default function useAjax( payload, deps = [] ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData?.nonce;

	const [ data, setData ] = useState( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );

	const run = useCallback( async () => {
		setLoading( true );
		setError( '' );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( { nonce, ...payload } ),
			} );
			const result = await response.json();
			if ( result?.success ) {
				setData( result.data );
			} else {
				setError( result?.data?.message || 'Request failed' );
			}
		} catch ( err ) {
			setError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ nonce, adminData?.ajaxurl, ...deps ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		run();
	}, [ run ] );

	return { data, loading, error, refetch: run };
}
