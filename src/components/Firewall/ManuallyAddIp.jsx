import { useState } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import Stack from '@mui/material/Stack';

const IP_REGEX =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const CIDR_REGEX =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
const IPV6_REGEX =
	/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:(:([0-9a-fA-F]{1,4})){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;

function isValidIp( value ) {
	if ( ! value ) {
		return false;
	}
	const trimmed = value.trim();
	return IP_REGEX.test( trimmed ) || IPV6_REGEX.test( trimmed );
}

function isValidCidr( value ) {
	if ( ! value ) {
		return false;
	}
	return CIDR_REGEX.test( value.trim() );
}

function isValidIpOrCidr( value ) {
	return isValidIp( value ) || isValidCidr( value );
}

export default function ManuallyAddIp( {
	settings,
	newIp,
	setNewIp,
	onMutate = null,
} ) {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const [ ipError, setIpError ] = useState( '' );
	const [ adding, setAdding ] = useState( false );

	const listType = settings.mode === 'whitelist' ? 'whitelist' : 'blacklist';

	const handleNewIpChange = ( e ) => {
		setNewIp( e.target.value );
		setIpError( '' );
	};

	const handleAddIp = async () => {
		const trimmed = newIp.trim();

		if ( ! trimmed ) {
			setIpError(
				__( 'Please enter an IP address', 'rest-api-firewall' )
			);
			return;
		}

		if ( isValidCidr( trimmed ) && ! hasValidLicense ) {
			setIpError(
				__( 'CIDR ranges require Pro license', 'rest-api-firewall' )
			);
			return;
		}

		if ( ! isValidIpOrCidr( trimmed ) ) {
			setIpError( __( 'Invalid IP address', 'rest-api-firewall' ) );
			return;
		}

		setAdding( true );
		setIpError( '' );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'add_ip_entry',
					nonce: adminData.nonce,
					ip: trimmed,
					list_type: listType,
					entry_type: 'manual',
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setNewIp( '' );
				if ( onMutate ) {
					await onMutate();
				}
			} else {
				setIpError(
					result?.data?.message ||
						__( 'Failed to add IP', 'rest-api-firewall' )
				);
			}
		} catch ( error ) {
			setIpError( error.message );
		} finally {
			setAdding( false );
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAddIp();
		}
	};

    return (<Box sx={ { flex: 1 } }>
        <Typography variant="subtitle2" sx={ { mb: 1 } }>
            { __( 'Add IP Address Manually', 'rest-api-firewall' ) }
        </Typography>
        <Stack direction="row" spacing={ 1 }>
            <TextField
                value={ newIp }
                onChange={ handleNewIpChange }
                onKeyDown={ handleKeyDown }
                placeholder={
                    hasValidLicense
                        ? '192.168.1.1 or 10.0.0.0/24'
                        : '192.168.1.1'
                }
                size="small"
                error={ !! ipError }
                helperText={
                    ipError ||
                    ( hasValidLicense
                        ? __(
                                'IP address or CIDR range',
                                'rest-api-firewall'
                        )
                        : __(
                                'IP address (CIDR requires Pro)',
                                'rest-api-firewall'
                        ) )
                }
                disabled={ ! settings.enabled || adding }
                sx={ { flexGrow: 1 } }
            />
            <Button
                variant="outlined"
                sx={ { alignSelf: 'flex-start' } }
                onClick={ handleAddIp }
                disabled={ ! settings.enabled || ! newIp.trim() || adding }
                startIcon={ <AddIcon /> }
            >
                { adding
                    ? __( 'Adding…', 'rest-api-firewall' )
                    : __( 'Add', 'rest-api-firewall' ) }
            </Button>
        </Stack>
    </Box>);
}