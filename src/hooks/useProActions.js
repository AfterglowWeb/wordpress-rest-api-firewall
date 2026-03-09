import { useCallback, useState } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';
import { useLicense } from '../contexts/LicenseContext';
import { useDialog, DIALOG_TYPES } from '../contexts/DialogContext';

export default function useProActions() {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { openDialog, updateDialog } = useDialog();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const [ saving, setSaving ] = useState( false );

	const request = useCallback(
		async ( payload ) => {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( { nonce, ...payload } ),
			} );
			return response.json();
		},
		[ adminData, nonce ]
	);

	const save = useCallback(
		async ( payload, config = {} ) => {
			const {
				successTitle = __( 'Saved', 'rest-api-firewall' ),
				successMessage = __(
					'Saved successfully.',
					'rest-api-firewall'
				),
				confirmTitle = __( 'Confirm Save', 'rest-api-firewall' ),
				confirmMessage = __( 'Save changes?', 'rest-api-firewall' ),
				skipConfirm = false,
				onSuccess,
			} = config;

			const doSave = async () => {
				openDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Saving…', 'rest-api-firewall' ),
				} );
				setSaving( true );

				try {
					const result = await request( payload );

					if ( result?.success ) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: successTitle,
							content: successMessage,
							autoClose: 2000,
						} );
						if ( onSuccess ) {
							onSuccess( result.data );
						}
						return { success: true, data: result.data };
					}

					const msg =
						result?.data?.message ||
						result?.data?.error ||
						__( 'Unknown error', 'rest-api-firewall' );
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: msg,
					} );
					return { success: false, error: msg };
				} catch ( err ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: err.message,
					} );
					return { success: false, error: err.message };
				} finally {
					setSaving( false );
				}
			};

			if ( skipConfirm ) {
				return doSave();
			}

			openDialog( {
				type: DIALOG_TYPES.CONFIRM,
				title: confirmTitle,
				content: confirmMessage,
				onConfirm: doSave,
			} );
		},
		[ request, openDialog, updateDialog, __ ]
	);

	const remove = useCallback(
		async ( payload, config = {} ) => {
			const {
				successTitle = __( 'Deleted', 'rest-api-firewall' ),
				successMessage = __(
					'Deleted successfully.',
					'rest-api-firewall'
				),
				confirmTitle = __( 'Confirm Delete', 'rest-api-firewall' ),
				confirmMessage = __(
					'Are you sure you want to delete this? This action cannot be undone.',
					'rest-api-firewall'
				),
				confirmLabel = __( 'Delete', 'rest-api-firewall' ),
				onSuccess,
			} = config;

			const doDelete = async () => {
				openDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Deleting', 'rest-api-firewall' ),
					content: __( 'Deleting…', 'rest-api-firewall' ),
				} );

				try {
					const result = await request( payload );

					if ( result?.success ) {
						updateDialog( {
							type: DIALOG_TYPES.SUCCESS,
							title: successTitle,
							content: successMessage,
							autoClose: 1500,
						} );
						if ( onSuccess ) {
							onSuccess( result.data );
						}
						return { success: true };
					}

					const msg =
						result?.data?.message ||
						result?.data?.error ||
						__( 'Unknown error', 'rest-api-firewall' );
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: msg,
					} );
					return { success: false, error: msg };
				} catch ( err ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: err.message,
					} );
					return { success: false, error: err.message };
				}
			};

			openDialog( {
				type: DIALOG_TYPES.CONFIRM,
				title: confirmTitle,
				content: confirmMessage,
				confirmLabel,
				onConfirm: doDelete,
			} );
		},
		[ request, openDialog, updateDialog, __ ]
	);

	return { save, remove, saving };
}
