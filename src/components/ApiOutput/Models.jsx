import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';

import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import ModelEditor from './ModelEditor';

export default function Models() {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { remove } = useProActions();

	const [ models, setModels ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set(),
	} );
	const [ editing, setEditing ] = useState( null ); // null = list, object = editor

	const fetchModels = useCallback( async () => {
		if ( ! selectedApplicationId ) {
			return;
		}
		setLoading( true );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'get_model_entries',
					nonce,
					application_id: selectedApplicationId,
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setModels( json.data.entries ?? [] );
			}
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, selectedApplicationId ] );

	useEffect( () => {
		fetchModels();
	}, [ fetchModels ] );

	const handleToggle = useCallback(
		async ( id, enabled ) => {
			setModels( ( prev ) =>
				prev.map( ( m ) => ( m.id === id ? { ...m, enabled } : m ) )
			);
			await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'toggle_model_entry',
					nonce,
					id,
					enabled: enabled ? '1' : '0',
				} ),
			} );
			fetchModels();
		},
		[ adminData, nonce, fetchModels ]
	);

	const handleDelete = useCallback(
		( id, label ) => {
			remove(
				{ action: 'delete_model_entry', nonce, id },
				{
					confirmTitle: __( 'Delete Model', 'rest-api-firewall' ),
					confirmMessage: `${ __(
						'Permanently delete',
						'rest-api-firewall'
					) } "${ label }"? ${ __(
						'This action cannot be undone.',
						'rest-api-firewall'
					) }`,
					confirmLabel: __( 'Delete', 'rest-api-firewall' ),
					onSuccess: fetchModels,
				}
			);
		},
		[ remove, nonce, fetchModels, __ ]
	);

	const handleBulkDelete = useCallback( () => {
		const selectedIds = [ ...rowSelectionModel.ids ];
		if ( ! selectedIds.length ) {
			return;
		}
		remove(
			{
				action: 'delete_model_entries',
				nonce,
				ids: JSON.stringify( selectedIds ),
			},
			{
				confirmTitle: __( 'Delete Models', 'rest-api-firewall' ),
				confirmMessage: `${ __( 'Delete', 'rest-api-firewall' ) } ${
					selectedIds.length
				} ${ __(
					'models? This cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					setRowSelectionModel( { type: 'include', ids: new Set() } );
					fetchModels();
				},
			}
		);
	}, [ remove, nonce, rowSelectionModel, fetchModels, __ ] );

	if ( editing !== null ) {
		return (
			<ModelEditor
				model={ editing }
				onBack={ () => {
					setEditing( null );
					fetchModels();
				} }
			/>
		);
	}

	const columns = [
		{
			field: 'enabled',
			headerName: __( 'Active', 'rest-api-firewall' ),
			width: 80,
			sortable: false,
			renderCell: ( { row } ) => (
				<Switch
					size="small"
					checked={ row.enabled }
					onChange={ ( e ) =>
						handleToggle( row.id, e.target.checked )
					}
				/>
			),
		},
		{
			field: 'label',
			headerName: __( 'Name', 'rest-api-firewall' ),
			flex: 1,
			renderCell: ( { row } ) => (
				<Stack>
					<Typography variant="body2" fontWeight={ 500 }>
						{ row.label }
					</Typography>
					{ row.is_custom && (
						<Typography variant="caption" color="text.secondary">
							{ __( 'custom schema', 'rest-api-firewall' ) }
						</Typography>
					) }
				</Stack>
			),
		},
		{
			field: 'object_type',
			headerName: __( 'Object Type', 'rest-api-firewall' ),
			width: 160,
			renderCell: ( { value } ) =>
				value ? (
					<Chip
						label={ value }
						size="small"
						variant="outlined"
						sx={ { fontFamily: 'monospace', fontSize: '0.72rem' } }
					/>
				) : (
					'—'
				),
		},
		{
			field: 'is_custom',
			headerName: __( 'Type', 'rest-api-firewall' ),
			width: 110,
			renderCell: ( { value } ) => (
				<Chip
					label={
						value
							? __( 'Custom', 'rest-api-firewall' )
							: __( 'WP Schema', 'rest-api-firewall' )
					}
					size="small"
					color={ value ? 'secondary' : 'default' }
					icon={ value ? <BuildOutlinedIcon /> : undefined }
					sx={ { fontSize: '0.7rem' } }
				/>
			),
		},
		{
			field: 'date_created',
			headerName: __( 'Created', 'rest-api-firewall' ),
			width: 140,
			renderCell: ( { value } ) => (
				<Typography variant="caption" color="text.secondary">
					{ formatDate( value ) }
				</Typography>
			),
		},
		{
			field: '_actions',
			headerName: '',
			width: 90,
			sortable: false,
			renderCell: ( { row } ) => (
				<Stack direction="row" spacing={ 0.5 }>
					<Tooltip title={ __( 'Edit', 'rest-api-firewall' ) }>
						<IconButton
							size="small"
							onClick={ () => setEditing( row ) }
						>
							<EditOutlinedIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title={ __( 'Delete', 'rest-api-firewall' ) }>
						<IconButton
							size="small"
							color="error"
							onClick={ () => handleDelete( row.id, row.label ) }
						>
							<DeleteOutlineIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Stack>
			),
		},
	];

	return (
		<Stack spacing={ 2 } sx={ { height: '100%', flexGrow: 1 } }>
			
			<Toolbar
				disableGutters
				sx={ { gap: 2, flexWrap: 'wrap' } }
			>
				
				<Button
					size="small"
					variant="contained"
					disableElevation
					onClick={ () =>
						setEditing( {
							id: null,
							label: '',
							object_type: '',
							is_custom: false,
							enabled: false,
							properties: {},
							application_id: selectedApplicationId,
						} )
					}
					disabled={ ! selectedApplicationId }
				>
					{ __( 'New Model', 'rest-api-firewall' ) }
				</Button>

				{ rowSelectionModel.ids.size > 0 && (
					<Button
						size="small"
						color="error"
						startIcon={ <DeleteOutlineIcon /> }
						onClick={ handleBulkDelete }
					>
						{ __( 'Delete', 'rest-api-firewall' ) } (
						{ rowSelectionModel.ids.size })
					</Button>
				) }

			</Toolbar>

			<DataGrid
				rows={ models }
				columns={ columns }
				loading={ loading }
				checkboxSelection
				disableRowSelectionOnClick
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ setRowSelectionModel }
				onRowDoubleClick={ ( { row } ) => setEditing( row ) }
				getRowHeight={ () => 'auto' }
				showToolbar={ true }
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
