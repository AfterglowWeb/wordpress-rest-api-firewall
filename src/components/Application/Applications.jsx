import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import { DataGrid } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export default function Applications() {
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
		{ field: 'date_created', sort: 'desc' },
	] );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set( [] ),
	} );

	const [ newApplication, setNewApplication ] = useState( '' );
	const [ applicationError, setApplicationError ] = useState( '' );
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
						onClick={ () => handleDeleteOne( params.row.id ) }
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				),
			},
			{
				field: 'active',
				headerName: __( 'Active', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value || '-' }
					</Typography>
				),
			},
			{
				field: 'title',
				headerName: __( 'Title', 'rest-api-firewall' ),
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
					</Stack>
				),
			},
			{
				field: 'clients',
				headerName: __( 'Clients', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value || '-' }
					</Typography>
				),
			},
			{
				field: 'users',
				headerName: __( 'Users', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value || '-' }
					</Typography>
				),
			},
			{
				field: 'policy',
				headerName: __( 'Policy Loaded', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value || '-' }
					</Typography>
				),
			},
			{
				field: 'date_created',
				headerName: __( 'Date Created', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
			},
			{
				field: 'date_modified',
				headerName: __( 'Date Modified', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
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
					action: 'get_application_entries',
					nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setRows( result.data.entries || [] );
			}
		} catch ( error ) {
			setApplicationError(
				'Error fetching application entries:' + JSON.stringify( error )
			);
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, listType ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleAddApplication = async () => {
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'add_application_entry',
					nonce,
					data: { data: {} },
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				setNewApplication( '' );
				setRows( ( prev ) => [ result.data.entry, ...prev ] );
			} else {
				setApplicationError(
					result?.data?.message ||
						__( 'Failed to add application', 'rest-api-firewall' )
				);
			}
		} catch ( error ) {
			setApplicationError( error.message );
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
					action: 'delete_application_entry',
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
			setApplicationError(
				'Error deleting application entry:' + JSON.stringify( error )
			);
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
					action: 'delete_application_entries',
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
			setApplicationError(
				'Error deleting applications:' + JSON.stringify( error )
			);
			fetchEntries();
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAddApplication();
		}
	};

	return (
		<Stack spacing={ 2 }>
			<Toolbar disableGutters sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }>
				<TextField
					value={ newApplication }
					onChange={ ( e ) => {
						setNewApplication( e.target.value );
						setApplicationError( '' );
					} }
					onKeyDown={ handleKeyDown }
					placeholder={ __(
						'Application Title',
						'rest-api-firewall'
					) }
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
					{ __( 'Create Application', 'rest-api-firewall' ) }
				</Button>

				<Box sx={ { flexGrow: 1 } } />

				{ rowSelectionModel.ids.size > 0 && (
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
				showToolbar={ true }
				rows={ rows }
				columns={ columns }
				loading={ loading }
				pageSizeOptions={ [ 10, 25, 50, 100 ] }
				paginationModel={ paginationModel }
				onPaginationModelChange={ setPaginationModel }
				sortModel={ sortModel }
				onSortModelChange={ setSortModel }
				checkboxSelection={ true }
				disableRowSelectionOnClick={ true }
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ setRowSelectionModel }
				sx={ {
					'& .MuiDataGrid-cell': {
						display: 'flex',
						alignItems: 'center',
					},
				} }
			/>
		</Stack>
	);
}
