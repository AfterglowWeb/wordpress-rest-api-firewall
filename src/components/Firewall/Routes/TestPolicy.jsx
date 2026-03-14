import { useState } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

const METHOD_COLOR = {
	GET: 'primary',
	POST: 'success',
	PUT: 'warning',
	PATCH: 'warning',
	DELETE: 'error',
};

function StatusBadge( { status } ) {
	const color =
		status >= 200 && status < 300
			? 'success'
			: status >= 400
			? 'error'
			: 'default';
	return (
		<Chip
			label={ status || '—' }
			size="small"
			color={ color }
			variant="outlined"
			sx={ { fontFamily: 'monospace', fontWeight: 700 } }
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

export default function TestPolicy( {
	route,
	method,
	hasChildren = false,
	hasUsers = false,
} ) {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};

	const [ open, setOpen ] = useState( false );
	const [ loading, setLoading ] = useState( false );
	const [ results, setResults ] = useState( null );
	const [ error, setError ] = useState( null );

	const [ testSubRoutes, setTestSubRoutes ] = useState( false );
	const [ bypassUsers, setBypassUsers ] = useState( false );

	const handleOpen = ( e ) => {
		e.stopPropagation();
		setOpen( true );
		setResults( null );
		setError( null );
	};

	const handleClose = () => {
		setOpen( false );
	};

	const runTest = async () => {
		setLoading( true );
		setError( null );
		setResults( null );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'run_policy_test',
					nonce: adminData.nonce,
					route,
					method,
					test_sub_routes: testSubRoutes ? '1' : '0',
					bypass_users: bypassUsers ? '1' : '0',
				} ),
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

	const renderTestIcon = ( test ) => {
		if ( test?.skip ) {
			return <RemoveCircleIcon color="disabled" fontSize="small" />;
		}
		if ( test?.pass ) {
			return <CheckCircleIcon color="success" fontSize="small" />;
		}
		return <CancelIcon color="error" fontSize="small" />;
	};

	const renderResults = () => {
		if ( ! results || results.length === 0 ) return null;

		return (
			<Stack spacing={ 2 } sx={ { mt: 1 } }>
				{ results.map( ( result, index ) => (
					<Box key={ index }>
						{ results.length > 1 && (
							<Stack
								direction="row"
								spacing={ 1 }
								alignItems="center"
								sx={ { mb: 1 } }
							>
								<Chip
									label={ result.method }
									size="small"
									color={
										METHOD_COLOR[ result.method ] ||
										'default'
									}
								/>
								<Typography
									variant="body2"
									sx={ { fontFamily: 'monospace' } }
								>
									{ result.route }
								</Typography>
							</Stack>
						) }

						{ /* Policy summary */ }
						<Stack
							direction="row"
							spacing={ 0.5 }
							flexWrap="wrap"
							sx={ { mb: 1 } }
						>
							<Chip
								label={
									result.policy.state
										? __( 'Enabled', 'rest-api-firewall' )
										: __( 'Disabled', 'rest-api-firewall' )
								}
								size="small"
								color={ result.policy.state ? 'success' : 'error' }
								variant="outlined"
							/>
							<Chip
								label={
									result.policy.protect
										? __( 'Protected', 'rest-api-firewall' )
										: __( 'Public', 'rest-api-firewall' )
								}
								size="small"
								color={
									result.policy.protect ? 'warning' : 'default'
								}
								variant="outlined"
							/>
							{ result.policy.rate_limit && (
								<Chip
									label={ `${ result.policy.rate_limit } req/${ result.policy.rate_limit_time }s` }
									size="small"
									color="info"
									variant="outlined"
								/>
							) }
						</Stack>

						{ /* Tests row */ }
						<Stack direction="row" spacing={ 2 } sx={ { mb: 1.5 } }>
							{ Object.entries( result.tests ).map(
								( [ name, test ] ) => (
									<Stack
										key={ name }
										direction="row"
										spacing={ 0.5 }
										alignItems="center"
									>
										{ renderTestIcon( test ) }
										<Typography
											variant="caption"
											color="text.secondary"
										>
											{ name === 'auth'
												? __( 'Auth', 'rest-api-firewall' )
												: name === 'rate_limit'
												? __( 'Rate', 'rest-api-firewall' )
												: __(
														'Disabled',
														'rest-api-firewall'
												  ) }
										</Typography>
									</Stack>
								)
							) }
						</Stack>

						{ /* Raw + Result panels */ }
						<Stack direction="row" spacing={ 1.5 }>
							<DataPanel
								label={ __( 'Raw', 'rest-api-firewall' ) }
								data={ result.raw_data }
								bgcolor="grey.50"
							/>
							<DataPanel
								label={ __( 'Result', 'rest-api-firewall' ) }
								data={ result.result_data }
								bgcolor="primary.50"
							/>
						</Stack>
					</Box>
				) ) }
			</Stack>
		);
	};

	return (
		<>
			<Button
				variant="text"
				size="small"
				onClick={ handleOpen }
				startIcon={ <PlayArrowIcon /> }
				sx={ { minWidth: 'auto', textTransform: 'none' } }
			>
				{ __( 'Test', 'rest-api-firewall' ) }
			</Button>

			<Dialog
				open={ open }
				onClose={ handleClose }
				maxWidth="md"
				fullWidth
				onClick={ ( e ) => e.stopPropagation() }
			>
				<DialogTitle>
					{ __( 'Test Policy', 'rest-api-firewall' ) }
				</DialogTitle>

				<DialogContent>
					<Stack spacing={ 2 }>
						{ /* Route header */ }
						<Stack
							direction="row"
							spacing={ 1 }
							alignItems="center"
						>
							<Chip
								label={ method }
								size="small"
								color={ METHOD_COLOR[ method ] || 'default' }
							/>
							<Typography
								variant="body1"
								sx={ { fontFamily: 'monospace' } }
							>
								{ route }
							</Typography>
						</Stack>

						{ /* Options */ }
						{ ( hasChildren || hasUsers ) && (
							<>
								<Divider />
								<Stack spacing={ 0.5 }>
									{ hasChildren && (
										<FormControlLabel
											control={
												<Checkbox
													checked={ testSubRoutes }
													onChange={ ( e ) =>
														setTestSubRoutes(
															e.target.checked
														)
													}
													size="small"
												/>
											}
											label={ __(
												'Include sub-routes',
												'rest-api-firewall'
											) }
										/>
									) }
									{ hasUsers && (
										<FormControlLabel
											control={
												<Checkbox
													checked={ bypassUsers }
													onChange={ ( e ) =>
														setBypassUsers(
															e.target.checked
														)
													}
													size="small"
												/>
											}
											label={ __(
												'Bypass users settings',
												'rest-api-firewall'
											) }
										/>
									) }
								</Stack>
							</>
						) }

						{ error && <Alert severity="error">{ error }</Alert> }

						{ results && <Divider /> }

						{ renderResults() }
					</Stack>
				</DialogContent>

				<DialogActions>
					<Button onClick={ handleClose } disabled={ loading }>
						{ __( 'Close', 'rest-api-firewall' ) }
					</Button>
					<Button
						variant="contained"
						onClick={ runTest }
						disabled={ loading }
						startIcon={
							loading ? (
								<CircularProgress size={ 16 } />
							) : (
								<PlayArrowIcon />
							)
						}
					>
						{ loading
							? __( 'Running…', 'rest-api-firewall' )
							: __( 'Run Test', 'rest-api-firewall' ) }
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
