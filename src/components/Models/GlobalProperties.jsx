import { useLicense } from '../../contexts/LicenseContext';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export default function GlobalProperties( { form, setField } ) {
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	const Item = ( { name, label, tip, disabled = false, indent = false } ) => {
		const isDisabled = ! hasValidLicense || disabled === true;

		return (
		<Tooltip title={ tip || '' } placement="bottom-start" followCursor>
			<FormControlLabel
				disabled={ isDisabled }
				control={
					<Checkbox
						size="small"
						checked={ !! form[ name ] }
						name={ name }
						onChange={ setField }
					/>
				}
				label={
					<Typography sx={{color: isDisabled ? 'text.disabled' : 'text.primary'  }} variant="caption">{ label }</Typography>
				}
				sx={ {
					width: '50%',
					minWidth: 360,
					mr: 0,
					/*...( indent && { pl: 2 } ),*/
				} }
			/>
		</Tooltip>
		);
	};

	const groupLabel = ( text ) => (
		<Typography
			variant="caption"
			sx={ {
				textTransform: 'uppercase',
				letterSpacing: 0.5,
				fontWeight: 600,
				color: ! hasValidLicense ? 'text.disabled' : 'text.secondary',
			} }
		>
			{ text }
		</Typography>
	);

	return (
		<Stack spacing={ 2 }>

			{ /* ── Group 1: applies to ALL object types ── */ }
			<Stack spacing={ 0.5 }>
				{ groupLabel( __( 'All Object Types', 'rest-api-firewall' ) ) }
				<FormGroup sx={ { flexDirection: 'row', flexWrap: 'wrap' } }>
					<Item

						name="rest_models_relative_url_enabled"
						label={ __( 'Relative URLs', 'rest-api-firewall' ) }
						tip={ __( 'Remove the host from post and term URLs.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_relative_attachment_url_enabled"
						label={ __( 'Relative Attachment URLs', 'rest-api-firewall' ) }
						tip={ __( 'Remove the host and upload path from attachment URLs.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_remove_links_prop"
						label={ __( 'Remove `_links`', 'rest-api-firewall' ) }
						tip={ __( 'Remove the `_links` property from REST responses.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_remove_embed_prop"
						label={ __( 'Remove `_embed`', 'rest-api-firewall' ) }
						tip={ __( 'Remove the `_embed` property from REST responses.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_remove_empty_props"
						label={ __( 'Remove Empty Properties', 'rest-api-firewall' ) }
						tip={ __( 'Remove properties with empty values from REST responses.', 'rest-api-firewall' ) }
					/>
					<Item
						disabled={ !form.rest_models_remove_empty_props }
						name="rest_models_remove_empty_props_recursively"
						label={ __( 'Apply to Sub Properties', 'rest-api-firewall' ) }
						tip={ __( 'Also apply empty-property removal to nested properties.', 'rest-api-firewall' ) }
						indent
					/>
				</FormGroup>
			</Stack>

			{ /* ── Group 2: post-type objects only ── */ }
			<Stack spacing={ 0.5 }>
				{ groupLabel( __( 'Post Types Only', 'rest-api-firewall' ) ) }
				<FormGroup sx={ { flexDirection: 'row', flexWrap: 'wrap' } }>
					<Item
						name="rest_models_resolve_rendered_props"
						label={ __( 'Flatten `rendered`', 'rest-api-firewall' ) }
						tip={ __( 'Move the `rendered` value up to its parent.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_embed_featured_attachment_enabled"
						label={ __( 'Resolve Featured Attachments', 'rest-api-firewall' ) }
						tip={ __( 'Replace the featured attachment ID with its configured properties.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_embed_post_attachments_enabled"
						label={ __( 'Resolve Attachments', 'rest-api-firewall' ) }
						tip={ __( 'Collect featured, content, and ACF image/gallery attachments into a single `attachments` property.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_embed_terms_enabled"
						label={ __( 'Resolve Terms', 'rest-api-firewall' ) }
						tip={ __( 'Replace term IDs with their configured properties.', 'rest-api-firewall' ) }
					/>
					<Item
						name="rest_models_embed_author_enabled"
						label={ __( 'Resolve Authors', 'rest-api-firewall' ) }
						tip={ __( 'Replace the author ID with its configured properties.', 'rest-api-firewall' ) }
					/>
				</FormGroup>
			</Stack>

		</Stack>
	);
}
