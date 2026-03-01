import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import { DataGrid } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import ApplicationEditor from './ApplicationEditor';
import useProActions from '../../hooks/useProActions';

export default function Applications() {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { remove } = useProActions();

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

	const [ fetchError, setFetchError ] = useState( '' );

	const [ editingApp, setEditingApp ] = useState( null );

	const handleDeleteOne = useCallback(
		( id, title ) => {
			remove(
				{ action: 'delete_application_entry', id },
				{
					confirmTitle: __(
						'Delete Application',
						'rest-api-firewall'
					),
					confirmMessage: title
						? `${ __(
								'Permanently delete',
								'rest-api-firewall'
						  ) } "${ title }"? ${ __(
								'This action cannot be undone.',
								'rest-api-firewall'
						  ) }`
						: __(
								'Permanently delete this application? This action cannot be undone.',
								'rest-api-firewall'
						  ),
					confirmLabel: __( 'Delete', 'rest-api-firewall' ),
					onSuccess: () =>
						setRows( ( prev ) =>
							prev.filter( ( row ) => row.id !== id )
						),
				}
			);
		},
		[ remove, __ ]
	);

	const columns = useMemo(
		() => [
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
							handleDeleteOne( params.row.id, params.row.title )
						}
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				),
			},
			{
				field: 'active',
				headerName: __( 'Active', 'rest-api-firewall' ),
				width: 100,
				renderCell: ( params ) =>
					params.value ? (
						<Chip
							label={ __( 'Active', 'rest-api-firewall' ) }
							size="small"
							color="success"
							variant="outlined"
						/>
					) : (
						<Chip
							label={ __( 'Inactive', 'rest-api-firewall' ) }
							size="small"
							variant="outlined"
						/>
					),
			},
			{
				field: 'title',
				headerName: __( 'Title', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 150,
				renderCell: ( params ) => (
					<Stack
						direction="row"
						spacing={ 0.5 }
						alignItems="center"
						sx={ { cursor: 'pointer' } }
						onClick={ () => setEditingApp( params.row ) }
					>
						<Typography
							variant="body2"
							sx={ {
								fontFamily: 'monospace',
								color: 'primary.main',
								'&:hover': { textDecoration: 'underline' },
							} }
						>
							{ params.value }
						</Typography>
						<OpenInNewIcon
							sx={ { fontSize: 13, color: 'text.disabled' } }
						/>
					</Stack>
				),
			},
			{
				field: 'clients',
				headerName: __( 'Clients', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value ?? '-' }
					</Typography>
				),
			},
			{
				field: 'users',
				headerName: __( 'Users', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value ?? '-' }
					</Typography>
				),
			},
			{
				field: 'policy',
				headerName: __( 'Policy Loaded', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography variant="body2">
						{ params.value
							? __( 'Yes', 'rest-api-firewall' )
							: '-' }
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
		],
		[ hasValidLicense, handleDeleteOne, __ ]
	);

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
			setFetchError(
				'Error fetching application entries:' + JSON.stringify( error )
			);
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleDeleteSelected = () => {
		const selectedIds = [ ...rowSelectionModel.ids ];
		const count = selectedIds.length;
		if ( count === 0 ) {
			return;
		}

		const selectedSet = new Set( selectedIds );

		remove(
			{
				action: 'delete_application_entries',
				ids: JSON.stringify( selectedIds ),
			},
			{
				confirmTitle: __( 'Delete Applications', 'rest-api-firewall' ),
				confirmMessage: `${ count } ${ __(
					'applications will be permanently deleted. This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					setRows( ( prev ) =>
						prev.filter( ( row ) => ! selectedSet.has( row.id ) )
					);
					setRowSelectionModel( { type: 'include', ids: new Set() } );
				},
			}
		);
	};

	if ( editingApp ) {
		return (
			<ApplicationEditor
				application={ editingApp }
				onBack={ () => {
					setEditingApp( null );
					fetchEntries();
				} }
			/>
		);
	}

	return (
		<Stack spacing={ 2 } p={ { xs: 2, sm: 4 } }>
			<Toolbar disableGutters sx={ { gap: 2, flexWrap: 'wrap' } }>
				<Button
					variant="contained"
					size="small"
					disableElevation
					onClick={ () =>
						setEditingApp( {
							id: null,
							title: '',
							active: false,
							policy: false,
						} )
					}
				>
					{ __( 'New Application', 'rest-api-firewall' ) }
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

			{ fetchError && (
				<Typography variant="body2" color="error">
					{ fetchError }
				</Typography>
			) }

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
