import { useState, useCallback } from '@wordpress/element';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import { isValidIpOrCidr } from '../../../utils/sanitizeIp';

/**
 * Controlled repeater for allowed IP addresses / CIDR ranges.
 * The parent is responsible for loading and persisting the data.
 *
 * @param {object}   props
 * @param {string[]} props.value   - Current list of IPs/CIDRs.
 * @param {Function} props.onChange - Called with updated array when the list changes.
 * @param {boolean}  props.saving  - Shows loading state on the Save button.
 * @param {Function} props.onSave  - Called when the user clicks Save inside the popover.
 */
export default function AllowedIps( { value = [], onChange, saving = false, onSave, maxEntries } ) {
	const { __ } = wp.i18n || {};

	const [ input, setInput ] = useState( '' );
	const [ inputError, setInputError ] = useState( '' );
	const [ anchorEl, setAnchorEl ] = useState( null );
	const open = Boolean( anchorEl );

	const atLimit = maxEntries !== undefined && value.length >= maxEntries;

	const handleAdd = useCallback( () => {
		const val = input.trim();
		if ( ! val ) return;
		if ( atLimit ) return;
		if ( ! isValidIpOrCidr( val, true ) ) {
			setInputError( __( 'Invalid IP address or CIDR range.', 'rest-api-firewall' ) );
			return;
		}
		if ( value.includes( val ) ) {
			setInputError( __( 'Already in the list.', 'rest-api-firewall' ) );
			return;
		}
		onChange?.( [ ...value, val ] );
		setInput( '' );
		setInputError( '' );
	}, [ input, value, onChange, atLimit, __ ] );

	const countLabel = value.length > 0
		? `${ value.length } ${ __( 'IP(s)', 'rest-api-firewall' ) }`
		: '';

	return (
		<>
			<Stack direction="row" alignItems="center" gap={ 1 }>
				{ countLabel && (
					<Chip size="small" variant="outlined" label={ countLabel } />
				) }
				<Button
					size="small"
					variant="text"
					onClick={ ( e ) => setAnchorEl( e.currentTarget ) }
				>
					{ __( 'Set Allowed IPs', 'rest-api-firewall' ) }
				</Button>
			</Stack>

			<Popover
				open={ open }
				anchorEl={ anchorEl }
				onClose={ () => setAnchorEl( null ) }
				anchorOrigin={ { vertical: 'bottom', horizontal: 'right' } }
				transformOrigin={ { vertical: 'top', horizontal: 'right' } }
			>
				<Paper sx={ { p: 2, maxWidth: 420 } }>
					<Stack spacing={ 1.5 }>
						<Typography variant="subtitle2" fontWeight={ 600 }>
							{ __( 'Allowed IPs', 'rest-api-firewall' ) }
						</Typography>

						<Stack direction="row" spacing={ 1 } alignItems="flex-start">
							<TextField
								size="small"
								fullWidth
								placeholder="192.168.1.1 or 10.0.0.0/24"
								value={ input }
								onChange={ ( e ) => { setInput( e.target.value ); setInputError( '' ); } }
								onKeyDown={ ( e ) => { if ( e.key === 'Enter' ) handleAdd(); } }
								error={ !! inputError }
								helperText={ inputError || __( 'IPv4, IPv6, or CIDR range', 'rest-api-firewall' ) }
							/>
							<Button
								variant="outlined"
								size="small"
								onClick={ handleAdd }
								disabled={ ! input.trim() || saving || atLimit }
								sx={ { flexShrink: 0, mt: '2px' } }
								startIcon={ <AddIcon /> }
							>
								{ __( 'Add', 'rest-api-firewall' ) }
							</Button>
						</Stack>
						{ atLimit && maxEntries !== undefined && (
							<Typography variant="caption" color="warning.main">
								{ `Max ${ maxEntries } IP${ maxEntries === 1 ? '' : 's' } allowed on free tier` }
							</Typography>
						) }

						{ value.length > 0 && (
							<Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
								{ value.map( ( ip ) => (
									<Chip
										key={ ip }
										label={ ip }
										size="small"
										variant="outlined"
										sx={ { fontFamily: 'monospace' } }
										onDelete={ () => onChange?.( value.filter( ( v ) => v !== ip ) ) }
									/>
								) ) }
							</Box>
						) }

						<Stack direction="row" justifyContent="flex-end" spacing={ 1 }>
							<Button size="small" onClick={ () => setAnchorEl( null ) }>
								{ __( 'Close', 'rest-api-firewall' ) }
							</Button>
							{ onSave && (
								<Button
									size="small"
									variant="contained"
									disableElevation
									onClick={ () => { onSave(); setAnchorEl( null ); } }
									disabled={ saving }
								>
									{ saving ? __( 'Saving…', 'rest-api-firewall' ) : __( 'Save', 'rest-api-firewall' ) }
								</Button>
							) }
						</Stack>

						<Divider />

						<Alert severity="warning" icon={ <WarningAmberOutlinedIcon fontSize="small" /> }>
							{ __( 'IP-based access control can be bypassed behind a CDN or proxy. Always combine with authentication.', 'rest-api-firewall' ) }
						</Alert>
					</Stack>
				</Paper>
			</Popover>
		</>
	);
}
