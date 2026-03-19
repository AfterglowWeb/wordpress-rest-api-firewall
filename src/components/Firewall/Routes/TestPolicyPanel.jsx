import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function StatusBadge( { status } ) {
	return (
		<Chip
			label={ status || '—' }
			size="small"
			variant="outlined"
		/>
	);
}

function DataPanel( { label, data, bgcolor } ) {
	return (
		<Box sx={ { flex: 1, minWidth: 0 } }>
			<Stack
				direction="row"
				spacing={ 1 }
				alignItems="center"
				sx={ { mb: 0.5 } }
			>
				<Typography variant="caption" fontWeight={ 600 }>
					{ label }
				</Typography>
				{ data?.status && <StatusBadge status={ data.status } /> }
			</Stack>
			<Box
				component="pre"
				sx={ {
					p: 1.5,
					bgcolor: bgcolor || 'grey.50',
					borderRadius: 1,
					overflowX: 'auto',
					fontSize: '0.68rem',
					lineHeight: 1.5,
					m: 0,
					whiteSpace: 'pre-wrap',
					wordBreak: 'break-all',
					maxHeight: 260,
					overflowY: 'auto',
				} }
			>
				{ data?.body !== undefined
					? JSON.stringify( data.body, null, 2 )
					: '—' }
			</Box>
		</Box>
	);
}

