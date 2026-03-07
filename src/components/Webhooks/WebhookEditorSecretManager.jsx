import { useState } from '@wordpress/element';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AutorenewIcon from '@mui/icons-material/Autorenew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import WebhookAuthCustom from './WebhookAuthCustom';
import WebhookAuthGenerated from './WebhookAuthGenerated';

function generateSecret() {
	const bytes = new Uint8Array( 32 );
	crypto.getRandomValues( bytes );
	return Array.from( bytes, ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

/**
 * Per-webhook secret manager.
 *
 * Does NOT make its own AJAX calls — secret changes are collected in state
 * and saved when the parent form is submitted.
 *
 * Props:
 *   initialHasSecret {boolean}          — whether a secret already exists in DB.
 *   onChange         {(v: string|null)} — called with the new secret string, or
 *                                         null to signal revocation.  Undefined
 *                                         (= "no change") is represented by
 *                                         never calling onChange at all.
 */
export default function WebhookEditorSecretManager( { initialHasSecret, onChange } ) {
	const { __ } = wp.i18n || {};

	const [ hasSecret, setHasSecret ] = useState( initialHasSecret );
	const [ revealedSecret, setRevealedSecret ] = useState( null );
	const [ customSecret, setCustomSecret ] = useState( '' );
	const [ useCustomSecret, setUseCustomSecret ] = useState( false );
	const [ showSecretGuide, setShowSecretGuide ] = useState( false );

	const [ confirmAction, setConfirmAction ] = useState( null );
	const [ confirmConfig, setConfirmConfig ] = useState( {} );
	const confirmOpen = Boolean( confirmAction );

	const handleConfirm = () => {
		if ( ! confirmAction || ! confirmConfig[ confirmAction ] ) {
			return;
		}
		confirmConfig[ confirmAction ].action();
		setConfirmAction( null );
	};

	const requestConfirm = ( action ) => {
		setConfirmAction( action );
		setConfirmConfig( {
			delete: {
				title: __( 'Revoke Webhook Secret', 'rest-api-firewall' ),
				content: __(
					'The current secret will be cleared when the webhook is saved.',
					'rest-api-firewall'
				),
				action: () => {
					setHasSecret( false );
					setRevealedSecret( null );
					setUseCustomSecret( false );
					onChange( null );
				},
			},
			regenerate: {
				title: hasSecret
					? __( 'Regenerate Webhook Secret', 'rest-api-firewall' )
					: __( 'Generate Webhook Secret', 'rest-api-firewall' ),
				content: hasSecret
					? __(
							'A new secret will replace the current one when the webhook is saved.',
							'rest-api-firewall'
					  )
					: __(
							'A new secret will be generated and saved with the webhook.',
							'rest-api-firewall'
					  ),
				action: () => {
					const secret = generateSecret();
					setHasSecret( true );
					setRevealedSecret( secret );
					setUseCustomSecret( false );
					onChange( secret );
				},
			},
		} );
	};

	return (
		<>
			<Stack spacing={ 4 }>
				<Stack>
					<Collapse in={ ! useCustomSecret } timeout="auto">
						<WebhookAuthGenerated
							hasSecret={ hasSecret }
							webhookSecret={ revealedSecret }
						/>
					</Collapse>
					<Collapse in={ useCustomSecret } timeout="auto">
						<WebhookAuthCustom
							hasSecret={ hasSecret }
							customSecret={ customSecret }
							setCustomSecret={ ( value ) => {
								setCustomSecret( value );
								if ( value ) onChange( value );
							} }
						/>
					</Collapse>
				</Stack>

				<Stack
					direction="row"
					gap={ 2 }
					alignItems="center"
					flexWrap="wrap"
				>
					<FormControlLabel
						sx={ { flex: 1, flexBasis: '100%', px: 1 } }
						control={
							<Checkbox
								checked={ useCustomSecret }
								onChange={ ( e ) =>
									setUseCustomSecret( e.target.checked )
								}
								size="small"
							/>
						}
						label={ __(
							'I will use my own secret',
							'rest-api-firewall'
						) }
					/>

					<Button
						variant="outlined"
						size="small"
						startIcon={ <DeleteOutlineIcon /> }
						onClick={ () => requestConfirm( 'delete' ) }
						disabled={ ! hasSecret }
					>
						{ __( 'Revoke', 'rest-api-firewall' ) }
					</Button>

					<Button
						size="small"
						variant="contained"
						disableElevation
						startIcon={ <AutorenewIcon /> }
						onClick={ () => requestConfirm( 'regenerate' ) }
						disabled={ useCustomSecret }
					>
						{ hasSecret && ! useCustomSecret
							? __( 'Regenerate', 'rest-api-firewall' )
							: __( 'Generate', 'rest-api-firewall' ) }
					</Button>

				</Stack>

				<Stack
					direction="row"
					spacing={ 1 }
					alignItems="center"
					onClick={ () => setShowSecretGuide( ! showSecretGuide ) }
					sx={ { px: 1, cursor: 'pointer', userSelect: 'none' } }
				>
					<Typography
						variant="body1"
						color="primary"
						sx={ { flex: 1 } }
					>
						{ __(
							'How to validate the secret in my application?',
							'rest-api-firewall'
						) }
					</Typography>
					<ExpandMoreIcon />
				</Stack>

				<Collapse in={ showSecretGuide } timeout="auto">
					<Stack
						spacing={ 1.5 }
						sx={ { p: 2, bgcolor: 'grey.50', borderRadius: 1 } }
					>
						<Typography variant="body2">
							{ __(
								'The secret is used to sign webhook requests using HMAC-SHA256. Your application must validate the',
								'rest-api-firewall'
							) }{ ' ' }
							<code>X-Webhook-Signature</code>{ ' ' }
							{ __(
								'header by computing:',
								'rest-api-firewall'
							) }
						</Typography>
						<Box
							component="pre"
							sx={ {
								p: 1.5,
								bgcolor: '#f5f5f5',
								borderRadius: 1,
								border: '1px solid #e0e0e0',
								fontSize: '0.85rem',
								overflow: 'auto',
								fontFamily: 'monospace',
							} }
						>
							{ 'hash_hmac("sha256", payload + timestamp, secret)' }
						</Box>
						<Typography variant="body2">
							{ __(
								'The timestamp is sent in the',
								'rest-api-firewall'
							) }{ ' ' }
							<code>X-Webhook-Timestamp</code>{ ' ' }
							{ __( 'header.', 'rest-api-firewall' ) }
						</Typography>
					</Stack>
				</Collapse>
			</Stack>

			<Dialog
				open={ confirmOpen }
				onClose={ () => setConfirmAction( null ) }
				aria-labelledby="wh-secret-confirm-title"
				maxWidth="xs"
			>
				<DialogTitle id="wh-secret-confirm-title">
					{ confirmAction && confirmConfig[ confirmAction ]?.title }
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{ confirmAction &&
							confirmConfig[ confirmAction ]?.content }
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={ () => setConfirmAction( null ) }
						variant="outlined"
					>
						{ __( 'Cancel', 'rest-api-firewall' ) }
					</Button>
					<Button onClick={ handleConfirm } variant="contained">
						{ __( 'Confirm', 'rest-api-firewall' ) }
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
