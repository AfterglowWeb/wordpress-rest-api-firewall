import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import { DataGrid } from '@mui/x-data-grid';
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
	onMutate = null,
} ) {
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ rowCount, setRowCount ] = useState( 0 );
	const [ paginationModel, setPaginationModel ] = useState( {
		page: 0,
		pageSize: 25,
	} );
	const [ sortModel, setSortModel ] = useState( [
		{ field: 'blocked_at', sort: 'desc' },
	] );
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( [] );

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
							handleDeleteOne( params.row.id, params.row.ip )
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
						return __( 'Unknown', 'rest-api-firewall' );
					}
					return new Date( params.value ).toLocaleString();
				},
			},
		];

		return baseColumns;
	}, [ hasValidLicense, __ ] );

	const fetchEntries = useCallback( async () => {
		setLoading( true );

		try {
			if ( ! hasValidLicense ) {
				const response = await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded; charset=UTF-8',
					},
					body: new URLSearchParams( {
						action: 'get_ip_filter',
						nonce: adminData.nonce,
					} ),
				} );

				const result = await response.json();

				if ( result?.success && result?.data ) {
					const entries = result.data[ listType ] || [];

					let processedRows = entries
						.map( ( entry, index ) => {
							const ip =
								typeof entry === 'string' ? entry : entry?.ip;
							if ( ! ip ) {
								return null;
							}
							const id = entry?.id || `free-${ index + 1 }`;
							return {
								id,
								actions: '',
								ip,
								entry_type: entry?.entry_type || 'manual',
								country_name: entry?.country_name || null,
								country_code: entry?.country_code || null,
								blocked_at: entry?.blocked_at || null,
								expires_at: entry?.expires_at || null,
								agent: entry?.agent || null,
							};
						} )
						.filter( Boolean );

					if ( filterValue ) {
						const search = filterValue.toLowerCase();
						processedRows = processedRows.filter(
							( row ) =>
								row.ip?.toLowerCase().includes( search ) ||
								row.country_name
									?.toLowerCase()
									.includes( search ) ||
								row.agent?.toLowerCase().includes( search )
						);
					}

					if ( sortModel.length > 0 ) {
						const { field, sort } = sortModel[ 0 ];
						processedRows.sort( ( a, b ) => {
							const aVal = a[ field ] || '';
							const bVal = b[ field ] || '';
							if ( sort === 'asc' ) {
								return aVal > bVal ? 1 : -1;
							}
							return aVal < bVal ? 1 : -1;
						} );
					}

					const total = processedRows.length;
					const start =
						paginationModel.page * paginationModel.pageSize;
					const paginatedRows = processedRows.slice(
						start,
						start + paginationModel.pageSize
					);

					setRows( paginatedRows );
					setRowCount( total );
				}
			} else {
				const sortField = sortModel[ 0 ]?.field || 'blocked_at';
				const sortOrder = sortModel[ 0 ]?.sort?.toUpperCase() || 'DESC';

				const response = await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded; charset=UTF-8',
					},
					body: new URLSearchParams( {
						action: 'get_ip_entries',
						nonce: adminData.nonce,
						list_type: listType,
						page: paginationModel.page + 1,
						per_page: paginationModel.pageSize,
						order_by: sortField,
						order: sortOrder,
						search: filterValue,
					} ),
				} );

				const result = await response.json();

				if ( result?.success && result?.data ) {
					setRows( result.data.entries || [] );
					setRowCount( result.data.total || 0 );
				}
			}
		} catch ( error ) {
			console.error( 'Error fetching IP entries:', error );
		} finally {
			setLoading( false );
		}
	}, [
		adminData,
		hasValidLicense,
		listType,
		paginationModel,
		sortModel,
		filterValue,
	] );

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
				fetchEntries();
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

	const handleDeleteOne = async ( id, ip ) => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'delete_ip_entry',
					nonce: adminData.nonce,
					...( hasValidLicense ? { id } : { ip } ),
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				if ( onMutate ) {
					await onMutate();
				}
				fetchEntries();
			}
		} catch ( error ) {
			console.error( 'Error deleting IP entry:', error );
		} finally {
			setLoading( false );
		}
	};

	const handleDeleteSelected = async () => {
		if ( rowSelectionModel.length === 0 ) {
			return;
		}

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'delete_ip_entries',
					nonce: adminData.nonce,
					ids: JSON.stringify( rowSelectionModel ),
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setRowSelectionModel( [] );
				fetchEntries();
			}
		} catch ( error ) {
			console.error( 'Error deleting IP entries:', error );
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAddIp();
		}
	};

	return (
		<Box sx={ { height: 500, width: '100%' } }>
			{ ! hasValidLicense && (
				<Alert
					severity="info"
					icon={ <LockOutlineIcon /> }
					sx={ { mb: 2 } }
				>
					{ __(
						'Upgrade to Pro for advanced IP management: CIDR support, block by country, block by CIDR, bulk delete, set retention time, export and more.',
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
							{ __( 'Add IP', 'rest-api-firewall' ) }
						</Button>
					</>
				) }

				<Box sx={ { flexGrow: 1 } } />

				<TextField
					value={ filterValue }
					onChange={ ( e ) => setFilterValue( e.target.value ) }
					placeholder={ __( 'Search…', 'rest-api-firewall' ) }
					size="small"
					sx={ { minWidth: 200 } }
				/>

				{ hasValidLicense && (
					<IconButton onClick={ fetchEntries } disabled={ loading }>
						<RefreshIcon />
					</IconButton>
				) }

				{ hasValidLicense && rowSelectionModel.length > 0 && (
					<Button
						variant="outlined"
						color="error"
						size="small"
						onClick={ handleDeleteSelected }
						startIcon={ <DeleteOutlineIcon /> }
					>
						{ __( 'Delete', 'rest-api-firewall' ) } (
						{ rowSelectionModel.length })
					</Button>
				) }
			</Toolbar>

			<DataGrid
				rows={ rows }
				columns={ columns }
				loading={ loading }
				{ ...( hasValidLicense ? { rowCount } : {} ) }
				pageSizeOptions={ [ 10, 25, 50, 100 ] }
				paginationModel={ paginationModel }
				onPaginationModelChange={ setPaginationModel }
				paginationMode={ hasValidLicense ? 'server' : 'client' }
				sortingMode={ hasValidLicense ? 'server' : 'client' }
				sortModel={ sortModel }
				onSortModelChange={ setSortModel }
				checkboxSelection={ hasValidLicense }
				disableRowSelectionOnClick
				{ ...( hasValidLicense
					? {
							rowSelectionModel,
							onRowSelectionModelChange: setRowSelectionModel,
					  }
					: {} ) }
				sx={ {
					'& .MuiDataGrid-cell': {
						display: 'flex',
						alignItems: 'center',
					},
				} }
				localeText={ {
					noRowsLabel: __(
						'No IPs in the list',
						'rest-api-firewall'
					),
					MuiTablePagination: {
						labelRowsPerPage: __(
							'Rows per page:',
							'rest-api-firewall'
						),
					},
				} }
			/>
		</Box>
	);
}
