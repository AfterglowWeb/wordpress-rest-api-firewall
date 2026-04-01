import { useState, useEffect } from '@wordpress/element';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

/**
 * A confirmation dialog that requires the user to type a specific string
 * before the confirm button becomes active. Used for irreversible destructive actions.
 *
 * @param {object}   props
 * @param {boolean}  props.open         - Whether the dialog is open.
 * @param {string}   props.title        - Dialog title.
 * @param {string}   props.message      - Descriptive message shown above the input.
 * @param {string}   props.requiredText - The exact string the user must type.
 * @param {string}   props.confirmLabel - Label for the confirm button.
 * @param {string}   props.cancelLabel  - Label for the cancel button.
 * @param {Function} props.onConfirm    - Called when the user confirms.
 * @param {Function} props.onCancel     - Called when the dialog is dismissed.
 * @param {boolean}  props.loading      - Disables both buttons during an async operation.
 */
export default function ConfirmWithInputDialog( {
	open,
	title,
	message,
	requiredText = '',
	confirmLabel,
	cancelLabel,
	onConfirm,
	onCancel,
	loading = false,
} ) {
	const { __ } = wp.i18n || {};
	const [ input, setInput ] = useState( '' );

	useEffect( () => {
		if ( ! open ) {
			setInput( '' );
		}
	}, [ open ] );

	const canConfirm = requiredText.length > 0 && input.trim() === requiredText && ! loading;

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' && canConfirm ) {
			onConfirm?.();
		}
	};

	return (
		<Dialog open={ !! open } onClose={ onCancel } maxWidth="sm" fullWidth>
			<DialogTitle>{ title }</DialogTitle>
			<DialogContent>
				<Stack spacing={ 2 } pt={ 1 }>
					{ message && (
						<Typography variant="body2">{ message }</Typography>
					) }
					<Typography variant="body2" color="text.secondary">
						{ __( 'Type', 'rest-api-firewall' ) }{ ' ' }
						<strong>{ requiredText }</strong>{ ' ' }
						{ __( 'to confirm.', 'rest-api-firewall' ) }
					</Typography>
					<TextField
						size="small"
						fullWidth
						autoFocus
						value={ input }
						onChange={ ( e ) => setInput( e.target.value ) }
						onKeyDown={ handleKeyDown }
						placeholder={ requiredText }
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button size="small" onClick={ onCancel } disabled={ loading }>
					{ cancelLabel || __( 'Cancel', 'rest-api-firewall' ) }
				</Button>
				<Button
					size="small"
					variant="contained"
					color="error"
					disableElevation
					onClick={ onConfirm }
					disabled={ ! canConfirm }
				>
					{ confirmLabel || __( 'Delete', 'rest-api-firewall' ) }
				</Button>
			</DialogActions>
		</Dialog>
	);
}
