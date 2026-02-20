import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import { DataGrid, ExportPrint, ExportCsv } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockOutlineIcon from '@mui/icons-material/LockOutline';

const IP_REGEX =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const CIDR_REGEX =
	/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
const IPV6_REGEX =
	/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:(:([0-9a-fA-F]{1,4})){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;

function isValidIpOrCidr( value ) {
	if ( ! value ) {
		return false;
	}
	const trimmed = value.trim();
	return (
		IP_REGEX.test( trimmed ) ||
		CIDR_REGEX.test( trimmed ) ||
		IPV6_REGEX.test( trimmed )
	);
}

export default function IpDataGrid( {
	listType = 'blacklist',
} ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
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
						onClick={ () =>
							handleDeleteOne( params.row.id )
						}
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
			console.error( 'Error fetching IP entries:', error );
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
				__( 'Please enter an IP address', 'rest-api-firewall' )
			);
			return;
		}

		if ( ! isValidIpOrCidr( trimmed ) ) {
			setIpError(
				__( 'Invalid IP address or CIDR range', 'rest-api-firewall' )
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

			if ( result?.success && result?.data?.entry ) {
				setNewIp( '' );
				setRows( ( prev ) => [ result.data.entry, ...prev ] );
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
			console.error( 'Error deleting IP entry:', error );
			fetchEntries();
		}
	};

	const handleDeleteSelected = async () => {
		if ( rowSelectionModel && rowSelectionModel.ids.size === 0 ) {
			return;
		}

		const selectedIds = [ ...rowSelectionModel.ids ];
		const selectedSet = new Set( selectedIds );

		setRows( ( prev ) => prev.filter( ( row ) => ! selectedSet.has( row.id ) ) );
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
			console.error( 'Error deleting IP entries:', error );
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
			{ ! hasValidLicense && (
				<Alert
					severity="info"
					icon={ <LockOutlineIcon /> }
					sx={ { mb: 2 } }
				>
					{ __(
						'Upgrade to Pro for advanced IP management: Add IP, add CIDR, block by country, block by CIDR, bulk delete, set retention time, export and more.',
						'rest-api-firewall'
					) }
				</Alert>
			) }

			<Toolbar disableGutters sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }>
				{ hasValidLicense && (
					<>
						<TextField
							value={ newIp }
							onChange={ ( e ) => {
								setNewIp( e.target.value );
								setIpError( '' );
							} }
							onKeyDown={ handleKeyDown }
							placeholder="192.168.1.1 or 10.0.0.0/24"
							size="small"
							error={ !! ipError }
							helperText={ ipError }
							sx={ { minWidth: 250 } }
						/>
						<Button
							variant="contained"
							size="small"
							onClick={ handleAddIp }
							disabled={ adding || ! newIp.trim() }
							startIcon={ <AddIcon /> }
						>
							{ __( 'Add IP or CIDR', 'rest-api-firewall' ) }
						</Button>
					</>
				) }

				<Box sx={ { flexGrow: 1 } } />


					<IconButton onClick={ fetchEntries } disabled={ loading }>
						<RefreshIcon />
					</IconButton>
		

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
			</Toolbar>

			<DataGrid
				showToolbar
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
