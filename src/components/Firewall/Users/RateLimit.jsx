import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export default function RateLimit( { form, setField } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack
			direction={ 'column' }
			my={ 3.6 }
			spacing={ 3 }
			justifyContent={ 'space-around' }
		>
			<Stack direction={ { xs: 'column', lg: 'row' } } gap={ 2 }>
				<TextField
					label={ __( 'Rate Limit Requests', 'rest-api-firewall' ) }
					name="rate_limit"
					type="number"
					helperText={ __(
						'Maximum requests before limiting',
						'rest-api-firewall'
					) }
					value={ form.rate_limit || 30 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>

				<TextField
					label={ __(
						'Rate Limit Window (seconds)',
						'rest-api-firewall'
					) }
					name="rate_limit_time"
					type="number"
					helperText={ __(
						'Time window for requests count',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_time || 60 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>
			</Stack>

			<Stack direction={ { xs: 'column', lg: 'row' } } gap={ 2 }>
				<TextField
					label={ __(
						'Rate Limit Release (seconds)',
						'rest-api-firewall'
					) }
					name="rate_limit_release"
					type="number"
					helperText={ __(
						'Wait time before limitation resets',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_release || 300 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>

				<TextField
					label={ __( 'Rate Limit Blacklist', 'rest-api-firewall' ) }
					name="rate_limit_blacklist"
					type="number"
					helperText={ __(
						'Number of limitation periods before blacklisted',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_blacklist || 5 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>

				<TextField
					label={ __(
						'Blacklist Limit Window (seconds)',
						'rest-api-firewall'
					) }
					name="rate_limit_blacklist_time"
					type="number"
					helperText={ __(
						'Time window for limitation periods count',
						'rest-api-firewall'
					) }
					value={ form.rate_limit_blacklist_time || 3600 }
					onChange={ setField }
					fullWidth
					sx={ { flex: 1, maxWidth: 270 } }
				/>
			</Stack>
		</Stack>
	);
}

export function DefaultRateLimit( { form, setField } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};
	const { selectedApplicationId } = useApplication();

	const [ rlMax, setRlMax ] = useState( '' );
	const [ rlWindow, setRlWindow ] = useState( '' );
	const [ rlRelease, setRlRelease ] = useState( '' );
	const [ rlBlacklistAfter, setRlBlacklistAfter ] = useState( '' );
	const [ rlBlacklistWindow, setRlBlacklistWindow ] = useState( '' );
	const [ rateLimitSaving, setRateLimitSaving ] = useState( false );

	const loadAppRateLimit = useCallback( async () => {
		if ( ! selectedApplicationId ) return;
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: selectedApplicationId,
				} ),
			} );
			const result = await res.json();
			if ( result?.success && result?.data?.entry ) {
				const rl = result.data.entry.settings?.rate_limit || {};
				setRlMax( rl.max_requests ?? '' );
				setRlWindow( rl.window_seconds ?? '' );
				setRlRelease( rl.release_seconds ?? '' );
				setRlBlacklistAfter( rl.blacklist_after ?? '' );
				setRlBlacklistWindow( rl.blacklist_window ?? '' );
			}
		} catch {}
	}, [ adminData, nonce, selectedApplicationId ] );

	const saveAppRateLimit = useCallback( async () => {
		if ( ! selectedApplicationId ) return;
		setRateLimitSaving( true );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: selectedApplicationId,
				} ),
			} );
			const result = await res.json();
			const entry = result?.success ? result.data.entry : {};
			const existingSettings = entry.settings || {};
			await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'update_application_entry',
					nonce,
					id: selectedApplicationId,
					title: entry.title || '',
					settings: JSON.stringify( {
						...existingSettings,
						rate_limit: {
							max_requests: Number( rlMax ) || 0,
							window_seconds: Number( rlWindow ) || 0,
							release_seconds: Number( rlRelease ) || 0,
							blacklist_after: Number( rlBlacklistAfter ) || 0,
							blacklist_window: Number( rlBlacklistWindow ) || 0,
						},
					} ),
				} ),
			} );
		} catch {} finally {
			setRateLimitSaving( false );
		}
	}, [ adminData, nonce, selectedApplicationId, rlMax, rlWindow, rlRelease, rlBlacklistAfter, rlBlacklistWindow ] );

	useEffect( () => {
		loadAppRateLimit();
	}, [ loadAppRateLimit ] );
	
	return(<Stack spacing={ 2 }>
		<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 } sx={ { maxWidth: 700 } }>
			<TextField
				size="small"
				label={ __( 'Max Requests', 'rest-api-firewall' ) }
				type="number"
				value={ rlMax }
				onChange={ ( e ) => setRlMax( e.target.value ) }
				sx={ { flex: 1 } }
			/>
			<TextField
				size="small"
				label={ __( 'Window (s)', 'rest-api-firewall' ) }
				type="number"
				value={ rlWindow }
				onChange={ ( e ) => setRlWindow( e.target.value ) }
				sx={ { flex: 1 } }
			/>
			<TextField
				size="small"
				label={ __( 'Release (s)', 'rest-api-firewall' ) }
				type="number"
				value={ rlRelease }
				onChange={ ( e ) => setRlRelease( e.target.value ) }
				sx={ { flex: 1 } }
			/>
		</Stack>
		<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 } sx={ { maxWidth: 700 } }>
			<TextField
				size="small"
				label={ __( 'Blacklist After (violations)', 'rest-api-firewall' ) }
				type="number"
				value={ rlBlacklistAfter }
				onChange={ ( e ) => setRlBlacklistAfter( e.target.value ) }
				sx={ { flex: 1 } }
			/>
			<TextField
				size="small"
				label={ __( 'Blacklist Window (s)', 'rest-api-firewall' ) }
				type="number"
				value={ rlBlacklistWindow }
				onChange={ ( e ) => setRlBlacklistWindow( e.target.value ) }
				sx={ { flex: 1 } }
			/>
			<Stack pl={ 2 } direction="column" justifyContent="flex-end" alignItems="flex-end" sx={ { flex: 1 } }>
				<Button
					variant="contained"
					disableElevation
					size="small"
					onClick={ saveAppRateLimit }
					disabled={ rateLimitSaving }
				>
					{ __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Stack>
		</Stack>
	</Stack>
);
}

