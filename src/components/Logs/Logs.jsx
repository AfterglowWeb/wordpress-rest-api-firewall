import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';

import { DataGrid } from '@mui/x-data-grid';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';

import formatDate from '../../utils/formatDate';
import useProActions from '../../hooks/useProActions';

const LEVEL_COLORS = {
	info: 'info',
	warning: 'warning',
	error: 'error',
};

const TYPE_COLORS = {
	firewall: 'error',
	webhook: 'primary',
	automation: 'secondary',
};

function JsonViewer( { data } ) {
	if ( ! data || Object.keys( data ).length === 0 ) {
		return null;
	}
	return (
		<Box
			component="pre"
			sx={ {
				m: 0,
				p: 1.5,
				bgcolor: 'action.hover',
				borderRadius: 1,
				fontSize: '0.75rem',
				fontFamily: 'monospace',
				overflowX: 'auto',
				whiteSpace: 'pre-wrap',
				wordBreak: 'break-all',
				maxHeight: 200,
				overflowY: 'auto',
			} }
		>
			{ JSON.stringify( data, null, 2 ) }
		</Box>
	);
}

function ExpandableRow( { row } ) {
	const [ open, setOpen ] = useState( false );
	const { __ } = wp.i18n || {};
	const hasContext = row.context && Object.keys( row.context ).length > 0;

	return (
		<Box sx={ { px: 1 } }>
			<Stack direction="row" alignItems="center" spacing={ 1 }>
				{ hasContext && (
					<IconButton
						size="small"
						onClick={ () => setOpen( ( v ) => ! v ) }
						sx={ {
							p: 0.25,
							transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s',
						} }
					>
						<ExpandMoreIcon
							fontSize="small"
							sx={ { fontSize: 18 } }
						/>
					</IconButton>
				) }
				<Typography variant="body2" sx={ { flex: 1 } }>
					{ row.message || '—' }
				</Typography>
			</Stack>
			{ hasContext && (
				<Collapse in={ open }>
					<Box sx={ { pl: 4, pt: 0.5, pb: 1 } }>
						<JsonViewer data={ row.context } />
					</Box>
				</Collapse>
			) }
		</Box>
	);
}

