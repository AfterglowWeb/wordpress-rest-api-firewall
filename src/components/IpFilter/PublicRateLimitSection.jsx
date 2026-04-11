import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import useSaveOptions from '../../hooks/useSaveOptions';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { RateLimitFields } from '../Firewall/Users/RateLimit';

const DEFAULTS = {
	public_rate_limit_enabled:        false,
	public_rate_limit:                100,
	public_rate_limit_time:           60,
	public_rate_limit_release:        300,
	public_rate_limit_blacklist:      10,
	public_rate_limit_blacklist_time: 3600,
};

const FIELD_MAP = {
	max_requests:    'public_rate_limit',
	window_seconds:  'public_rate_limit_time',
	release_seconds: 'public_rate_limit_release',
	blacklist_after:  'public_rate_limit_blacklist',
	blacklist_window: 'public_rate_limit_blacklist_time',
};

export default function PublicRateLimitSection() {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { save, saving } = useSaveOptions();

	const [ fields, setFields ] = useState( DEFAULTS );
	const [ dirty, setDirty ] = useState( false );

	useEffect( () => {
		if ( adminData?.admin_options ) {
			const opts = adminData.admin_options;
			setFields( {
				public_rate_limit_enabled:        !! opts.public_rate_limit_enabled,
				public_rate_limit:                opts.public_rate_limit                ?? DEFAULTS.public_rate_limit,
				public_rate_limit_time:           opts.public_rate_limit_time           ?? DEFAULTS.public_rate_limit_time,
				public_rate_limit_release:        opts.public_rate_limit_release        ?? DEFAULTS.public_rate_limit_release,
				public_rate_limit_blacklist:      opts.public_rate_limit_blacklist      ?? DEFAULTS.public_rate_limit_blacklist,
				public_rate_limit_blacklist_time: opts.public_rate_limit_blacklist_time ?? DEFAULTS.public_rate_limit_blacklist_time,
			} );
		}
	}, [ adminData?.admin_options ] );

	const setField = ( key, value ) => {
		setFields( ( prev ) => ( { ...prev, [ key ]: value } ) );
		setDirty( true );
	};

	const handleRateLimitChange = ( fieldKey, value ) => {
		const phpKey = FIELD_MAP[ fieldKey ];
		if ( phpKey ) setField( phpKey, value );
	};

	const handleSave = () => {
		save( fields, {
			successTitle:   __( 'Saved', 'rest-api-firewall' ),
			successMessage: __( 'Public rate limiting settings saved.', 'rest-api-firewall' ),
			confirmMessage: __( 'Save public rate limiting settings?', 'rest-api-firewall' ),
			onSuccess: () => setDirty( false ),
		} );
	};

	return (
		<Stack spacing={ 2 }>
			<Stack>
				<Typography variant="subtitle1" fontWeight={ 600 }>
					{ __( 'Public Rate Limiting', 'rest-api-firewall' ) }
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{ __( 'Limit REST API requests from anonymous clients. Clients that exceed the limit are automatically blacklisted.', 'rest-api-firewall' ) }
				</Typography>
			</Stack>

			<FormControlLabel
				control={
					<Switch
						size="small"
						checked={ fields.public_rate_limit_enabled }
						onChange={ ( e ) => setField( 'public_rate_limit_enabled', e.target.checked ) }
					/>
				}
				label={ __( 'Enable', 'rest-api-firewall' ) }
			/>

			<RateLimitFields
				values={ {
					max_requests:    fields.public_rate_limit,
					window_seconds:  fields.public_rate_limit_time,
					release_seconds: fields.public_rate_limit_release,
					blacklist_after:  fields.public_rate_limit_blacklist,
					blacklist_window: fields.public_rate_limit_blacklist_time,
					enabled:          fields.public_rate_limit_enabled,
				} }
				onChange={ handleRateLimitChange }
			/>

			<Stack direction="row">
				<Button
					variant="contained"
					disableElevation
					size="small"
					disabled={ saving || ! dirty }
					onClick={ handleSave }
				>
					{ __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
