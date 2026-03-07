import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import { DataGrid } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';

import { isValidIpOrCidr } from '../../../utils/sanitizeIp';

export default function IpDataGrid( { listType = 'blacklist' } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = ( hasValidLicense && proNonce ) ? proNonce : adminData.nonce;
	const { __ } = wp.i18n || {};

	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ paginationModel, setPaginationModel ] = useState( {
		page: 0,
		pageSize: 25,
	} );
	const [ sortModel, setSortModel ] = useState( [
		{ field: 'blocked_at', sort: 'desc' },
	] );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set( [] ),
	} );

	const [ newIp, setNewIp ] = useState( '' );
	const [ ipError, setIpError ] = useState( '' );
	const [ adding, setAdding ] = useState( false );

	const [ expiryValue, setExpiryValue ] = useState( '' );
	const [ expiryUnit, setExpiryUnit ] = useState( 'days' );
	const [ expiryLoaded, setExpiryLoaded ] = useState( false );
	const [ anchorEl, setAnchorEl ] = useState( null );
	const [ applyToExisting, setApplyToExisting ] = useState( false );

	const saveTimeoutRef = useRef( null );

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
			// silent
		} finally {
			setExpiryLoaded( true );
		}
	}, [ adminData, nonce ] );

	useEffect( () => {
		fetchExpiry();
	}, [ fetchExpiry ] );

	useEffect( () => {
		if ( ! expiryLoaded ) return;
		if ( saveTimeoutRef.current ) clearTimeout( saveTimeoutRef.current );
		saveTimeoutRef.current = setTimeout( async () => {
			const expiry_seconds = valueUnitToSeconds( expiryValue, expiryUnit );
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
			} catch ( e ) {
				// silent.
			}
		}, 600 );
		return () => clearTimeout( saveTimeoutRef.current );
	}, [ expiryValue, expiryUnit, expiryLoaded ] );

	const columns = useMemo( () => {
		const baseColumns = [
			{
				field: 'actions',
				headerName: __( 'Actions', 'rest-api-firewall' ),
				width: 80,
				sortable: false,
				filterable: false,
				renderCell: ( params ) => (
					<IconButton
						size="small"
						color="default"
						onClick={ () => handleDeleteOne( params.row.id ) }
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				),
			},
			{
				field: 'ip',
				headerName: __( 'IP Address', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 150,
				renderCell: ( params ) => (
					<Stack direction="row" spacing={ 1 } alignItems="center">
						<Typography
							variant="body2"
							sx={ { fontFamily: 'monospace' } }
						>
							{ params.value }
						</Typography>
						{ params.value?.includes( '/' ) && (
							<Chip
								label="CIDR"
								size="small"
								variant="outlined"
								color="info"
							/>
						) }
					</Stack>
				),
			},
			{
				field: 'entry_type',
				headerName: __( 'Type', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Chip
						label={
							params.value === 'manual'
								? __( 'Manual', 'rest-api-firewall' )
								: __( 'Rate Limit', 'rest-api-firewall' )
						}
						size="small"
						color={
							params.value === 'manual' ? 'default' : 'warning'
						}
						variant="outlined"
					/>
				),
			},
			{
				field: 'country_name',
				headerName: __( 'Country', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
			},
			{
				field: 'blocked_at',
				headerName: __( 'Blocked At', 'rest-api-firewall' ),
				width: 180,
				renderCell: ( params ) => {
					if ( ! params.value ) {
						return '-';
					}
					return new Date( params.value ).toLocaleString();
				},
			},
			{
				field: 'expires_at',
				headerName: __( 'Expires At', 'rest-api-firewall' ),
				width: 180,
				renderCell: ( params ) => {
					if ( ! params.value ) {
						return __( 'Never', 'rest-api-firewall' );
					}
					return new Date( params.value ).toLocaleString();
				},
			},
			{
				field: 'agent',
				headerName: __( 'Agent', 'rest-api-firewall' ),
				width: 180,
				renderCell: ( params ) => {
					if ( ! params.value ) {
						return '-';
					}
					return params.value;
				},
			},
		];

		return baseColumns;
	}, [ hasValidLicense, __ ] );

	const fetchEntries = useCallback( async () => {
		setLoading( true );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_ip_entries',
					nonce,
					list_type: listType,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setRows( result.data.entries || [] );
			}
		} catch ( error ) {
			setIpError(
				'Error fetching IP entries:' + JSON.stringify( error )
			);
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, listType ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleAddIp = async () => {
		const trimmed = newIp.trim();

		if ( ! trimmed ) {
			setIpError(
				hasValidLicense
					? __(
							'Please enter an IP address or CIDR range',
							'rest-api-firewall'
					  )
					: __(
							'Please enter a valid IP address',
							'rest-api-firewall'
					  )
			);
			return;
		}

		if ( ! isValidIpOrCidr( trimmed, hasValidLicense ) ) {
			setIpError(
				hasValidLicense
					? __(
							'Invalid IP address or CIDR range',
							'rest-api-firewall'
					  )
					: __( 'Invalid IP address', 'rest-api-firewall' )
			);
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
					nonce,
					ip: trimmed,
					list_type: listType,
					entry_type: 'manual',
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setNewIp( '' );
				if ( result?.data?.entry ) {
					setRows( ( prev ) => [ result.data.entry, ...prev ] );
				} else {
					fetchEntries();
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

	const handleDeleteOne = async ( id ) => {
		setRows( ( prev ) => prev.filter( ( row ) => row.id !== id ) );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'delete_ip_entry',
					nonce,
					id,
					list_type: listType,
				} ),
			} );

			const result = await response.json();

			if ( ! result?.success ) {
				fetchEntries();
			}
		} catch ( error ) {
			setIpError( 'Error deleting IP entry:' + JSON.stringify( error ) );
			fetchEntries();
		}
	};

	const handleDeleteSelected = async () => {
		if ( rowSelectionModel && rowSelectionModel.ids.size === 0 ) {
			return;
		}

		const selectedIds = [ ...rowSelectionModel.ids ];
		const selectedSet = new Set( selectedIds );

		setRows( ( prev ) =>
			prev.filter( ( row ) => ! selectedSet.has( row.id ) )
		);
		setRowSelectionModel( { type: 'include', ids: new Set() } );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'delete_ip_entries',
					nonce,
					ids: JSON.stringify( selectedIds ),
					list_type: listType,
				} ),
			} );

			const result = await response.json();

			if ( ! result?.success ) {
				fetchEntries();
			}
		} catch ( error ) {
			setIpError(
				'Error deleting IP entries:' + JSON.stringify( error )
			);
			fetchEntries();
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAddIp();
		}
	};

	return (
		<Box>
			<Toolbar disableGutters sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }>
				<TextField
					value={ newIp }
					onChange={ ( e ) => {
						setNewIp( e.target.value );
						setIpError( '' );
					} }
					onKeyDown={ handleKeyDown }
					placeholder={
						hasValidLicense
							? __(
									'192.168.1.1 or 10.0.0.0/24',
									'rest-api-firewall'
							  )
							: __( '192.168.1.1', 'rest-api-firewall' )
					}
					size="small"
					error={ !! ipError }
					helperText={ ipError }
					sx={ { minWidth: 250 } }
				/>
				<Button
					variant="contained"
					size="small"
					disableElevation
					onClick={ handleAddIp }
					disabled={ adding || ! newIp.trim() }
					startIcon={ <AddIcon /> }
				>
					{ hasValidLicense
						? __( 'Add IP or CIDR', 'rest-api-firewall' )
						: __( 'Add IP', 'rest-api-firewall' ) }
				</Button>

				<Box sx={ { flexGrow: 1 } } />



				{ hasValidLicense && rowSelectionModel.ids.size > 0 && (
					<Button
						variant="outlined"
						color="error"
						size="small"
						onClick={ handleDeleteSelected }
						startIcon={ <DeleteOutlineIcon /> }
					>
						{ __( 'Delete', 'rest-api-firewall' ) } (
						{ rowSelectionModel.ids.size })
					</Button>
				) }

				<Stack direction="row" spacing={ 1 } alignItems="center">
					<TextField
						type="number"
						value={ expiryValue }
						onChange={ ( e ) => setExpiryValue( e.target.value ) }
						placeholder={ __( 'Never', 'rest-api-firewall' ) }
						label={ __( 'Release in', 'rest-api-firewall' ) }
						size="small"
						sx={ { width: 110 } }
					/>
					<Select
						value={ expiryUnit }
						onChange={ ( e ) => setExpiryUnit( e.target.value ) }
						size="small"
						sx={ { minWidth: 90 } }
					>
						<MenuItem value="hours">{ __( 'Hours', 'rest-api-firewall' ) }</MenuItem>
						<MenuItem value="days">{ __( 'Days', 'rest-api-firewall' ) }</MenuItem>
						<MenuItem value="weeks">{ __( 'Weeks', 'rest-api-firewall' ) }</MenuItem>
						<MenuItem value="months">{ __( 'Months', 'rest-api-firewall' ) }</MenuItem>
					</Select>
					<FormControlLabel
						control={
							<Checkbox
								checked={ applyToExisting }
								onChange={ ( e ) =>
									setApplyToExisting( e.target.checked )
								}
								size="small"
								disabled={ ! expiryValue }
							/>
						}
						label={
							<Typography variant="body2">
								{ __( 'Apply to existing', 'rest-api-firewall' ) }
							</Typography>
						}
						sx={ { m: 0 } }
					/>
				</Stack>

				<IconButton onClick={ fetchEntries } disabled={ loading }>
					<RefreshIcon />
				</IconButton>
			</Toolbar>

			<DataGrid
				showToolbar={ !! hasValidLicense }
				rows={ rows }
				columns={ columns }
				loading={ loading }
				pageSizeOptions={ [ 10, 25, 50, 100 ] }
				paginationModel={ paginationModel }
				onPaginationModelChange={ setPaginationModel }
				sortModel={ sortModel }
				onSortModelChange={ setSortModel }
				checkboxSelection={ !! hasValidLicense }
				disableRowSelectionOnClick
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ setRowSelectionModel }
				sx={ {
					'& .MuiDataGrid-cell': {
						display: 'flex',
						alignItems: 'center',
					},
				} }
			/>
		</Box>
	);
}
