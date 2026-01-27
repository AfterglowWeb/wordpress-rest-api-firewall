import { useState } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function TestPolicy( { route, method, hasChildren = false } ) {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};

	const [ open, setOpen ] = useState( false );
	const [ loading, setLoading ] = useState( false );
	const [ results, setResults ] = useState( null );
	const [ error, setError ] = useState( null );

	const [ options, setOptions ] = useState( {
		test_sub_routes: false,
		use_auth: true,
		use_rate_limit: true,
		use_disabled: true,
	} );

	const handleOpen = ( e ) => {
		e.stopPropagation();
		setOpen( true );
		setResults( null );
		setError( null );
	};

	const handleClose = () => {
		setOpen( false );
	};

	const handleOptionChange = ( key ) => ( e ) => {
		setOptions( ( prev ) => ( {
			...prev,
			[ key ]: e.target.checked,
		} ) );
	};

	const runTest = async () => {
		setLoading( true );
		setError( null );
		setResults( null );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'run_policy_test',
					nonce: adminData.nonce,
					route: route,
					method: method,
					test_sub_routes: options.test_sub_routes ? '1' : '0',
					use_auth: options.use_auth ? '1' : '0',
					use_rate_limit: options.use_rate_limit ? '1' : '0',
					use_disabled: options.use_disabled ? '1' : '0',
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setResults( result.data );
			} else {
				setError( result?.data?.message || __( 'Test failed', 'rest-api-firewall' ) );
			}
		} catch ( err ) {
			setError( err.message || __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	};

	const getTestIcon = ( test ) => {
		if ( test.skip ) {
			return <RemoveCircleIcon color="disabled" fontSize="small" />;
		}
		if ( test.pass ) {
			return <CheckCircleIcon color="success" fontSize="small" />;
		}
		return <CancelIcon color="error" fontSize="small" />;
	};

	const getTestLabel = ( testName ) => {
		switch ( testName ) {
			case 'auth':
				return __( 'Authentication', 'rest-api-firewall' );
			case 'rate_limit':
				return __( 'Rate Limit', 'rest-api-firewall' );
			case 'disabled':
				return __( 'Disabled', 'rest-api-firewall' );
			default:
				return testName;
		}
	};

	const renderTestResult = ( testName, test ) => {
		return (
			<Stack
				key={ testName }
				direction="row"
				spacing={ 1 }
				alignItems="center"
				sx={ { py: 0.5 } }
			>
				{ getTestIcon( test ) }
				<Typography variant="body2" sx={ { fontWeight: 500, minWidth: 100 } }>
					{ getTestLabel( testName ) }
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{ test.skip ? test.reason : test.message }
				</Typography>
			</Stack>
		);
	};

	const renderPolicyInfo = ( policy ) => {
		return (
			<Stack direction="row" spacing={ 1 } flexWrap="wrap" sx={ { mb: 1 } }>
				<Chip
					label={ policy.state ? __( 'Enabled', 'rest-api-firewall' ) : __( 'Disabled', 'rest-api-firewall' ) }
					size="small"
					color={ policy.state ? 'success' : 'error' }
					variant="outlined"
				/>
				<Chip
					label={ policy.protect ? __( 'Protected', 'rest-api-firewall' ) : __( 'Public', 'rest-api-firewall' ) }
					size="small"
					color={ policy.protect ? 'warning' : 'default' }
					variant="outlined"
				/>
				{ policy.rate_limit && (
					<Chip
						label={ `${ policy.rate_limit } req/${ policy.rate_limit_time }s` }
						size="small"
						color="info"
						variant="outlined"
					/>
				) }
			</Stack>
		);
	};

	const renderResults = () => {
		if ( ! results || results.length === 0 ) {
			return null;
		}

		return (
			<Stack spacing={ 1 } sx={ { mt: 2 } }>
				<Typography variant="subtitle2" fontWeight={ 600 }>
					{ __( 'Results', 'rest-api-firewall' ) } ({ results.length })
				</Typography>

				{ results.map( ( result, index ) => (
					<Accordion key={ index } defaultExpanded={ results.length === 1 }>
						<AccordionSummary expandIcon={ <ExpandMoreIcon /> }>
							<Stack direction="row" spacing={ 1 } alignItems="center">
								<Chip
									label={ result.method }
									size="small"
									color={
										result.method === 'GET'
											? 'primary'
											: result.method === 'POST'
											? 'success'
											: result.method === 'DELETE'
											? 'error'
											: 'default'
									}
								/>
								<Typography variant="body2" sx={ { fontFamily: 'monospace' } }>
									{ result.route }
								</Typography>
							</Stack>
						</AccordionSummary>
						<AccordionDetails>
							<Typography variant="caption" color="text.secondary" sx={ { mb: 1 } }>
								{ __( 'Policy:', 'rest-api-firewall' ) }
							</Typography>
							{ renderPolicyInfo( result.policy ) }

							<Divider sx={ { my: 1 } } />

							<Typography variant="caption" color="text.secondary">
								{ __( 'Tests:', 'rest-api-firewall' ) }
							</Typography>
							<Box sx={ { mt: 0.5 } }>
								{ Object.entries( result.tests ).map( ( [ testName, test ] ) =>
									renderTestResult( testName, test )
								) }
							</Box>
						</AccordionDetails>
					</Accordion>
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
						<Box>
							<Typography variant="subtitle2" color="text.secondary">
								{ __( 'Route', 'rest-api-firewall' ) }
							</Typography>
							<Stack direction="row" spacing={ 1 } alignItems="center">
								<Chip
									label={ method }
									size="small"
									color={
										method === 'GET'
											? 'primary'
											: method === 'POST'
											? 'success'
											: method === 'DELETE'
											? 'error'
											: 'default'
									}
								/>
								<Typography variant="body1" sx={ { fontFamily: 'monospace' } }>
									{ route }
								</Typography>
							</Stack>
						</Box>

						<Divider />

						<Box>
							<Typography variant="subtitle2" sx={ { mb: 1 } }>
								{ __( 'Test Options', 'rest-api-firewall' ) }
							</Typography>

							<Stack spacing={ 0.5 }>
								{ hasChildren && (
									<FormControlLabel
										control={
											<Checkbox
												checked={ options.test_sub_routes }
												onChange={ handleOptionChange( 'test_sub_routes' ) }
												size="small"
											/>
										}
										label={ __( 'Include sub-routes', 'rest-api-firewall' ) }
									/>
								) }

								<FormControlLabel
									control={
										<Checkbox
											checked={ options.use_auth }
											onChange={ handleOptionChange( 'use_auth' ) }
											size="small"
										/>
									}
									label={ __( 'Test authentication', 'rest-api-firewall' ) }
								/>

								<FormControlLabel
									control={
										<Checkbox
											checked={ options.use_rate_limit }
											onChange={ handleOptionChange( 'use_rate_limit' ) }
											size="small"
										/>
									}
									label={ __( 'Test rate limiting', 'rest-api-firewall' ) }
								/>

								<FormControlLabel
									control={
										<Checkbox
											checked={ options.use_disabled }
											onChange={ handleOptionChange( 'use_disabled' ) }
											size="small"
										/>
									}
									label={ __( 'Test disabled state', 'rest-api-firewall' ) }
								/>
							</Stack>
						</Box>

						{ error && (
							<Alert severity="error">{ error }</Alert>
						) }

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
						startIcon={ loading ? <CircularProgress size={ 16 } /> : <PlayArrowIcon /> }
					>
						{ loading ? __( 'Running...', 'rest-api-firewall' ) : __( 'Run Test', 'rest-api-firewall' ) }
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