/**
 * Controlled per-user rate limit fields (no AJAX — save handled by parent).
 * values: { max_requests, window_seconds, release_seconds, blacklist_after, blacklist_window }
 */
export function UserRateLimitFields( { values = {}, onChange } ) {
	const { __ } = wp.i18n || {};
	const {
		max_requests = '',
		window_seconds = '',
		release_seconds = '',
		blacklist_after = '',
		blacklist_window = '',
	} = values;

	return (
		<Stack spacing={ 2 }>
			<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
				<TextField
					label={ __( 'Max Requests', 'rest-api-firewall' ) }
					type="number"
					size="small"
					value={ max_requests }
					onChange={ ( e ) => onChange( 'max_requests', e.target.value ) }
					helperText={ __( 'Requests allowed per window', 'rest-api-firewall' ) }
					sx={ { maxWidth: 200 } }
				/>
				<TextField
					label={ __( 'Window (seconds)', 'rest-api-firewall' ) }
					type="number"
					size="small"
					value={ window_seconds }
					onChange={ ( e ) => onChange( 'window_seconds', e.target.value ) }
					helperText={ __( 'Rolling time window', 'rest-api-firewall' ) }
					sx={ { maxWidth: 200 } }
				/>
				<TextField
					label={ __( 'Release (seconds)', 'rest-api-firewall' ) }
					type="number"
					size="small"
					value={ release_seconds }
					onChange={ ( e ) => onChange( 'release_seconds', e.target.value ) }
					helperText={ __( 'Wait time before limitation resets', 'rest-api-firewall' ) }
					sx={ { maxWidth: 200 } }
				/>
			</Stack>
			<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
				<TextField
					label={ __( 'Blacklist After (violations)', 'rest-api-firewall' ) }
					type="number"
					size="small"
					value={ blacklist_after }
					onChange={ ( e ) => onChange( 'blacklist_after', e.target.value ) }
					helperText={ __( 'Violations before blacklisted', 'rest-api-firewall' ) }
					sx={ { maxWidth: 200 } }
				/>
				<TextField
					label={ __( 'Blacklist Window (seconds)', 'rest-api-firewall' ) }
					type="number"
					size="small"
					value={ blacklist_window }
					onChange={ ( e ) => onChange( 'blacklist_window', e.target.value ) }
					helperText={ __( 'Time window for violations count', 'rest-api-firewall' ) }
					sx={ { maxWidth: 200 } }
				/>
			</Stack>
		</Stack>
	);
}