export default function Logs() {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { applications } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { remove } = useProActions();

	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ total, setTotal ] = useState( 0 );
	const [ fetchError, setFetchError ] = useState( '' );

	const [ paginationModel, setPaginationModel ] = useState( {
		page: 0,
		pageSize: 50,
	} );

	const [ filterType, setFilterType ] = useState( '' );
	const [ filterLevel, setFilterLevel ] = useState( '' );
	const [ filterApp, setFilterApp ] = useState( '' );

	const [ autoRefresh, setAutoRefresh ] = useState( false );
	const intervalRef = useRef( null );

	const fetchEntries = useCallback( async () => {
		setLoading( true );
		setFetchError( '' );

		try {
			const body = new URLSearchParams( {
				action: 'get_log_entries',
				nonce,
				page: String( paginationModel.page ),
				page_size: String( paginationModel.pageSize ),
			} );
			if ( filterType ) {
				body.set( 'type', filterType );
			}
			if ( filterLevel ) {
				body.set( 'level', filterLevel );
			}
			if ( filterApp ) {
				body.set( 'application_id', filterApp );
			}

			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body,
			} );
			const json = await res.json();

			if ( json.success ) {
				setRows( json.data.entries || [] );
				setTotal( json.data.total || 0 );
			} else {
				setFetchError(
					json.data?.message ||
						__( 'Failed to load logs', 'rest-api-firewall' )
				);
			}
		} catch ( e ) {
			setFetchError( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	}, [
		adminData,
		nonce,
		paginationModel,
		filterType,
		filterLevel,
		filterApp,
		__,
	] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	// Auto-refresh every 30s.
	useEffect( () => {
		if ( autoRefresh ) {
			intervalRef.current = setInterval( fetchEntries, 30000 );
		} else {
			clearInterval( intervalRef.current );
		}
		return () => clearInterval( intervalRef.current );
	}, [ autoRefresh, fetchEntries ] );

	const handleClearLogs = useCallback( () => {
		remove(
			{ action: 'delete_log_entries', application_id: filterApp || '' },
			{
				confirmTitle: __( 'Clear Logs', 'rest-api-firewall' ),
				confirmMessage: filterApp
					? __(
							'Delete all log entries for this application? This cannot be undone.',
							'rest-api-firewall'
					  )
					: __(
							'Delete all log entries? This cannot be undone.',
							'rest-api-firewall'
					  ),
				confirmLabel: __( 'Clear', 'rest-api-firewall' ),
				onSuccess: () => {
					setRows( [] );
					setTotal( 0 );
				},
			}
		);
	}, [ remove, filterApp, __ ] );

	const columns = useMemo(
		() => [
			{
				field: 'level',
				headerName: __( 'Level', 'rest-api-firewall' ),
				width: 90,
				sortable: false,
				renderCell: ( { value } ) => (
					<Chip
						label={ value }
						size="small"
						color={ LEVEL_COLORS[ value ] || 'default' }
						sx={ {
							height: 22,
							fontSize: '0.7rem',
							fontWeight: 600,
						} }
					/>
				),
			},
			{
				field: 'type',
				headerName: __( 'Type', 'rest-api-firewall' ),
				width: 110,
				sortable: false,
				renderCell: ( { value } ) => (
					<Chip
						label={ value }
						size="small"
						variant="outlined"
						color={ TYPE_COLORS[ value ] || 'default' }
						sx={ { height: 22, fontSize: '0.7rem' } }
					/>
				),
			},
			{
				field: 'application_id',
				headerName: __( 'Application', 'rest-api-firewall' ),
				width: 150,
				sortable: false,
				renderCell: ( { value } ) => {
					const app = applications?.find( ( a ) => a.id === value );
					return (
						<Typography variant="caption" noWrap>
							{ app
								? app.title
								: value
								? value.slice( 0, 8 ) + '…'
								: '—' }
						</Typography>
					);
				},
			},
			{
				field: 'message',
				headerName: __( 'Message', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 200,
				sortable: false,
				renderCell: ( params ) => <ExpandableRow row={ params.row } />,
			},
			{
				field: 'created_at',
				headerName: __( 'Date', 'rest-api-firewall' ),
				width: 160,
				sortable: false,
				renderCell: ( { value } ) => (
					<Typography variant="caption" color="text.secondary">
						{ formatDate( value ) }
					</Typography>
				),
			},
		],
		[ __, applications ]
	);

	return (
		<Stack spacing={ 2 } sx={ { height: '100%', p: 4 } }>
			<Toolbar
				variant="dense"
				sx={ {
					gap: 1,
					flexWrap: 'wrap',
					minHeight: 56,
					px: 0,
					alignItems: 'center',
				} }
				disableGutters
			>
				{ applications && applications.length > 0 && (
					<FormControl size="small" sx={ { minWidth: 160 } }>
						<InputLabel>
							{ __( 'Application', 'rest-api-firewall' ) }
						</InputLabel>
						<Select
							value={ filterApp }
							label={ __( 'Application', 'rest-api-firewall' ) }
							onChange={ ( e ) => {
								setFilterApp( e.target.value );
								setPaginationModel( ( p ) => ( {
									...p,
									page: 0,
								} ) );
							} }
						>
							<MenuItem value="">
								{ __( 'All', 'rest-api-firewall' ) }
							</MenuItem>
							{ applications.map( ( app ) => (
								<MenuItem key={ app.id } value={ app.id }>
									{ app.title }
								</MenuItem>
							) ) }
						</Select>
					</FormControl>
				) }

				<FormControl size="small" sx={ { minWidth: 130 } }>
					<InputLabel>
						{ __( 'Type', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						value={ filterType }
						label={ __( 'Type', 'rest-api-firewall' ) }
						onChange={ ( e ) => {
							setFilterType( e.target.value );
							setPaginationModel( ( p ) => ( {
								...p,
								page: 0,
							} ) );
						} }
					>
						<MenuItem value="">
							{ __( 'All', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="firewall">
							{ __( 'Firewall', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="webhook">
							{ __( 'Webhook', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="automation">
							{ __( 'Automation', 'rest-api-firewall' ) }
						</MenuItem>
					</Select>
				</FormControl>

				<FormControl size="small" sx={ { minWidth: 120 } }>
					<InputLabel>
						{ __( 'Level', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						value={ filterLevel }
						label={ __( 'Level', 'rest-api-firewall' ) }
						onChange={ ( e ) => {
							setFilterLevel( e.target.value );
							setPaginationModel( ( p ) => ( {
								...p,
								page: 0,
							} ) );
						} }
					>
						<MenuItem value="">
							{ __( 'All', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="info">
							{ __( 'Info', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="warning">
							{ __( 'Warning', 'rest-api-firewall' ) }
						</MenuItem>
						<MenuItem value="error">
							{ __( 'Error', 'rest-api-firewall' ) }
						</MenuItem>
					</Select>
				</FormControl>

				<Box sx={ { flex: 1 } } />

				<Tooltip title={ __( 'Refresh', 'rest-api-firewall' ) }>
					<IconButton onClick={ fetchEntries } size="small">
						<RefreshIcon fontSize="small" />
					</IconButton>
				</Tooltip>

				<Button
					size="small"
					variant={ autoRefresh ? 'contained' : 'outlined' }
					onClick={ () => setAutoRefresh( ( v ) => ! v ) }
					sx={ { whiteSpace: 'nowrap' } }
				>
					{ autoRefresh
						? __( 'Auto-refresh ON', 'rest-api-firewall' )
						: __( 'Auto-refresh', 'rest-api-firewall' ) }
				</Button>

				<Button
					size="small"
					color="error"
					variant="outlined"
					startIcon={ <DeleteOutlineIcon /> }
					onClick={ handleClearLogs }
					sx={ { whiteSpace: 'nowrap' } }
				>
					{ __( 'Clear Logs', 'rest-api-firewall' ) }
				</Button>
			</Toolbar>

			{ fetchError && (
				<Alert severity="error" sx={ { mb: 1 } }>
					{ fetchError }
				</Alert>
			) }

			<Box sx={ { flex: 1, minHeight: 0 } }>
				<DataGrid
					rows={ rows }
					columns={ columns }
					loading={ loading }
					rowCount={ total }
					pageSizeOptions={ [ 25, 50, 100 ] }
					paginationModel={ paginationModel }
					onPaginationModelChange={ setPaginationModel }
					paginationMode="server"
					showToolbar={ true }
					getRowHeight={ () => 'auto' }
					sx={ {
						'& .MuiDataGrid-cell': {
							alignItems: 'flex-start',
							py: 0.5,
						},
					} }
				/>
			</Box>
		</Stack>
	);
}
