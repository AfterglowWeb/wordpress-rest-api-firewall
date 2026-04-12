import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export default function ReleaseTime( { listType = 'blacklist', rowSelectionModel, onExpirySaved } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = ( hasValidLicense && proNonce ) ? proNonce : adminData.nonce;
	const { __ } = wp.i18n || {};

	const [ expiryValue, setExpiryValue ] = useState( '' );
	const [ expiryUnit, setExpiryUnit ] = useState( 'days' );

	const [ pendingExpiryValue, setPendingExpiryValue ] = useState( '' );
	const [ pendingExpiryUnit, setPendingExpiryUnit ] = useState( 'days' );
	const [ savingExpiry, setSavingExpiry ] = useState( false );
	const [ applyToAll, setApplyToAll ] = useState( false );

	const [ anchorEl, setAnchorEl ] = useState( null );
	const expiryPopoverOpen = Boolean( anchorEl );

	const valueUnitToSeconds = ( val, unit ) => {
		const v = parseInt( val, 10 );
		if ( ! v || v <= 0 ) return 0;
		const map = { hours: 3600, days: 86400, weeks: 604800, months: 2592000 };
		return v * ( map[ unit ] ?? 86400 );
	};

	const secondsToValueUnit = ( seconds ) => {
		if ( ! seconds || seconds <= 0 ) return { value: '', unit: 'days' };
		if ( seconds % 2592000 === 0 ) return { value: String( seconds / 2592000 ), unit: 'months' };
		if ( seconds % 604800 === 0 ) return { value: String( seconds / 604800 ), unit: 'weeks' };
		if ( seconds % 86400 === 0 ) return { value: String( seconds / 86400 ), unit: 'days' };
		return { value: String( Math.round( seconds / 3600 ) ), unit: 'hours' };
	};

	const fetchExpiry = useCallback( async () => {
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( { action: 'get_ip_filter', nonce } ),
			} );
			const result = await response.json();
			if ( result?.success && result?.data ) {
				const parsed = secondsToValueUnit(
					result.data.expiry_seconds ?? 0
				);
				setExpiryValue( parsed.value );
				setExpiryUnit( parsed.unit );
			}
		} catch ( e ) {
			// Silent fail.
		}
	}, [ adminData, nonce ] );

	useEffect( () => {
		fetchExpiry();
	}, [ fetchExpiry ] );

	const handleOpenExpiryPopover = ( e ) => {
		setPendingExpiryValue( expiryValue );
		setPendingExpiryUnit( expiryUnit );
		setApplyToAll( false );
		setAnchorEl( e.currentTarget );
	};

	const handleCloseExpiryPopover = () => {
		setAnchorEl( null );
	};

	const handleSaveExpiry = async () => {
		setSavingExpiry( true );
		const expiry_seconds = valueUnitToSeconds( pendingExpiryValue, pendingExpiryUnit );
		try {
			await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'save_ip_filter',
					nonce,
					expiry_seconds,
				} ),
			} );
			setExpiryValue( pendingExpiryValue );
			setExpiryUnit( pendingExpiryUnit );

			const selectedIds = rowSelectionModel ? [ ...rowSelectionModel.ids ] : [];
			const hasSelection = selectedIds.length > 0;

			if ( hasValidLicense && ( hasSelection || applyToAll ) ) {
				const body = {
					action: 'update_entries_expiry',
					nonce,
					list_type: listType,
				};
				if ( hasSelection && ! applyToAll ) {
					body.ids = JSON.stringify( selectedIds );
				}
				await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded; charset=UTF-8',
					},
					body: new URLSearchParams( body ),
				} );
				onExpirySaved?.();
			}
		} catch ( e ) {
			// Silent fail.
		} finally {
			setSavingExpiry( false );
			setAnchorEl( null );
		}
	};

	const expiryLabel = useMemo( () => {
		if ( ! expiryValue ) {
			return '';
		}
		const unitLabels = { hours: __( 'h', 'rest-api-firewall' ), days: __( 'd.', 'rest-api-firewall' ), weeks: __( 'w.', 'rest-api-firewall' ), months: __( 'mo.', 'rest-api-firewall' ) };
		return `${ __( 'Release Time', 'rest-api-firewall' ) } ${ expiryValue }${ unitLabels[ expiryUnit ] ?? expiryUnit }`;
	}, [ expiryValue, expiryUnit, __ ] );

	return (
		<>
			<Tooltip
				title={
					! hasValidLicense
						? __( 'Release time is a Pro feature', 'rest-api-firewall' )
						: ''
				}
			>
				<Stack spacing={ 0.5 } direction="row" alignItems="center" gap={ 1 }>
					<Chip size="small" variant="outlined" label={ expiryLabel } />
					<Button
						size="small"
						variant="text"
						onClick={ handleOpenExpiryPopover }
					>
						{ __( 'Set Release Time', 'rest-api-firewall' ) }
					</Button>
				</Stack>
			</Tooltip>

			<Popover
				open={ expiryPopoverOpen }
				anchorEl={ anchorEl }
				onClose={ handleCloseExpiryPopover }
				anchorOrigin={ { vertical: 'bottom', horizontal: 'right' } }
				transformOrigin={ { vertical: 'top', horizontal: 'right' } }
			>
				<Paper sx={ { p: 2, maxWidth: 220 } }>
					<Stack spacing={ 1 }>
						<Typography variant="subtitle2" gutterBottom fontWeight={600}>
							{ __( 'Release Time', 'rest-api-firewall' ) }
						</Typography>
						
						<Stack spacing={ 1 }>
                            <Stack pt={ 1 } direction="row" gap={ 1 } alignItems="flex-start">
                                <TextField
                                    type="number"
                                    value={ pendingExpiryValue }
                                    onChange={ ( e ) => setPendingExpiryValue( e.target.value ) }
                                    placeholder={ __( 'Never', 'rest-api-firewall' ) }
                                    label={ __( 'Duration', 'rest-api-firewall' ) }
                                    size="small"
                                    disabled={ ! hasValidLicense }
                                    sx={ { width: 110 } }
                                />
                                <Select
                                    value={ pendingExpiryUnit }
                                    onChange={ ( e ) => setPendingExpiryUnit( e.target.value ) }
                                    size="small"
                                    disabled={ ! hasValidLicense }
                                    sx={ { minWidth: 100 } }
                                >
                                    <MenuItem value="hours">{ __( 'Hours', 'rest-api-firewall' ) }</MenuItem>
                                    <MenuItem value="days">{ __( 'Days', 'rest-api-firewall' ) }</MenuItem>
                                    <MenuItem value="weeks">{ __( 'Weeks', 'rest-api-firewall' ) }</MenuItem>
                                    <MenuItem value="months">{ __( 'Months', 'rest-api-firewall' ) }</MenuItem>
                                </Select>
                            </Stack>
                        


                            { rowSelectionModel?.ids.size > 0 ? (
                                <Typography variant="body2" color="primary">
                                    { rowSelectionModel.ids.size }{ ' ' }
                                    { __( 'Selected entries will be updated.', 'rest-api-firewall' ) }
                                </Typography>
                            ) : (
                                <FormControlLabel
                                    disabled={ ! hasValidLicense || ! pendingExpiryValue }
                                    control={
                                        <Checkbox
                                            checked={ applyToAll }
                                            onChange={ ( e ) => setApplyToAll( e.target.checked ) }
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" color={ hasValidLicense ? 'text.primary' : 'text.disabled' }>
                                            { __( 'Apply to existing entries', 'rest-api-firewall' ) }
                                        </Typography>
                                    }
                                />
                            ) }
                        </Stack>

                        <Stack direction="row" justifyContent="flex-end" spacing={ 1 }>
                            <Button size="small" onClick={ handleCloseExpiryPopover }>
                                { __( 'Cancel', 'rest-api-firewall' ) }
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                disableElevation
                                onClick={ handleSaveExpiry }
                                disabled={ ! hasValidLicense || savingExpiry }
                            >
                                { savingExpiry
                                    ? __( 'Saving…', 'rest-api-firewall' )
                                    : __( 'Save', 'rest-api-firewall' ) }
                            </Button>
                        </Stack>

                        <Divider />

                        <Typography variant="body2" color="text.secondary">
                            { ! hasValidLicense ?
							__( 'Configure release time needs a license.', 
								'rest-api-firewall' 
							)
							:
							 __(
                                'New entries will be automatically released after this delay. Leave empty for no expiry.',
                                'rest-api-firewall'
                            ) }
                        </Typography>

					</Stack>
				</Paper>
			</Popover>
		</>
	);
}
