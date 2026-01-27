import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';

import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const STEP_STATUS = {
	pending: 'pending',
	done: 'done',
	error: 'error',
};

function StepItem({ step }) {
	const getIcon = () => {
		switch (step.status) {
			case STEP_STATUS.done:
				return <CheckCircleIcon color="success" fontSize="small" />;
			case STEP_STATUS.error:
				return <ErrorIcon color="error" fontSize="small" />;
			default:
				return <PendingIcon color="disabled" fontSize="small" />;
		}
	};

	return (
		<Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.5 }}>
			<Box sx={{ mt: 0.25 }}>{getIcon()}</Box>
			<Box sx={{ flex: 1 }}>
				<Typography
					variant="body2"
					color={step.status === STEP_STATUS.error ? 'error' : 'text.primary'}
				>
					{step.label}
				</Typography>
				{step.message && (
					<Typography variant="caption" color="text.secondary">
						{step.message}
					</Typography>
				)}
			</Box>
		</Stack>
	);
}

export default function DeployTheme({ setStatus, status }) {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
    
	const [loading, setLoading] = useState(false);
	const [deploying, setDeploying] = useState(false);
	const [activating, setActivating] = useState(false);
	const [steps, setSteps] = useState([]);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState(null);
	const [expanded, setExpanded] = useState(false);
	const [showActivateDialog, setShowActivateDialog] = useState(false);

	const ajaxCall = useCallback(async (themeAction) => {
		if (!adminData?.nonce || !adminData?.ajaxurl) {
			throw new Error('Missing AJAX configuration');
		}

		const response = await fetch(adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams({
				action: 'deploy_theme',
				nonce: adminData.nonce,
				theme_action: themeAction,
			}),
		});

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.data?.message || 'Unknown error');
		}

		return data.data;
	}, [adminData]);

	const checkStatus = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await ajaxCall('check');
			setStatus(result);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [ajaxCall]);

	const handleDeploy = useCallback(async () => {
		setDeploying(true);
		setExpanded(true);
		setError(null);
		setSteps([]);
		setProgress(0);

		try {
			const progressInterval = setInterval(() => {
				setProgress((prev) => Math.min(prev + 10, 90));
			}, 200);

			const result = await ajaxCall('deploy');

			clearInterval(progressInterval);

			if (result.steps) {
				setSteps(result.steps);

				const completedSteps = result.steps.filter((s) => s.status === STEP_STATUS.done).length;
				const totalSteps = result.steps.length;
				setProgress((completedSteps / totalSteps) * 100);
			}

			if (result.status) {
				setStatus(result.status);
			}

			const hasError = result.steps?.some((s) => s.status === STEP_STATUS.error);
			if (hasError) {
				const errorStep = result.steps.find((s) => s.status === STEP_STATUS.error);
				setError(errorStep?.message || 'Deployment failed');
			} else if (result.status && !result.status.active) {
				// Show activation dialog after successful deployment
				setShowActivateDialog(true);
			}
		} catch (err) {
			setError(err.message);
			setProgress(0);
		} finally {
			setDeploying(false);
		}
	}, [ajaxCall]);

	const handleActivate = useCallback(async () => {
		setActivating(true);
		setError(null);

		try {
			const result = await ajaxCall('activate');

			if (result.status) {
				setStatus(result.status);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setActivating(false);
		}
	}, [ajaxCall]);

	useEffect(() => {
		if (! status) {
			checkStatus();
		}
	}, [status, checkStatus]);

	// Auto-collapse when deployed and not actively processing
	useEffect(() => {
		if (status?.deployed && !deploying && !activating) {
			setExpanded(false);
			setSteps([]); // Clear steps when collapsing
		}
		if (status && !status.deployed) {
			setExpanded(true);
		}
	}, [status, deploying, activating]);

	const isProcessing = loading || deploying || activating;

	return (
		<Box
			maxWidth="sm"
		>
			<Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<ColorLensIcon />
				{__('Deploy Theme', 'rest-api-firewall')}
			</Typography>

			<Box>
				{loading && !status && (
					<Box sx={{ py: 2 }}>
						<LinearProgress />
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							{__('Checking theme status...', 'rest-api-firewall')}
						</Typography>
					</Box>
				)}

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{status && (
					<Stack spacing={2}>
						{/* Collapsed Summary View - shown when deployed */}
						{status.deployed && (
							<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
								<Typography variant="body1" fontWeight={500}>
									{status.theme_name}
								</Typography>
								{status.deployed_version && (
									<Typography variant="body2" color="text.secondary">
										v{status.deployed_version}
									</Typography>
								)}
								<Chip
									icon={<CheckCircleIcon />}
									label={__('Deployed', 'rest-api-firewall')}
									color="success"
									size="small"
								/>
								<Chip
									icon={status.active ? <CheckCircleIcon /> : <PendingIcon />}
									label={status.active ? __('Active', 'rest-api-firewall') : __('Inactive', 'rest-api-firewall')}
									color={status.active ? 'success' : 'default'}
									variant={status.active ? 'filled' : 'outlined'}
									size="small"
								/>
								{status.active && (
									<Button
										size="small"
										href="themes.php"
									>
										{__('Manage in Themes', 'rest-api-firewall')}
									</Button>
								)}
								<IconButton
									size="small"
									onClick={() => setExpanded(!expanded)}
									aria-label={expanded ? __('Collapse', 'rest-api-firewall') : __('Expand', 'rest-api-firewall')}
								>
									{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
								</IconButton>
							</Stack>
						)}

						<Collapse in={expanded || !status.deployed}>
							<Stack spacing={2}>
								<Box>
									<Typography variant="subtitle2" color="text.secondary" gutterBottom>
										{__('Bundled Theme', 'rest-api-firewall')}
									</Typography>
									<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
										<Typography variant="body1" fontWeight={500}>
											{status.theme_name}
										</Typography>
										{status.bundled_version && (
											<Chip
												label={`v${status.bundled_version}`}
												size="small"
												color="primary"
												variant="outlined"
											/>
										)}
									</Stack>
								</Box>

								<Divider />

								{/* Status Chips */}
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									<Chip
										icon={status.deployed ? <CheckCircleIcon /> : <PendingIcon />}
										label={status.deployed ? __('Deployed', 'rest-api-firewall') : __('Not Deployed', 'rest-api-firewall')}
										color={status.deployed ? 'success' : 'default'}
										variant={status.deployed ? 'filled' : 'outlined'}
										size="small"
									/>
									<Chip
										icon={status.active ? <CheckCircleIcon /> : <PendingIcon />}
										label={status.active ? __('Active', 'rest-api-firewall') : __('Inactive', 'rest-api-firewall')}
										color={status.active ? 'success' : 'default'}
										variant={status.active ? 'filled' : 'outlined'}
										size="small"
									/>
								</Stack>

								{/* Version comparison */}
								{status.deployed && status.deployed_version && status.bundled_version !== status.deployed_version && (
									<Alert severity="info" variant="outlined">
										{__('Update available: Deployed version', 'rest-api-firewall')} ({status.deployed_version}) → ({status.bundled_version})
									</Alert>
								)}

								{/* Current Theme Info */}
								{status.current_theme && !status.current_theme.is_ours && (
									<Box>
										<Typography variant="subtitle2" color="text.secondary" gutterBottom>
											{__('Current Active Theme', 'rest-api-firewall')}
										</Typography>
										<Typography variant="body2">
											{status.current_theme.name} (v{status.current_theme.version})
										</Typography>
									</Box>
								)}

								{/* Deployment Progress - only show when actively deploying */}
								{deploying && (
									<Box>
										<Typography variant="subtitle2" color="text.secondary" gutterBottom>
											{__('Deployment Progress', 'rest-api-firewall')}
										</Typography>

										<LinearProgress
											variant={progress < 90 ? 'indeterminate' : 'determinate'}
											value={progress}
											sx={{ mb: 2, height: 8, borderRadius: 1 }}
										/>

										{steps.length > 0 && (
											<Stack spacing={0.5}>
												{steps.map((step) => (
													<StepItem
														key={step.step}
														step={step}
													/>
												))}
											</Stack>
										)}
									</Box>
								)}
							</Stack>
						</Collapse>
					</Stack>
				)}
			</Box>

			<Collapse in={expanded || !status?.deployed}>
				<Box sx={{ py: 3, pb: 2 }}>
					{status && !status.deployed && (
						<Button
							onClick={handleDeploy}
							disabled={isProcessing || !status.source_exists}
							variant="contained"
							startIcon={<RocketLaunchIcon />}
						>
							{deploying ? __('Deploying...', 'rest-api-firewall') : __('Deploy Theme', 'rest-api-firewall')}
						</Button>
					)}

					{status && status.deployed && !status.active && (
						<Stack direction="row" spacing={1}>
							<Button
								onClick={handleDeploy}
								disabled={isProcessing}
								variant="outlined"
								color="secondary"
							>
								{deploying ? __('Deploying...', 'rest-api-firewall') : __('Redeploy', 'rest-api-firewall')}
							</Button>
							<Button
								onClick={handleActivate}
								disabled={isProcessing}
								variant="contained"
								color="success"
							>
								{activating ? __('Activating...', 'rest-api-firewall') : __('Activate Theme', 'rest-api-firewall')}
							</Button>
						</Stack>
					)}

					{status && status.deployed && status.active && (
						<Button
							onClick={handleDeploy}
							disabled={isProcessing}
							variant="outlined"
							color="secondary"
						>
							{deploying ? __('Deploying...', 'rest-api-firewall') : __('Redeploy', 'rest-api-firewall')}
						</Button>
					)}
				</Box>
			</Collapse>

			{/* Activation Dialog - shown after successful deployment */}
			<Dialog
				open={showActivateDialog}
				onClose={() => setShowActivateDialog(false)}
			>
				<DialogTitle>
					{__('Theme Deployed Successfully', 'rest-api-firewall')}
				</DialogTitle>
				<DialogContent>
					<Typography>
						{__('The theme has been deployed. Would you like to activate it now?', 'rest-api-firewall')}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setShowActivateDialog(false)}
						color="inherit"
					>
						{__('Later', 'rest-api-firewall')}
					</Button>
					<Button
						onClick={() => {
							setShowActivateDialog(false);
							handleActivate();
						}}
						variant="contained"
						color="success"
						autoFocus
					>
						{__('Activate Now', 'rest-api-firewall')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
