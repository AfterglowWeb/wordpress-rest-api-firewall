import { useCallback, useState } from '@wordpress/element';
import { useAdminData } from '../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../contexts/DialogContext';

export default function useSaveOptions() {
	const { adminData, updateAdminData } = useAdminData();
	const { openDialog, updateDialog } = useDialog();
	const { __ } = wp.i18n || {};
	const [ saving, setSaving ] = useState( false );

	const save = useCallback(
		async ( options, config = {} ) => {
			const {
				action = 'rest_api_firewall_update_options',
				successTitle = __( 'Settings Saved', 'rest-api-firewall' ),
				successMessage = __( 'Settings saved successfully.', 'rest-api-firewall' ),
				confirmTitle = __( 'Confirm Save', 'rest-api-firewall' ),
				confirmMessage = __( 'Are you sure you want to save these settings?', 'rest-api-firewall' ),
				skipConfirm = false,
				onSuccess,
			} = config;

			const doSave = async () => {
				updateDialog( {
					type: DIALOG_TYPES.LOADING,
					title: __( 'Saving', 'rest-api-firewall' ),
					content: __( 'Saving settings...', 'rest-api-firewall' ),
				} );

				setSaving( true );

				try {
					const response = await fetch( adminData.ajaxurl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
						},
						body: new URLSearchParams( {
							action,
							nonce: adminData.nonce,
							options: JSON.stringify( options ),
						} ),
					} );

					const result = await response.json();

					if ( result?.success ) {
						if ( result.data?.options ) {
							updateAdminData( {
								admin_options: {
									...adminData.admin_options,
									...result.data.options,
								},
							} );
						}

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
					} else {
						const errorMessage = result?.data?.error || result?.data?.message || __( 'Unknown error', 'rest-api-firewall' );
						updateDialog( {
							type: DIALOG_TYPES.ERROR,
							title: __( 'Error', 'rest-api-firewall' ),
							content: __( 'Failed to save settings: ', 'rest-api-firewall' ) + errorMessage,
						} );
						return { success: false, error: errorMessage };
					}
				} catch ( error ) {
					updateDialog( {
						type: DIALOG_TYPES.ERROR,
						title: __( 'Error', 'rest-api-firewall' ),
						content: __( 'Error saving settings: ', 'rest-api-firewall' ) + error.message,
					} );
					return { success: false, error: error.message };
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
		[ adminData, updateAdminData, openDialog, updateDialog, __ ]
	);

	return { save, saving };
}
