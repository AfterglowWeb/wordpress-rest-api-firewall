import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import { DataGrid } from '@mui/x-data-grid';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import AutomationEditor from './AutomationEditor';
import HookRegistry from './HookRegistry';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';

export default function Automations() {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { remove } = useProActions();

	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ fetchError, setFetchError ] = useState( '' );
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
	const [ editing, setEditing ] = useState( null );

	const fetchEntries = useCallback( async () => {
		setLoading( true );
		setFetchError( '' );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'get_automation_entries',
					nonce,
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setRows( json.data.entries || [] );
			} else {
				setFetchError(
					json.data?.message ||
						__( 'Failed to load automations', 'rest-api-firewall' )
				);
			}
		} catch {
			setFetchError( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, __ ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleDeleteOne = useCallback(
		( id, label ) => {
			remove(
				{ action: 'delete_automation_entry', id },
				{
					confirmTitle: __(
						'Delete Automation',
						'rest-api-firewall'
					),
					confirmMessage: label
						? `${ __(
								'Permanently delete',
								'rest-api-firewall'
						  ) } "${ label }"? ${ __(
								'This action cannot be undone.',
								'rest-api-firewall'
						  ) }`
						: __(
								'Permanently delete this automation? This action cannot be undone.',
								'rest-api-firewall'
						  ),
					confirmLabel: __( 'Delete', 'rest-api-firewall' ),
					onSuccess: () =>
						setRows( ( prev ) =>
							prev.filter( ( r ) => r.id !== id )
						),
				}
			);
		},
		[ remove, __ ]
	);

	const handleDeleteSelected = useCallback( () => {
		const ids = Array.from( rowSelectionModel.ids );
		if ( ! ids.length ) {
			return;
		}
		remove(
			{ action: 'delete_automation_entries', ids: JSON.stringify( ids ) },
			{
				confirmTitle: __( 'Delete Automations', 'rest-api-firewall' ),
				confirmMessage: `${ __(
					'Permanently delete',
					'rest-api-firewall'
				) } ${ ids.length } ${ __(
					'automation(s)? This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					setRows( ( prev ) =>
						prev.filter( ( r ) => ! ids.includes( r.id ) )
					);
					setRowSelectionModel( {
						type: 'include',
						ids: new Set( [] ),
					} );
				},
			}
		);
	}, [ remove, rowSelectionModel, __ ] );

	const columns = useMemo(
		() => [
			{
				field: '_actions',
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
				field: 'enabled',
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
					<a
					href="#"
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						fontFamily: 'monospace',
						color: 'primary.main',
					} }
					onClick={ () => setEditing( params.row ) }
					>
					{ params.value }
						<OpenInNewIcon
							sx={ { fontSize: 13, color: 'primary.main' } }
						/>
					</a>
				),
			},
			{
				field: 'event',
				headerName: __( 'Event', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 160,
				renderCell: ( { value } ) => (
					<Typography
						variant="body2"
						noWrap
						sx={ { fontFamily: 'monospace', fontSize: '0.8rem' } }
					>
						{ value }
					</Typography>
				),
			},
			{
				field: 'webhook_ids',
				headerName: __( 'Webhooks', 'rest-api-firewall' ),
				width: 100,
				sortable: false,
				renderCell: ( { value } ) =>
					value?.length ? (
						<Chip
							label={ value.length }
							size="small"
							color="primary"
							sx={ { height: 22 } }
						/>
					) : (
						<Typography variant="caption" color="text.disabled">
							—
						</Typography>
					),
			},
			{
				field: 'mail_ids',
				headerName: __( 'Emails', 'rest-api-firewall' ),
				width: 90,
				sortable: false,
				renderCell: ( { value } ) =>
					value?.length ? (
						<Chip
							label={ value.length }
							size="small"
							color="secondary"
							sx={ { height: 22 } }
						/>
					) : (
						<Typography variant="caption" color="text.disabled">
							—
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
		[ __, handleDeleteOne ]
	);

	if ( editing ) {
		return (
			<AutomationEditor
				automation={ editing }
				onBack={ () => {
					setEditing( null );
					fetchEntries();
				} }
			/>
		);
	}

	const selectedCount = rowSelectionModel.ids.size;

	return (
		<Stack spacing={ 0 } sx={ { height: '100%', p: 4 } }>
			<Toolbar
				disableGutters
				sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }
			>

				<Button
					size="small"
					variant="contained"
					disableElevation
					onClick={ () =>
						setEditing( {
							id: null,
							event: '',
							conditions: [],
							payload_map: {},
							webhook_ids: [],
							mail_ids: [],
							enabled: true,
						} )
					}
					disabled={ ! hasValidLicense }
				>
					{ __( 'New Automation', 'rest-api-firewall' ) }
				</Button>
				
				{ selectedCount > 0 && (
					<>
						<Chip
							label={ `${ selectedCount } ${ __(
								'selected',
								'rest-api-firewall'
							) }` }
							size="small"
						/>
						<Button
							size="small"
							color="error"
							variant="outlined"
							startIcon={ <DeleteOutlineIcon /> }
							onClick={ handleDeleteSelected }
						>
							{ __( 'Delete selected', 'rest-api-firewall' ) }
						</Button>
					</>
				) }


			</Toolbar>

			{ fetchError && (
				<Alert severity="error" sx={ { mb: 1 } }>
					{ fetchError }
				</Alert>
			) }

			<HookRegistry />

			<Box sx={ { flex: 1, minHeight: 0 } }>
				<DataGrid
					rows={ rows }
					columns={ columns }
					loading={ loading }
					pageSizeOptions={ [ 25, 50, 100 ] }
					paginationModel={ paginationModel }
					onPaginationModelChange={ setPaginationModel }
					sortModel={ sortModel }
					onSortModelChange={ setSortModel }
					checkboxSelection
					rowSelectionModel={ rowSelectionModel }
					showToolbar
					onRowSelectionModelChange={ setRowSelectionModel }
					onRowDoubleClick={ ( params ) =>
						setEditing( params.row )
					}
					sx={ {
						'& .MuiDataGrid-cell': {
							display: 'flex',
							alignItems: 'center',
						},
					} }
				/>
			</Box>
		</Stack>
	);
}