export default function TestPolicyPanel( {
	route,
	method,
	hasChildren = false,
	hasUsers = false,
	onClose,
	onNavigate,
} ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const [ loading, setLoading ] = useState( false );
	const [ results, setResults ] = useState( null );
	const [ error, setError ] = useState( null );

	const [ testSubRoutes, setTestSubRoutes ] = useState( false );
	const [ bypassUsers, setBypassUsers ] = useState( false );

	useEffect( () => {
		if ( ! route ) return;
		runTest();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ route, method ] );

	const handleClose = () => {
		setResults( null );
		setError( null );
		onClose();
	};

	const runTest = async () => {
		setLoading( true );
		setError( null );
		setResults( null );

		try {
			const params = {
				action: 'run_policy_test',
				nonce,
				route,
				method,
				test_sub_routes: testSubRoutes ? '1' : '0',
				bypass_users: bypassUsers ? '1' : '0',
				has_users: hasUsers ? '1' : '0',
				application_id: selectedApplicationId || '',
			};

			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( params ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setResults( result.data );
			} else {
				setError(
					result?.data?.message ||
						__( 'Test failed', 'rest-api-firewall' )
				);
			}
		} catch ( err ) {
			setError(
				err.message || __( 'Network error', 'rest-api-firewall' )
			);
		} finally {
			setLoading( false );
		}
	};

	const getTestLabel = ( name ) => {
		switch ( name ) {
			case 'disabled':
				return __( 'Disabled', 'rest-api-firewall' );
			case 'auth':
				return __( 'Auth', 'rest-api-firewall' );
			case 'rate_limit':
				return __( 'Rate limit', 'rest-api-firewall' );
			default:
				return name;
		}
	};

	const renderTestStatus = ( test ) => {
		if ( test?.skip ) {
			return (
				<Typography variant="caption" color="text.disabled">
					{ __( 'N/A', 'rest-api-firewall' ) }
				</Typography>
			);
		}
		if ( test?.pass === true ) {
			return (
				<Typography
					variant="caption"
					color="success.main"
					fontWeight={ 600 }
				>
					{ __( 'Pass', 'rest-api-firewall' ) }
				</Typography>
			);
		}
		if ( test?.pass === null ) {
			return (
				<Typography
					variant="caption"
					color="text.secondary"
					fontWeight={ 600 }
				>
					{ __( '—', 'rest-api-firewall' ) }
				</Typography>
			);
		}
		return (
			<Typography
				variant="caption"
				color="error.main"
				fontWeight={ 600 }
			>
				{ __( 'Fail', 'rest-api-firewall' ) }
			</Typography>
		);
	};

	const renderResults = () => {
		if ( ! results || results.length === 0 ) return null;

		return (
			<Stack spacing={ 3 } sx={ { mt: 1 } }>
				{ results.map( ( result, index ) => (
					<Box key={ index }>
						{ results.length > 1 && (
							<Stack
								direction="row"
								spacing={ 1 }
								alignItems="center"
								sx={ { mb: 1.5 } }
							>
								<Chip
									label={ result.method }
									size="small"
									variant="outlined"
								/>
								<Typography
									variant="body2"
									sx={ { fontFamily: 'monospace' } }
								>
									{ result.route }
								</Typography>
							</Stack>
						) }

						<Stack
							direction="row"
							spacing={ 0.5 }
							flexWrap="wrap"
							alignItems="center"
							sx={ { mb: 1.5 } }
						>
							<Chip
								label={
									result.policy.state
										? __( 'Enabled', 'rest-api-firewall' )
										: __( 'Disabled', 'rest-api-firewall' )
								}
								size="small"
								variant="outlined"
							/>
							<Chip
								label={
									result.policy.protect
										? __( 'Protected', 'rest-api-firewall' )
										: __( 'Public', 'rest-api-firewall' )
								}
								size="small"
								variant="outlined"
							/>
							{ result.policy.rate_limit && (
								<Chip
									label={ `${ result.policy.rate_limit } req/${ result.policy.rate_limit_time }s` }
									size="small"
									variant="outlined"
								/>
							) }
							{ result.model && (
								<Stack direction="row" alignItems="center" spacing={ 0.5 }>
									<Chip
										label={ result.model.title }
										size="small"
										variant="outlined"
									/>
									{ onNavigate && (
										<IconButton
											size="small"
											onClick={ () => onNavigate( 5 ) }
											sx={ { opacity: 0.7 } }
										>
											<AccountTreeOutlinedIcon fontSize="small" />
										</IconButton>
									) }
								</Stack>
							) }
						</Stack>

						<Table
							size="small"
							sx={ {
								mb: 2,
								'& td, & th': {
									borderLeft: 0,
									borderRight: 0,
									px: 1,
								},
							} }
						>
							<TableBody>
								{ Object.entries( result.tests ).map(
									( [ name, test ] ) => (
										<TableRow key={ name }>
											<TableCell sx={ { pl: 0 } }>
												<Typography variant="caption" color="text.primary">
													{ getTestLabel( name ) }
												</Typography>
											</TableCell>
											<TableCell sx={ { width: 60 } }>
												{ renderTestStatus( test ) }
											</TableCell>
											<TableCell
												sx={ {
													pr: 0,
													color: 'text.secondary',
													fontSize: '0.72rem',
												} }
											>
												{ test?.skip ? test.reason : test?.message }
											</TableCell>
										</TableRow>
									)
								) }
							</TableBody>
						</Table>

						<Stack direction="row" spacing={ 1.5 }>
							<DataPanel
								label={ __( 'Raw', 'rest-api-firewall' ) }
								data={ result.raw_data }
								bgcolor="grey.50"
							/>
							<DataPanel
								label={ __( 'Result', 'rest-api-firewall' ) }
								data={ result.result_data }
								bgcolor={ ( theme ) =>
									theme.palette.mode === 'dark'
										? 'rgba(99, 132, 255, 0.08)'
										: 'rgba(25, 118, 210, 0.04)'
								}
							/>
						</Stack>
					</Box>
				) ) }
			</Stack>
		);
	};

	return (
		<Stack>
			<Toolbar
			direction="row"
			alignItems="center"
			disableGutters
			>
				<Stack
				direction="row"
				gap={ 2 }
				alignItems="center"
				>
					<IconButton
					size="small"
					onClick={ handleClose }
					>
						<ArrowBackIcon />
					</IconButton>

					<Divider orientation="vertical" flexItem />

					<Chip
					label={ method }
					size="small"
					/>

					<Typography
						variant="body2"
						sx={ {
							fontFamily: 'monospace',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						} }
					>
						{ route }
					</Typography>

					<Divider orientation="vertical" flexItem />

					<Stack direction="row" gap={ 2 } alignItems="center">
						
						<FormControlLabel
							disabled={ ! hasChildren }
							control={
								<Checkbox
									checked={ testSubRoutes }
									onChange={ ( e ) =>
										setTestSubRoutes( e.target.checked )
									}
									size="small"
								/>
							}
							label={ __(
								'Include sub-routes',
								'rest-api-firewall'
							) }
						/>
				
						<FormControlLabel
							control={
								<Checkbox
									disabled={ ! hasUsers }
									checked={ bypassUsers }
									onChange={ ( e ) =>
										setBypassUsers( e.target.checked )
									}
									size="small"
								/>
							}
							label={ __(
								'Bypass users settings',
								'rest-api-firewall'
							) }
						/>

						<Button
							variant="contained"
							size="small"
							disableElevation
							onClick={ runTest }
							disabled={ loading }
							startIcon={
								loading ? (
									<CircularProgress size={ 14 } />
								) : (
									<PlayArrowIcon />
								)
							}
							sx={ { textTransform: 'none' } }
						>
						{ loading
							? __( 'Running…', 'rest-api-firewall' )
						: __( 'Re-run', 'rest-api-firewall' ) }
						</Button>

					</Stack>
					
				</Stack>

				<Stack flex={ 1 } />

			</Toolbar>
			
			{ error && <Alert severity="error">{ error }</Alert> }

			{ renderResults() }
			
		</Stack>
	);
}
