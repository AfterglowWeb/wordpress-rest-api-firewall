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

import WebhookEditor from './WebhookEditor';
import useProActions from '../../hooks/useProActions';

export default function Webhooks() {
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

	const [ editingWebhook, setEditingWebook ] = useState( null );

	const handleDeleteOne = useCallback(
		( id, title ) => {
			remove(
				{ action: 'delete_webhook_entry', id },
				{
					confirmTitle: __(
						'Delete Webhook',
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
								'Permanently delete this webhook? This action cannot be undone.',
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
						onClick={ () => setEditingWebook( params.row ) }
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
				field: 'endpoint',
				headerName: __( 'Endpoint', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 160,
				renderCell: ( params ) => (
					<Typography
						variant="body2"
						sx={ {
							fontFamily: 'monospace',
							fontSize: '0.8rem',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						} }
						title={ params.value }
					>
						{ params.value || '-' }
					</Typography>
				),
			},
			{
				field: 'method',
				headerName: __( 'Method', 'rest-api-firewall' ),
				width: 90,
				renderCell: ( params ) =>
					params.value ? (
						<Chip
							label={ params.value }
							size="small"
							variant="outlined"
							sx={ { fontFamily: 'monospace', fontWeight: 600 } }
						/>
					) : (
						'-'
					),
			},
			{
				field: 'type',
				headerName: __( 'Type', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) =>
					params.value && params.value !== 'general' ? (
						<Chip
							label={ params.value }
							size="small"
							variant="outlined"
						/>
					) : (
						<Typography variant="body2" color="text.secondary">
							{ params.value || '-' }
						</Typography>
					),
			},
			{
				field: 'headers',
				headerName: __( 'Headers', 'rest-api-firewall' ),
				width: 100,
				renderCell: ( params ) => {
					const count = Array.isArray( params.value ) ? params.value.length : 0;
					return count > 0 ? (
						<Chip label={ `${ count }` } size="small" variant="outlined" />
					) : (
						<Typography variant="body2" color="text.disabled">{ '-' }</Typography>
					);
				},
			},
			{
				field: 'timeout_seconds',
				headerName: __( 'Timeout (s)', 'rest-api-firewall' ),
				width: 100,
				renderCell: ( params ) => params.value ?? '-',
			},
			{
				field: 'retry_count',
				headerName: __( 'Retries', 'rest-api-firewall' ),
				width: 80,
				renderCell: ( params ) => params.value !== undefined ? params.value : '-',
			},
			{
				field: 'body_payload',
				headerName: __( 'Body', 'rest-api-firewall' ),
				width: 110,
				renderCell: ( params ) =>
					params.value ? (
						<Typography
							variant="caption"
							sx={ { fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100, color: 'text.secondary' } }
							title={ params.value }
						>
							{ params.value }
						</Typography>
					) : (
						<Typography variant="body2" color="text.disabled">{ '-' }</Typography>
					),
			},
            {
				field: 'author',
				headerName: __( 'Author', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
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
					action: 'get_webhook_entries',
					nonce,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setRows( result.data.entries || [] );
			}
		} catch ( error ) {
			setFetchError(
				'Error fetching webhook entries:' + JSON.stringify( error )
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
				action: 'delete_webhook_entries',
				ids: JSON.stringify( selectedIds ),
			},
			{
				confirmTitle: __( 'Delete Webhooks', 'rest-api-firewall' ),
				confirmMessage: `${ count } ${ __(
					'webhooks will be permanently deleted. This action cannot be undone.',
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

	if ( editingWebhook ) {
		return (
			<WebhookEditor
				webhook={ editingWebhook }
				onBack={ () => {
					setEditingWebook( null );
					fetchEntries();
				} }
			/>
		);
	}

	return (
		<Stack spacing={ 2 } p={ { xs: 2, sm: 4 } }>
			<Toolbar disableGutters sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }>
				<Button
					variant="contained"
					size="small"
					disableElevation
					onClick={ () =>
						setEditingWebook( {
							id: null,
							title: '',
							active: true,
							method: 'POST',
							type: 'general',
							headers: [],
							timeout_seconds: 10,
							retry_count: 0,
							body_payload: '',
						} )
					}
				>
					{ __( 'New Webhook', 'rest-api-firewall' ) }
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
