import { useState, useEffect, useCallback } from '@wordpress/element';
import { useLicense } from '../contexts/LicenseContext';

export default function useSettingsForm( {
	adminData,
	updateAdminData,
	action,
} ) {

	const [ adminOptions, setAdminOptions ] = useState( {} );
	const { hasValidLicense } = useLicense();
	const [ form, setForm ] = useState( {
		/** Free core options */
		rest_models_enabled: false,
		rest_models_embed_featured_attachment_enabled: false,
		rest_models_embed_post_attachments_enabled: false,
		rest_models_resolve_rendered_props: false,
		rest_models_embed_terms_enabled: false,
		rest_models_embed_author_enabled: false,
		rest_models_with_acf_enabled: false,
		rest_firewall_remove_links_prop: false,
		rest_models_remove_empty_props: false,
		rest_api_posts_per_page: 100,
		rest_api_attachments_per_page: 100,
		application_host: '',
		application_webhook_endpoint: '',
		theme_redirect_templates_enabled: false,
		theme_redirect_templates_preset_url: '',
		theme_disable_gutenberg: false,
		theme_disable_comments: false,
		theme_remove_empty_p_tags_enabled: false,
		theme_max_upload_weight: 1024,
		theme_max_upload_weight_enabled: false,
		theme_svg_webp_support_enabled: false,
		theme_json_acf_fields_enabled: false,
	} );

	useEffect( () => {
		if ( ! adminData?.admin_options ) {
			return;
		}
		setAdminOptions( adminData.admin_options );
	}, [ adminData ] );

	useEffect( () => {
		if ( ! adminOptions ) {
			return;
		}

		const baseForm = {

			rest_models_enabled: Boolean(
				adminOptions.rest_models_enabled
			),
			rest_models_embed_featured_attachment_enabled: Boolean(
				adminOptions.rest_models_embed_featured_attachment_enabled
			),
			rest_models_embed_author_enabled: Boolean(
				adminOptions.rest_models_embed_author_enabled
			),
			rest_models_embed_post_attachments_enabled: Boolean(
				adminOptions.rest_models_embed_post_attachments_enabled
			),
			rest_models_resolve_rendered_props: Boolean(
				adminOptions.rest_models_resolve_rendered_props
			),
			rest_models_embed_terms_enabled: Boolean(
				adminOptions.rest_models_embed_terms_enabled
			),
			rest_models_with_acf_enabled: Boolean(
				adminOptions.rest_models_with_acf_enabled
			),
			rest_models_remove_empty_props: Boolean(
				adminOptions.rest_models_remove_empty_props
			),
			rest_firewall_remove_links_prop: Boolean(
				adminOptions.rest_firewall_remove_links_prop
			),
			rest_api_posts_per_page: Number(
				adminOptions.rest_api_posts_per_page ?? 100
			),
			rest_api_attachments_per_page: Number(
				adminOptions.rest_api_attachments_per_page ?? 100
			),

			application_host: adminOptions.application_host ?? '',
			application_webhook_endpoint: adminOptions.application_webhook_endpoint ?? '',

			theme_redirect_templates_enabled: Boolean(
				adminOptions.theme_redirect_templates_enabled
			),
			theme_redirect_templates_preset_url: adminOptions.theme_redirect_templates_preset_url ?? '',

			theme_disable_gutenberg: Boolean(
				adminOptions.theme_disable_gutenberg
			),
			theme_disable_comments: Boolean(
				adminOptions.theme_disable_comments
			),
			theme_remove_empty_p_tags_enabled: Boolean(
				adminOptions.theme_remove_empty_p_tags_enabled
			),
			theme_max_upload_weight: Number(
				adminOptions.theme_max_upload_weight ?? 1024
			),
			theme_max_upload_weight_enabled: Boolean(
				adminOptions.theme_max_upload_weight_enabled
			),
			theme_svg_webp_support_enabled: Boolean(
				adminOptions.theme_svg_webp_support_enabled
			),
			theme_json_acf_fields_enabled: Boolean(
				adminOptions.theme_json_acf_fields_enabled
			),
		};

		if ( hasValidLicense ) {
			baseForm.rest_models_relative_url_enabled = Boolean(
				adminOptions.rest_models_relative_url_enabled ?? false
			);
			baseForm.rest_models_relative_attachment_url_enabled = Boolean(
				adminOptions.rest_models_relative_attachment_url_enabled ?? false
			);
			baseForm.rest_api_restrict_post_types_enabled = Boolean(
				adminOptions.rest_api_restrict_post_types_enabled ?? false
			);
			baseForm.rest_api_allowed_post_types = Array.isArray(
				adminOptions.rest_api_allowed_post_types
			) ? adminOptions.rest_api_allowed_post_types : [];
			baseForm.theme_redirect_templates_free_url_enabled = Boolean(
				adminOptions.theme_redirect_templates_free_url_enabled ?? false
			);
			baseForm.theme_redirect_templates_free_url =
				adminOptions.theme_redirect_templates_free_url ?? '';
		}

		setForm( baseForm );
	}, [ adminOptions, hasValidLicense ] );

	const setField = useCallback( ( eventOrName, maybeValue ) => {
		if ( eventOrName?.target ) {
			const { name, value, type, checked } = eventOrName.target;
			if ( ! name ) {
				return;
			}

			setForm( ( prev ) => ( {
				...prev,
				[ name ]: type === 'checkbox' ? Boolean( checked ) : value,
			} ) );
			return;
		}

		if ( typeof eventOrName === 'string' ) {
			setForm( ( prev ) => ( {
				...prev,
				[ eventOrName ]: maybeValue,
			} ) );
		}
	}, [] );

	const setSlider = useCallback( ( name, value ) => {
		const numericValue = Array.isArray( value )
			? Number( value[ 0 ] )
			: Number( value );

		setForm( ( prev ) => ( {
			...prev,
			[ name ]: Number.isFinite( numericValue ) ? numericValue : 0,
		} ) );
	}, [] );

	const mapFormToAdminOptions = useCallback(
		( formData ) => {

			const mapped = {
				rest_models_enabled: formData.rest_models_enabled,
				rest_models_embed_featured_attachment_enabled:
					formData.rest_models_embed_featured_attachment_enabled,
				rest_models_embed_post_attachments_enabled:
					formData.rest_models_embed_post_attachments_enabled,
				rest_models_resolve_rendered_props:
					formData.rest_models_resolve_rendered_props,
				rest_models_embed_terms_enabled: formData.rest_models_embed_terms_enabled,
				rest_models_embed_author_enabled: formData.rest_models_embed_author_enabled,
				rest_models_with_acf_enabled: formData.rest_models_with_acf_enabled,
				rest_models_remove_empty_props: formData.rest_models_remove_empty_props,
				rest_firewall_remove_links_prop: formData.rest_firewall_remove_links_prop,

				rest_api_posts_per_page: formData.rest_api_posts_per_page,
				rest_api_attachments_per_page: formData.rest_api_attachments_per_page,

				application_host: formData.application_host,
				application_webhook_endpoint: formData.application_webhook_endpoint,

				theme_redirect_templates_enabled: formData.theme_redirect_templates_enabled,
				theme_redirect_templates_preset_url: formData.theme_redirect_templates_preset_url,

				theme_svg_webp_support_enabled: formData.theme_svg_webp_support_enabled,
				theme_max_upload_weight: formData.theme_max_upload_weight,
				theme_max_upload_weight_enabled: formData.theme_max_upload_weight_enabled,

				theme_disable_gutenberg: formData.theme_disable_gutenberg,
				theme_disable_comments: formData.theme_disable_comments,
				theme_remove_empty_p_tags_enabled: formData.theme_remove_empty_p_tags_enabled,
				theme_json_acf_fields_enabled: formData.theme_json_acf_fields_enabled,
			};

			if ( hasValidLicense ) {
				mapped.rest_models_relative_url_enabled =
					formData.rest_models_relative_url_enabled;
				mapped.rest_models_relative_attachment_url_enabled =
					formData.rest_models_relative_attachment_url_enabled;
				mapped.rest_api_restrict_post_types_enabled =
					formData.rest_api_restrict_post_types_enabled;
				mapped.rest_api_allowed_post_types = formData.rest_api_allowed_post_types;
				mapped.theme_redirect_templates_free_url_enabled =
					formData.theme_redirect_templates_free_url_enabled;
				mapped.theme_redirect_templates_free_url =
					formData.theme_redirect_templates_free_url;
			}

			return mapped;
		},
		[ hasValidLicense ]
	);

	const submit = useCallback( async () => {
		if ( ! adminData?.nonce || ! adminData?.ajaxurl ) {
			throw new Error( 'Missing AJAX configuration' );
		}

		const response = await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action,
				nonce: adminData.nonce,
				options: JSON.stringify( form ),
			} ),
		} );

		const data = await response.json();

		if ( ! data.success ) {
			throw new Error( data.data?.error || 'Unknown error' );
		}

		updateAdminData( {
			admin_options: {
				...adminOptions,
				...mapFormToAdminOptions( form ),
			},
		} );
	}, [
		adminData,
		form,
		updateAdminData,
		adminOptions,
		mapFormToAdminOptions,
		action,
	] );

	return {
		form,
		setField,
		setSlider,
		submit,
	};
}
